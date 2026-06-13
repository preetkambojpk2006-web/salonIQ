-- SalonIQ: walk-in virtual queue (additive)
-- Safe to re-run where noted (IF NOT EXISTS / OR REPLACE)
--
-- Public customers join via SECURITY DEFINER RPCs (anon EXECUTE only).
-- Staff assignment is "any available staff" — no per-staff columns on walkin_queue.

-- ---------------------------------------------------------------------------
-- 1. Helpers — phone, IST date, salon hours, wait-time math
-- ---------------------------------------------------------------------------

-- Match app normalizeIndianPhone: digits only; strip leading 91 from 12-digit input.
create or replace function public.normalize_walkin_phone(p_phone text)
returns text
language sql
immutable
as $$
  with digits as (
    select regexp_replace(trim(coalesce(p_phone, '')), '\D', '', 'g') as d
  )
  select case
    when length(d) = 12 and left(d, 2) = '91' then substring(d from 3 for 10)
    else d
  end
  from digits;
$$;

-- Calendar date in salon timezone (Asia/Kolkata).
create or replace function public.walkin_ist_date(p_ts timestamptz default now())
returns date
language sql
stable
as $$
  select (coalesce(p_ts, now()) at time zone 'Asia/Kolkata')::date;
$$;

create or replace function public.walkin_business_id_from_slug(p_slug text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select b.id
  from public.businesses b
  where b.booking_slug = trim(p_slug)
  limit 1;
$$;

-- V1 walk-in hours mirror public booking: 10:00–20:00 IST (opening_hours JSON is display-only).
create or replace function public.walkin_is_salon_open(p_at timestamptz default now())
returns boolean
language sql
stable
as $$
  select (
    (p_at at time zone 'Asia/Kolkata')::time >= time '10:00'
    and (p_at at time zone 'Asia/Kolkata')::time < time '20:00'
  );
$$;

create or replace function public.walkin_active_staff_count(p_business_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.staff st
  where st.business_id = p_business_id
    and st.is_active = true;
$$;

create or replace function public.walkin_has_active_services(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.services s
    where s.business_id = p_business_id
      and s.is_active = true
  );
$$;

-- Average active service duration; fallback 30 min when no services (should not join if none).
create or replace function public.walkin_avg_service_duration_mins(p_business_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select greatest(1, round(avg(s.duration_mins))::integer)
      from public.services s
      where s.business_id = p_business_id
        and s.is_active = true
    ),
    30
  );
$$;

-- Staff physically busy on confirmed calendar blocks (NOT online/other pending).
create or replace function public.walkin_busy_staff_from_appointments(
  p_business_id uuid,
  p_at timestamptz default now()
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct a.staff_name)::integer
  from public.appointments a
  where a.business_id = p_business_id
    and a.staff_name is not null
    and trim(a.staff_name) <> ''
    and a.status = 'confirmed'
    and a.start_time <= p_at
    and coalesce(a.end_time, a.start_time + interval '1 hour') > p_at;
$$;

-- ---------------------------------------------------------------------------
-- 2. Table walkin_queue
-- ---------------------------------------------------------------------------
create table if not exists public.walkin_queue (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  public_token text not null,
  daily_token_number integer not null check (daily_token_number > 0),
  status text not null default 'waiting'
    check (status in ('waiting', 'called', 'in_service', 'done', 'left', 'no_show')),
  joined_at timestamptz not null default now(),
  called_at timestamptz,
  service_started_at timestamptz,
  completed_at timestamptz,
  estimated_wait_mins integer check (estimated_wait_mins is null or estimated_wait_mins >= 0)
);

comment on column public.walkin_queue.estimated_wait_mins is
  'Snapshot at join time; live UI should recompute via walkin_compute_wait_mins.';

create index if not exists walkin_queue_business_status_idx
  on public.walkin_queue (business_id, status);

create index if not exists walkin_queue_business_joined_at_idx
  on public.walkin_queue (business_id, joined_at);

create unique index if not exists walkin_queue_business_public_token_unique
  on public.walkin_queue (business_id, public_token);

-- Human token # unique per salon per IST calendar day.
create unique index if not exists walkin_queue_daily_token_unique
  on public.walkin_queue (
    business_id,
    ((joined_at at time zone 'Asia/Kolkata')::date),
    daily_token_number
  );

create index if not exists walkin_queue_public_token_idx
  on public.walkin_queue (public_token);

create index if not exists walkin_queue_business_phone_day_idx
  on public.walkin_queue (business_id, customer_phone, joined_at desc);

-- ---------------------------------------------------------------------------
-- 3. Wait-time helpers (depend on walkin_queue table)
-- ---------------------------------------------------------------------------

-- Each in_service walk-in consumes one staff slot (any-available-staff pool).
create or replace function public.walkin_in_service_count(
  p_business_id uuid,
  p_day date default public.walkin_ist_date()
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.walkin_queue w
  where w.business_id = p_business_id
    and w.status = 'in_service'
    and public.walkin_ist_date(w.joined_at) = p_day;
$$;

-- Wait-time estimate (minutes) for a new joiner or an existing queue row.
-- Formula (see inline comments):
--   free_staff = active_staff - min(active_staff, appt_busy + walkin_in_service)
--   work_ahead = sum(avg_dur for waiting ahead) + remaining in_service + remaining appointments
--   estimate = ceil(work_ahead / greatest(free_staff, 1))
create or replace function public.walkin_compute_wait_mins(
  p_business_id uuid,
  p_entry_id uuid default null
)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_avg_dur integer;
  v_active integer;
  v_appt_busy integer;
  v_walkin_busy integer;
  v_busy integer;
  v_free integer;
  v_waiting_work numeric;
  v_inservice_remaining numeric;
  v_appt_remaining numeric;
  v_total_work numeric;
  v_joined_at timestamptz;
begin
  v_avg_dur := public.walkin_avg_service_duration_mins(p_business_id);
  v_active := public.walkin_active_staff_count(p_business_id);
  v_appt_busy := public.walkin_busy_staff_from_appointments(p_business_id, now());
  v_walkin_busy := public.walkin_in_service_count(p_business_id, public.walkin_ist_date());

  -- Concurrent busy slots capped by active staff headcount.
  v_busy := least(v_active, v_appt_busy + v_walkin_busy);
  v_free := greatest(v_active - v_busy, 1);

  if p_entry_id is not null then
    select w.joined_at
    into v_joined_at
    from public.walkin_queue w
    where w.id = p_entry_id
      and w.business_id = p_business_id;
  end if;

  -- Minutes of work for customers still waiting ahead of this entry (or entire queue if new joiner).
  select coalesce(count(*) * v_avg_dur, 0)
  into v_waiting_work
  from public.walkin_queue w
  where w.business_id = p_business_id
    and w.status = 'waiting'
    and public.walkin_ist_date(w.joined_at) = public.walkin_ist_date()
    and (
      p_entry_id is null
      or v_joined_at is null
      or w.joined_at < v_joined_at
    );

  -- Remaining minutes for walk-ins currently being served.
  select coalesce(
    sum(
      greatest(
        0,
        v_avg_dur - extract(epoch from (now() - w.service_started_at)) / 60.0
      )
    ),
    0
  )
  into v_inservice_remaining
  from public.walkin_queue w
  where w.business_id = p_business_id
    and w.status = 'in_service'
    and w.service_started_at is not null
    and public.walkin_ist_date(w.joined_at) = public.walkin_ist_date();

  -- Remaining minutes on confirmed appointment blocks still in progress.
  select coalesce(
    sum(
      greatest(
        0,
        extract(
          epoch from (
            coalesce(a.end_time, a.start_time + interval '1 hour') - now()
          )
        ) / 60.0
      )
    ),
    0
  )
  into v_appt_remaining
  from public.appointments a
  where a.business_id = p_business_id
    and a.status = 'confirmed'
    and a.start_time <= now()
    and coalesce(a.end_time, a.start_time + interval '1 hour') > now();

  v_total_work := v_waiting_work + v_inservice_remaining + v_appt_remaining;

  return greatest(0, ceil(v_total_work / v_free)::integer);
end;
$$;

revoke all on function public.normalize_walkin_phone(text) from public;
revoke all on function public.walkin_ist_date(timestamptz) from public;
revoke all on function public.walkin_business_id_from_slug(text) from public;
revoke all on function public.walkin_is_salon_open(timestamptz) from public;
revoke all on function public.walkin_active_staff_count(uuid) from public;
revoke all on function public.walkin_has_active_services(uuid) from public;
revoke all on function public.walkin_avg_service_duration_mins(uuid) from public;
revoke all on function public.walkin_busy_staff_from_appointments(uuid, timestamptz) from public;
revoke all on function public.walkin_in_service_count(uuid, date) from public;
revoke all on function public.walkin_compute_wait_mins(uuid, uuid) from public;

grant execute on function public.normalize_walkin_phone(text) to authenticated;
grant execute on function public.walkin_ist_date(timestamptz) to authenticated;
grant execute on function public.walkin_business_id_from_slug(text) to authenticated;
grant execute on function public.walkin_is_salon_open(timestamptz) to authenticated;
grant execute on function public.walkin_active_staff_count(uuid) to authenticated;
grant execute on function public.walkin_has_active_services(uuid) to authenticated;
grant execute on function public.walkin_avg_service_duration_mins(uuid) to authenticated;
grant execute on function public.walkin_busy_staff_from_appointments(uuid, timestamptz) to authenticated;
grant execute on function public.walkin_in_service_count(uuid, date) to authenticated;
grant execute on function public.walkin_compute_wait_mins(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS — mirror appointments (current_user_business_ids)
-- ---------------------------------------------------------------------------
alter table public.walkin_queue enable row level security;

drop policy if exists "walkin_queue_select_own_business" on public.walkin_queue;
create policy "walkin_queue_select_own_business"
  on public.walkin_queue
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

drop policy if exists "walkin_queue_insert_own_business" on public.walkin_queue;
create policy "walkin_queue_insert_own_business"
  on public.walkin_queue
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "walkin_queue_update_own_business" on public.walkin_queue;
create policy "walkin_queue_update_own_business"
  on public.walkin_queue
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "walkin_queue_delete_own_business" on public.walkin_queue;
create policy "walkin_queue_delete_own_business"
  on public.walkin_queue
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

grant select, insert, update, delete on table public.walkin_queue to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Public RPC: queue context (read-only)
-- ---------------------------------------------------------------------------
create or replace function public.get_public_queue_context(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_salon_name text;
  v_opening_hours_display text;
  v_is_open boolean;
  v_staff_count integer;
  v_has_services boolean;
  v_queue_length integer;
  v_estimated_wait integer;
begin
  if p_slug is null or trim(p_slug) = '' then
    return null;
  end if;

  select b.id, b.name, coalesce(b.opening_hours ->> 'display', '')
  into v_business_id, v_salon_name, v_opening_hours_display
  from public.businesses b
  where b.booking_slug = trim(p_slug);

  if not found then
    return null;
  end if;

  v_is_open := public.walkin_is_salon_open(now());
  v_staff_count := public.walkin_active_staff_count(v_business_id);
  v_has_services := public.walkin_has_active_services(v_business_id);

  select count(*)::integer
  into v_queue_length
  from public.walkin_queue w
  where w.business_id = v_business_id
    and w.status in ('waiting', 'called')
    and public.walkin_ist_date(w.joined_at) = public.walkin_ist_date();

  v_estimated_wait := public.walkin_compute_wait_mins(v_business_id, null);

  return jsonb_build_object(
    'salon_name', v_salon_name,
    'opening_hours_display', v_opening_hours_display,
    'is_open', v_is_open,
    'setup_complete', (v_staff_count > 0 and v_has_services),
    'active_staff_count', v_staff_count,
    'has_services', v_has_services,
    'queue_length', v_queue_length,
    'estimated_wait_mins', v_estimated_wait,
    'closed_message',
      case
        when not v_is_open then 'Salon abhi band hai. Walk-in queue 10am–8pm (IST) khulti hai.'
        when v_staff_count = 0 or not v_has_services then
          'Walk-in queue abhi setup ho rahi hai. Salon se seedha contact karein.'
        else null
      end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Public RPC: join queue
-- ---------------------------------------------------------------------------
create or replace function public.join_walkin_queue(
  p_slug text,
  p_name text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_phone text;
  v_existing record;
  v_daily_token integer;
  v_public_token text;
  v_entry_id uuid;
  v_position integer;
  v_estimated_wait integer;
  v_recent_joins integer;
begin
  if p_slug is null or trim(p_slug) = '' then
    raise exception 'INVALID_SLUG';
  end if;

  if p_name is null or trim(p_name) = '' then
    raise exception 'CUSTOMER_NAME_REQUIRED';
  end if;

  if p_phone is null or trim(p_phone) = '' then
    raise exception 'CUSTOMER_PHONE_REQUIRED';
  end if;

  v_business_id := public.walkin_business_id_from_slug(p_slug);
  if v_business_id is null then
    raise exception 'SALON_NOT_FOUND';
  end if;

  if not public.walkin_is_salon_open(now()) then
    raise exception 'SALON_CLOSED';
  end if;

  if public.walkin_active_staff_count(v_business_id) = 0 then
    raise exception 'NO_ACTIVE_STAFF';
  end if;

  if not public.walkin_has_active_services(v_business_id) then
    raise exception 'NO_ACTIVE_SERVICES';
  end if;

  v_phone := public.normalize_walkin_phone(p_phone);
  if length(v_phone) <> 10 or v_phone !~ '^[6789]' then
    raise exception 'INVALID_PHONE';
  end if;

  -- Dedupe: same phone already active in today's queue → return existing token.
  select
    w.id,
    w.public_token,
    w.daily_token_number,
    w.status,
    w.estimated_wait_mins
  into v_existing
  from public.walkin_queue w
  where w.business_id = v_business_id
    and w.customer_phone = v_phone
    and public.walkin_ist_date(w.joined_at) = public.walkin_ist_date()
    and w.status in ('waiting', 'called', 'in_service')
  order by w.joined_at desc
  limit 1;

  if found then
    v_position := (
      select count(*)::integer + 1
      from public.walkin_queue w2
      where w2.business_id = v_business_id
        and w2.status = 'waiting'
        and public.walkin_ist_date(w2.joined_at) = public.walkin_ist_date()
        and w2.joined_at < (
          select w3.joined_at from public.walkin_queue w3 where w3.id = v_existing.id
        )
    );

    if v_existing.status <> 'waiting' then
      v_position := 0;
    end if;

    return jsonb_build_object(
      'public_token', v_existing.public_token,
      'daily_token_number', v_existing.daily_token_number,
      'position', v_position,
      'estimated_wait_mins', public.walkin_compute_wait_mins(v_business_id, v_existing.id),
      'status', v_existing.status,
      'existing_entry', true
    );
  end if;

  -- Spam guard: max 3 NEW joins per phone per business per rolling 15 minutes.
  select count(*)::integer
  into v_recent_joins
  from public.walkin_queue w
  where w.business_id = v_business_id
    and w.customer_phone = v_phone
    and w.joined_at > now() - interval '15 minutes';

  if v_recent_joins >= 3 then
    raise exception 'RATE_LIMIT_EXCEEDED';
  end if;

  select coalesce(max(w.daily_token_number), 0) + 1
  into v_daily_token
  from public.walkin_queue w
  where w.business_id = v_business_id
    and public.walkin_ist_date(w.joined_at) = public.walkin_ist_date();

  v_public_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_estimated_wait := public.walkin_compute_wait_mins(v_business_id, null);

  insert into public.walkin_queue (
    business_id,
    customer_name,
    customer_phone,
    public_token,
    daily_token_number,
    status,
    estimated_wait_mins
  )
  values (
    v_business_id,
    trim(p_name),
    v_phone,
    v_public_token,
    v_daily_token,
    'waiting',
    v_estimated_wait
  )
  returning id into v_entry_id;

  v_position := (
    select count(*)::integer
    from public.walkin_queue w
    where w.business_id = v_business_id
      and w.status = 'waiting'
      and public.walkin_ist_date(w.joined_at) = public.walkin_ist_date()
      and w.joined_at < (select joined_at from public.walkin_queue where id = v_entry_id)
  ) + 1;

  return jsonb_build_object(
    'public_token', v_public_token,
    'daily_token_number', v_daily_token,
    'position', v_position,
    'estimated_wait_mins', v_estimated_wait,
    'status', 'waiting',
    'existing_entry', false
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Public RPC: customer status by secret token
-- ---------------------------------------------------------------------------
create or replace function public.get_walkin_queue_status(
  p_slug text,
  p_token text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_salon_name text;
  v_entry record;
  v_position integer;
begin
  if p_slug is null or trim(p_slug) = ''
     or p_token is null or trim(p_token) = '' then
    return null;
  end if;

  select b.id, b.name
  into v_business_id, v_salon_name
  from public.businesses b
  where b.booking_slug = trim(p_slug);

  if not found then
    return null;
  end if;

  select
    w.id,
    w.daily_token_number,
    w.status,
    w.joined_at,
    w.called_at,
    w.service_started_at,
    w.completed_at,
    w.estimated_wait_mins
  into v_entry
  from public.walkin_queue w
  where w.business_id = v_business_id
    and w.public_token = trim(p_token)
    and public.walkin_ist_date(w.joined_at) = public.walkin_ist_date()
  limit 1;

  if not found then
    return null;
  end if;

  if v_entry.status = 'waiting' then
    v_position := (
      select count(*)::integer + 1
      from public.walkin_queue w2
      where w2.business_id = v_business_id
        and w2.status = 'waiting'
        and public.walkin_ist_date(w2.joined_at) = public.walkin_ist_date()
        and w2.joined_at < v_entry.joined_at
    );
  else
    v_position := 0;
  end if;

  return jsonb_build_object(
    'salon_name', v_salon_name,
    'daily_token_number', v_entry.daily_token_number,
    'status', v_entry.status,
    'position', v_position,
    'estimated_wait_mins', public.walkin_compute_wait_mins(v_business_id, v_entry.id),
    'joined_at', v_entry.joined_at,
    'called_at', v_entry.called_at,
    'service_started_at', v_entry.service_started_at,
    'completed_at', v_entry.completed_at
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Grants — anon may ONLY call public queue RPCs (no direct table access)
-- ---------------------------------------------------------------------------
revoke all on function public.get_public_queue_context(text) from public;
grant execute on function public.get_public_queue_context(text) to anon, authenticated;

revoke all on function public.join_walkin_queue(text, text, text) from public;
grant execute on function public.join_walkin_queue(text, text, text) to anon, authenticated;

revoke all on function public.get_walkin_queue_status(text, text) from public;
grant execute on function public.get_walkin_queue_status(text, text) to anon, authenticated;
