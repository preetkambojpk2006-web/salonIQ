-- Minimal public read for online booking on/off (does not alter existing booking RPCs).

create or replace function public.get_public_booking_gate(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_business record;
  v_branch record;
begin
  if p_slug is null or trim(p_slug) = '' then
    return null;
  end if;

  select
    b.id,
    b.name,
    b.phone,
    coalesce(b.online_booking_enabled, true) as online_booking_enabled
  into v_business
  from public.businesses b
  where b.booking_slug = trim(p_slug);

  if not found then
    return null;
  end if;

  select br.name, br.phone
  into v_branch
  from public.branches br
  where br.business_id = v_business.id
  order by br.name
  limit 1;

  return jsonb_build_object(
    'salon_name', v_business.name,
    'branch_name', coalesce(v_branch.name, ''),
    'phone', coalesce(
      nullif(trim(v_branch.phone), ''),
      nullif(trim(v_business.phone), ''),
      ''
    ),
    'online_booking_enabled', v_business.online_booking_enabled
  );
end;
$$;

revoke all on function public.get_public_booking_gate(text) from public;
grant execute on function public.get_public_booking_gate(text) to anon, authenticated;
