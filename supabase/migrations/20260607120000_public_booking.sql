-- SalonIQ: public online self-booking (additive)
-- Safe to re-run where noted (IF NOT EXISTS / OR REPLACE)

-- ---------------------------------------------------------------------------
-- 1. Public slug on businesses
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column if not exists booking_slug text;

create unique index if not exists businesses_booking_slug_unique
  on public.businesses (booking_slug)
  where booking_slug is not null;

-- ---------------------------------------------------------------------------
-- 2. Slug helpers
-- ---------------------------------------------------------------------------
create or replace function public.slugify_text(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.generate_booking_slug(
  p_name text,
  p_business_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  candidate text;
  suffix int := 0;
begin
  base_slug := public.slugify_text(p_name);
  if base_slug = '' then
    base_slug := 'salon';
  end if;

  candidate := base_slug;
  while exists (
    select 1
    from public.businesses b
    where b.booking_slug = candidate
      and (p_business_id is null or b.id <> p_business_id)
  ) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix::text;
  end loop;

  return candidate;
end;
$$;

-- Backfill existing salons
update public.businesses b
set booking_slug = public.generate_booking_slug(b.name, b.id)
where b.booking_slug is null;

-- ---------------------------------------------------------------------------
-- 3. Faster customer lookup by phone (public booking upsert)
-- ---------------------------------------------------------------------------
create index if not exists customers_business_phone_idx
  on public.customers (business_id, phone)
  where phone is not null;

-- ---------------------------------------------------------------------------
-- 4. Public read: salon context for booking page (slug-scoped, minimal fields)
-- ---------------------------------------------------------------------------
create or replace function public.get_public_booking_context(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_business record;
  v_services jsonb;
  v_staff jsonb;
begin
  if p_slug is null or trim(p_slug) = '' then
    return null;
  end if;

  select b.id, b.name, b.opening_hours
  into v_business
  from public.businesses b
  where b.booking_slug = trim(p_slug);

  if not found then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', s.name,
        'duration_mins', s.duration_mins,
        'price', s.price
      )
      order by s.name
    ),
    '[]'::jsonb
  )
  into v_services
  from public.services s
  where s.business_id = v_business.id
    and s.is_active = true;

  select coalesce(
    jsonb_agg(jsonb_build_object('name', st.name) order by st.name),
    '[]'::jsonb
  )
  into v_staff
  from public.staff st
  where st.business_id = v_business.id
    and st.is_active = true;

  return jsonb_build_object(
    'salon_name', v_business.name,
    'opening_hours_display', coalesce(v_business.opening_hours ->> 'display', ''),
    'services', v_services,
    'staff', v_staff
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Public read: booked start times for staff + date (no customer data)
-- ---------------------------------------------------------------------------
create or replace function public.get_public_busy_slots(
  p_slug text,
  p_staff_name text,
  p_date text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_day_start timestamptz;
  v_day_end timestamptz;
begin
  if p_slug is null or trim(p_slug) = ''
     or p_staff_name is null or trim(p_staff_name) = ''
     or p_date is null or trim(p_date) = '' then
    return '[]'::jsonb;
  end if;

  select b.id
  into v_business_id
  from public.businesses b
  where b.booking_slug = trim(p_slug);

  if not found then
    return '[]'::jsonb;
  end if;

  v_day_start := (trim(p_date) || 'T00:00:00+05:30')::timestamptz;
  v_day_end := v_day_start + interval '1 day';

  return coalesce(
    (
      select jsonb_agg(a.start_time order by a.start_time)
      from public.appointments a
      where a.business_id = v_business_id
        and a.staff_name ilike trim(p_staff_name)
        and a.start_time >= v_day_start
        and a.start_time < v_day_end
        and a.status not in ('cancelled', 'no_show')
    ),
    '[]'::jsonb
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Public write: create pending booking + upsert customer by phone
--    V1 hours: 10:00–20:00 Asia/Kolkata (opening_hours display is info-only)
-- ---------------------------------------------------------------------------
create or replace function public.create_public_booking(
  p_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_staff_name text,
  p_service_name text,
  p_start_time timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_branch_id uuid;
  v_customer_id uuid;
  v_appointment_id uuid;
  v_service record;
  v_end_time timestamptz;
  v_phone text;
  v_local_start timestamp;
  v_local_end timestamp;
  v_close_time timestamp;
begin
  if p_slug is null or trim(p_slug) = '' then
    raise exception 'INVALID_SLUG';
  end if;

  if p_customer_name is null or trim(p_customer_name) = '' then
    raise exception 'CUSTOMER_NAME_REQUIRED';
  end if;

  if p_customer_phone is null or trim(p_customer_phone) = '' then
    raise exception 'CUSTOMER_PHONE_REQUIRED';
  end if;

  if p_staff_name is null or trim(p_staff_name) = ''
     or p_service_name is null or trim(p_service_name) = ''
     or p_start_time is null then
    raise exception 'BOOKING_FIELDS_REQUIRED';
  end if;

  v_phone := regexp_replace(trim(p_customer_phone), '\s+', '', 'g');

  select b.id
  into v_business_id
  from public.businesses b
  where b.booking_slug = trim(p_slug);

  if not found then
    raise exception 'SALON_NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.staff st
    where st.business_id = v_business_id
      and st.is_active = true
      and st.name ilike trim(p_staff_name)
  ) then
    raise exception 'STAFF_NOT_AVAILABLE';
  end if;

  select s.duration_mins, s.price
  into v_service
  from public.services s
  where s.business_id = v_business_id
    and s.is_active = true
    and s.name ilike trim(p_service_name);

  if not found then
    raise exception 'SERVICE_NOT_AVAILABLE';
  end if;

  if p_start_time <= now() then
    raise exception 'START_TIME_PAST';
  end if;

  v_local_start := p_start_time at time zone 'Asia/Kolkata';
  v_end_time := p_start_time + make_interval(mins => v_service.duration_mins);
  v_local_end := v_end_time at time zone 'Asia/Kolkata';
  v_close_time := date_trunc('day', v_local_start) + time '20:00';

  if v_local_start::date <> v_local_end::date then
    raise exception 'BOOKING_CROSS_DAY';
  end if;

  if v_local_start < date_trunc('day', v_local_start) + time '10:00'
     or v_local_end > v_close_time then
    raise exception 'OUTSIDE_SALON_HOURS';
  end if;

  if extract(minute from v_local_start)::int not in (0, 30)
     or extract(second from v_local_start)::int <> 0 then
    raise exception 'INVALID_SLOT';
  end if;

  if exists (
    select 1
    from public.appointments a
    where a.business_id = v_business_id
      and a.staff_name ilike trim(p_staff_name)
      and a.status not in ('cancelled', 'no_show')
      and tstzrange(
            a.start_time,
            coalesce(a.end_time, a.start_time + interval '1 hour'),
            '[)'
          )
          && tstzrange(p_start_time, v_end_time, '[)')
  ) then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  select c.id
  into v_customer_id
  from public.customers c
  where c.business_id = v_business_id
    and regexp_replace(coalesce(c.phone, ''), '\s+', '', 'g') = v_phone
  limit 1;

  if v_customer_id is null then
    insert into public.customers (business_id, name, phone)
    values (v_business_id, trim(p_customer_name), v_phone)
    returning id into v_customer_id;
  else
    update public.customers
    set name = trim(p_customer_name)
    where id = v_customer_id;
  end if;

  select br.id
  into v_branch_id
  from public.branches br
  where br.business_id = v_business_id
  order by br.name
  limit 1;

  insert into public.appointments (
    business_id,
    branch_id,
    customer_id,
    staff_name,
    service_name,
    start_time,
    end_time,
    status,
    total_amount,
    payment_status,
    source
  )
  values (
    v_business_id,
    v_branch_id,
    v_customer_id,
    trim(p_staff_name),
    trim(p_service_name),
    p_start_time,
    v_end_time,
    'pending',
    v_service.price,
    'unpaid',
    'online'
  )
  returning id into v_appointment_id;

  return v_appointment_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Grants — anon may ONLY call these RPCs (no direct table access)
-- ---------------------------------------------------------------------------
revoke all on function public.generate_booking_slug(text, uuid) from public;
grant execute on function public.generate_booking_slug(text, uuid) to authenticated;

revoke all on function public.get_public_booking_context(text) from public;
grant execute on function public.get_public_booking_context(text) to anon, authenticated;

revoke all on function public.get_public_busy_slots(text, text, text) from public;
grant execute on function public.get_public_busy_slots(text, text, text) to anon, authenticated;

revoke all on function public.create_public_booking(
  text, text, text, text, text, timestamptz
) from public;
grant execute on function public.create_public_booking(
  text, text, text, text, text, timestamptz
) to anon, authenticated;
