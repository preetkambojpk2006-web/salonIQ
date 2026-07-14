-- Happy hours / off-peak pricing (additive)

create table if not exists public.happy_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  discount_percent numeric not null check (discount_percent > 0 and discount_percent <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

create index if not exists happy_hours_business_day_idx
  on public.happy_hours (business_id, day_of_week, is_active);

alter table public.happy_hours enable row level security;

create policy "happy_hours_select_own_business"
  on public.happy_hours
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

create policy "happy_hours_insert_own_business"
  on public.happy_hours
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

create policy "happy_hours_update_own_business"
  on public.happy_hours
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

create policy "happy_hours_delete_own_business"
  on public.happy_hours
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

grant select, insert, update, delete on table public.happy_hours to authenticated;

-- Include active happy hour rules in public booking context
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
  v_price_overrides jsonb;
  v_happy_hours jsonb;
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
        'id', s.id,
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
    jsonb_agg(jsonb_build_object('id', st.id, 'name', st.name) order by st.name),
    '[]'::jsonb
  )
  into v_staff
  from public.staff st
  where st.business_id = v_business.id
    and st.is_active = true;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'staff_name', st.name,
        'service_name', sv.name,
        'price', sp.price
      )
      order by st.name, sv.name
    ),
    '[]'::jsonb
  )
  into v_price_overrides
  from public.staff_service_prices sp
  join public.staff st
    on st.id = sp.staff_id
   and st.business_id = sp.business_id
  join public.services sv
    on sv.id = sp.service_id
   and sv.business_id = sp.business_id
  where sp.business_id = v_business.id
    and st.is_active = true
    and sv.is_active = true;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', hh.name,
        'day_of_week', hh.day_of_week,
        'start_time', to_char(hh.start_time, 'HH24:MI:SS'),
        'end_time', to_char(hh.end_time, 'HH24:MI:SS'),
        'discount_percent', hh.discount_percent
      )
      order by hh.day_of_week, hh.start_time
    ),
    '[]'::jsonb
  )
  into v_happy_hours
  from public.happy_hours hh
  where hh.business_id = v_business.id
    and hh.is_active = true;

  return jsonb_build_object(
    'salon_name', v_business.name,
    'opening_hours_display', coalesce(v_business.opening_hours ->> 'display', ''),
    'opening_hours', coalesce(v_business.opening_hours, '{}'::jsonb),
    'booking_open_hour', v_hours.open_hour,
    'booking_close_hour', v_hours.close_hour,
    'services', v_services,
    'staff', v_staff,
    'staff_service_prices', v_price_overrides,
    'happy_hours', v_happy_hours
  );
end;
$$;

revoke all on function public.get_public_booking_context(text) from public;
grant execute on function public.get_public_booking_context(text) to anon, authenticated;
