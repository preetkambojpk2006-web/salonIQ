-- Fix payments RLS: explicit owner check + table grants for authenticated role

drop policy if exists "payments_select_own_business" on public.payments;
drop policy if exists "payments_insert_own_business" on public.payments;
drop policy if exists "payments_update_own_business" on public.payments;
drop policy if exists "payments_delete_own_business" on public.payments;

create policy "payments_select_own_business"
  on public.payments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = payments.business_id
        and b.owner_id = (select auth.uid())
    )
  );

create policy "payments_insert_own_business"
  on public.payments
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.owner_id = (select auth.uid())
    )
  );

create policy "payments_update_own_business"
  on public.payments
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = payments.business_id
        and b.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.owner_id = (select auth.uid())
    )
  );

create policy "payments_delete_own_business"
  on public.payments
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = payments.business_id
        and b.owner_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on table public.payments to authenticated;
