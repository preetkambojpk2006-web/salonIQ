-- Production security: authorize revenue RPC, align payments RLS with finance roles

create or replace function public.user_can_access_finance(p_business_id uuid)
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
  )
  or exists (
    select 1
    from public.business_members bm
    where bm.business_id = p_business_id
      and bm.user_id = auth.uid()
      and bm.app_role = 'admin'
  );
$$;

revoke all on function public.user_can_access_finance(uuid) from public;
grant execute on function public.user_can_access_finance(uuid) to authenticated;

-- Payments: owner + admin only (staff cannot read/write finance)
drop policy if exists "payments_select_own_business" on public.payments;
drop policy if exists "payments_insert_own_business" on public.payments;
drop policy if exists "payments_update_own_business" on public.payments;
drop policy if exists "payments_delete_own_business" on public.payments;

create policy "payments_select_finance"
  on public.payments
  for select
  to authenticated
  using (public.user_can_access_finance(business_id));

create policy "payments_insert_finance"
  on public.payments
  for insert
  to authenticated
  with check (public.user_can_access_finance(business_id));

create policy "payments_update_finance"
  on public.payments
  for update
  to authenticated
  using (public.user_can_access_finance(business_id))
  with check (public.user_can_access_finance(business_id));

create policy "payments_delete_finance"
  on public.payments
  for delete
  to authenticated
  using (public.user_can_access_finance(business_id));

-- Revenue RPC: only callable for businesses the user can access
create or replace function public.sum_paid_payments_today(p_business_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_business_id in (select public.current_user_business_ids())
      and public.user_can_access_finance(p_business_id)
    then (
      select coalesce(sum(amount), 0)
      from public.payments
      where business_id = p_business_id
        and status = 'paid'
        and paid_at is not null
        and (paid_at at time zone 'Asia/Kolkata')::date =
            (now() at time zone 'Asia/Kolkata')::date
    )
    else 0
  end;
$$;

revoke all on function public.sum_paid_payments_today(uuid) from public;
grant execute on function public.sum_paid_payments_today(uuid) to authenticated;

-- Prevent duplicate payment rows per appointment
create unique index if not exists payments_appointment_id_unique
  on public.payments (appointment_id)
  where appointment_id is not null;
