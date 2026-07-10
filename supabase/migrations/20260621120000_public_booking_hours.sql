-- Public booking: respect businesses.opening_hours open/close for slot validation.
-- Structured fields: opening_hours.open_hour, opening_hours.close_hour (integers, IST).
-- Parses opening_hours.display when structured fields are missing.
-- Defaults when unset: 9 AM – 8 PM.

create or replace function public.booking_hour_from_token(
  p_hour int,
  p_mer text,
  p_default_mer text
)
returns int
language plpgsql
immutable
as $$
declare
  v_mer text := lower(coalesce(nullif(trim(p_mer), ''), p_default_mer));
begin
  if v_mer like 'p%' then
    return case when p_hour = 12 then 12 else p_hour + 12 end;
  end if;

  if v_mer like 'a%' then
    return case when p_hour = 12 then 0 else p_hour end;
  end if;

  return p_hour;
end;
$$;

create or replace function public.resolve_booking_hours(p_opening_hours jsonb)
returns table(open_hour int, close_hour int)
language plpgsql
immutable
as $$
declare
  v_open int;
  v_close int;
  v_display text;
  v_match text[];
  v_open_raw int;
  v_close_raw int;
begin
  v_open := nullif(trim(p_opening_hours ->> 'open_hour'), '')::int;
  v_close := nullif(trim(p_opening_hours ->> 'close_hour'), '')::int;

  if v_open is not null
     and v_close is not null
     and v_open >= 0
     and v_open <= 23
     and v_close > v_open
     and v_close <= 24 then
    open_hour := v_open;
    close_hour := v_close;
    return next;
    return;
  end if;

  v_display := lower(replace(replace(coalesce(p_opening_hours ->> 'display', ''), '–', '-'), '—', '-'));

  v_match := regexp_match(
    v_display,
    '(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)'
  );

  if v_match is not null then
    v_open_raw := v_match[1]::int;
    v_close_raw := v_match[4]::int;
    v_open := public.booking_hour_from_token(v_open_raw, v_match[3], 'am');
    v_close := public.booking_hour_from_token(v_close_raw, v_match[6], 'pm');

    if v_match[6] is null and v_close <= v_open then
      v_close := public.booking_hour_from_token(v_close_raw, 'pm', 'pm');
    end if;

    if v_open >= 0 and v_open <= 23 and v_close > v_open and v_close <= 24 then
      open_hour := v_open;
      close_hour := v_close;
      return next;
      return;
    end if;
  end if;

  open_hour := 9;
  close_hour := 20;
  return next;
end;
$$;

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
  v_hours record;
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

  select h.open_hour, h.close_hour
  into v_hours
  from public.resolve_booking_hours(v_business.opening_hours) h;

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
    'opening_hours', coalesce(v_business.opening_hours, '{}'::jsonb),
    'booking_open_hour', v_hours.open_hour,
    'booking_close_hour', v_hours.close_hour,
    'services', v_services,
    'staff', v_staff
  );
end;
$$;

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
  v_open_time timestamp;
  v_opening_hours jsonb;
  v_hours record;
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

  select b.id, b.opening_hours
  into v_business_id, v_opening_hours
  from public.businesses b
  where b.booking_slug = trim(p_slug);

  if not found then
    raise exception 'SALON_NOT_FOUND';
  end if;

  select h.open_hour, h.close_hour
  into v_hours
  from public.resolve_booking_hours(v_opening_hours) h;

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
  v_open_time := date_trunc('day', v_local_start)
    + make_interval(hours => v_hours.open_hour);
  v_close_time := date_trunc('day', v_local_start)
    + make_interval(hours => v_hours.close_hour);

  if v_local_start::date <> v_local_end::date then
    raise exception 'BOOKING_CROSS_DAY';
  end if;

  if v_local_start < v_open_time or v_local_end > v_close_time then
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
