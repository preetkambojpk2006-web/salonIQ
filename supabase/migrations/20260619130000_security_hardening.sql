-- Pre-launch security hardening.
--   1. Prevent salon owners/clients from self-approving their own business.
--   2. Lock down internal walk-in helper functions (cross-tenant IDOR).

-- ---------------------------------------------------------------------------
-- 1. Guard the approval columns on public.businesses
--
-- RLS lets an owner UPDATE/INSERT their own business row, which includes the
-- is_approved / approved_at columns. A technical user could therefore call
-- PostgREST directly to flip is_approved = true and bypass manual review.
--
-- This trigger forces is_approved / approved_at to safe values whenever the
-- caller's database role is `authenticated` or `anon` (i.e. any request that
-- comes in through the Supabase client). Approvals run from the Supabase SQL
-- editor / service-role connect as `postgres` / `service_role` and are allowed
-- through unchanged.
-- ---------------------------------------------------------------------------
create or replace function public.guard_business_approval()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.is_approved := false;
      new.approved_at := null;
    elsif tg_op = 'UPDATE' then
      -- Silently keep the previous approval state; never let a client change it.
      new.is_approved := old.is_approved;
      new.approved_at := old.approved_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_business_approval_trg on public.businesses;
create trigger guard_business_approval_trg
  before insert or update on public.businesses
  for each row
  execute function public.guard_business_approval();

-- ---------------------------------------------------------------------------
-- 2. Revoke direct EXECUTE on internal walk-in helpers.
--
-- These take an arbitrary p_business_id with no ownership check and read
-- another salon's staff / queue / appointment data. They are only ever called
-- from the SECURITY DEFINER public RPCs (get_public_queue_context,
-- join_walkin_queue, ...), which run as the function owner and therefore do
-- NOT need these grants. Removing the `authenticated` grant closes the IDOR
-- with zero functional impact.
-- ---------------------------------------------------------------------------
revoke execute on function public.walkin_active_staff_count(uuid) from authenticated;
revoke execute on function public.walkin_has_active_services(uuid) from authenticated;
revoke execute on function public.walkin_avg_service_duration_mins(uuid) from authenticated;
revoke execute on function public.walkin_busy_staff_from_appointments(uuid, timestamptz) from authenticated;
revoke execute on function public.walkin_in_service_count(uuid, date) from authenticated;
revoke execute on function public.walkin_compute_wait_mins(uuid, uuid) from authenticated;
revoke execute on function public.walkin_business_id_from_slug(text) from authenticated;
