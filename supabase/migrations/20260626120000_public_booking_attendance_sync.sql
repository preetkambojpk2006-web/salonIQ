-- Public booking: hide staff marked absent today (IST) from bookable staff list.
-- Future dates show all active staff. Unmarked attendance = still available.

create or replace function public.get_public_booking_staff(
  p_slug text,
  p_date date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_staff jsonb;
begin
  if p_slug is null or trim(p_slug) = '' or p_date is null then
    return '[]'::jsonb;
  end if;

  select b.id
  into v_business_id
  from public.businesses b
  where b.booking_slug = trim(p_slug);

  if not found then
    return null;
  end if;

  select coalesce(
    jsonb_agg(jsonb_build_object('name', st.name) order by st.name),
    '[]'::jsonb
  )
  into v_staff
  from public.staff st
  where st.business_id = v_business_id
    and st.is_active = true
    and (
      p_date <> v_today
      or not exists (
        select 1
        from public.staff_attendance sa
        where sa.business_id = v_business_id
          and sa.staff_id = st.id
          and sa.attendance_date = v_today
          and sa.status = 'absent'
      )
    );

  return v_staff;
end;
$$;

revoke all on function public.get_public_booking_staff(text, date) from public;
grant execute on function public.get_public_booking_staff(text, date) to anon, authenticated;
