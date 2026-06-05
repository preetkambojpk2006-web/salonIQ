-- Fix payments RLS + revenue RPC (owner-only access model)
-- Safe to re-run: drops/recreates policies and replaces function

-- ---------------------------------------------------------------------------
-- Helper: does the current authenticated user own this business?
-- SECURITY DEFINER so businesses RLS cannot block the ownership check.
-- ---------------------------------------------------------------------------
create or replace function public.user_owns_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id = p_business_id
      and b.owner_id = auth.uid()
  );
$$;

revoke all on function public.user_owns_business(uuid) from public;
grant execute on function public.user_owns_business(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Payments RLS: drop broken policies, recreate with helper
-- ---------------------------------------------------------------------------
drop policy if exists "payments_select_own_business" on public.payments;
drop policy if exists "payments_insert_own_business" on public.payments;
drop policy if exists "payments_update_own_business" on public.payments;
drop policy if exists "payments_delete_own_business" on public.payments;

create policy "payments_select_own_business"
  on public.payments
  for select
  to authenticated
  using (public.user_owns_business(business_id));

create policy "payments_insert_own_business"
  on public.payments
  for insert
  to authenticated
  with check (public.user_owns_business(business_id));

create policy "payments_update_own_business"
  on public.payments
  for update
  to authenticated
  using (public.user_owns_business(business_id))
  with check (public.user_owns_business(business_id));

create policy "payments_delete_own_business"
  on public.payments
  for delete
  to authenticated
  using (public.user_owns_business(business_id));

-- Table-level grants (required for PostgREST / Supabase client)
grant select, insert, update, delete on table public.payments to authenticated;

-- ---------------------------------------------------------------------------
-- Revenue RPC: sum paid payments where paid_at date = today (Asia/Kolkata)
-- SECURITY DEFINER so dashboard can aggregate even if SELECT policies change.
-- Caller still passes their own business_id from server-side getOwnerBusinessId().
-- ---------------------------------------------------------------------------
create or replace function public.sum_paid_payments_today(p_business_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0)
  from public.payments
  where business_id = p_business_id
    and status = 'paid'
    and paid_at is not null
    and (paid_at at time zone 'Asia/Kolkata')::date =
        (now() at time zone 'Asia/Kolkata')::date;
$$;

revoke all on function public.sum_paid_payments_today(uuid) from public;
grant execute on function public.sum_paid_payments_today(uuid) to authenticated;
