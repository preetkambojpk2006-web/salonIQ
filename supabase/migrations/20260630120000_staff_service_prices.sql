-- Staff-based service pricing overrides (additive)

create table if not exists public.staff_service_prices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  price numeric not null check (price >= 0),
  created_at timestamptz not null default now(),
  unique (staff_id, service_id)
);

create index if not exists staff_service_prices_business_staff_idx
  on public.staff_service_prices (business_id, staff_id);

alter table public.staff_service_prices enable row level security;

create policy "staff_service_prices_select_own_business"
  on public.staff_service_prices
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

create policy "staff_service_prices_insert_own_business"
  on public.staff_service_prices
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

create policy "staff_service_prices_update_own_business"
  on public.staff_service_prices
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

create policy "staff_service_prices_delete_own_business"
  on public.staff_service_prices
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

grant select, insert, update, delete on table public.staff_service_prices to authenticated;

-- Public booking context: include service/staff ids + staff price overrides for display
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

  return jsonb_build_object(
    'salon_name', v_business.name,
    'opening_hours_display', coalesce(v_business.opening_hours ->> 'display', ''),
    'opening_hours', coalesce(v_business.opening_hours, '{}'::jsonb),
    'booking_open_hour', v_hours.open_hour,
    'booking_close_hour', v_hours.close_hour,
    'services', v_services,
    'staff', v_staff,
    'staff_service_prices', v_price_overrides
  );
end;
$$;

revoke all on function public.get_public_booking_context(text) from public;
grant execute on function public.get_public_booking_context(text) to anon, authenticated;
