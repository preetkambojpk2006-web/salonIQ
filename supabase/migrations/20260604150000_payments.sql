-- SalonIQ payments (multi-tenant)

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  customer_name text,
  amount numeric not null default 0,
  method text not null default 'pending'
    check (method in ('cash', 'upi', 'card', 'pending')),
  status text not null default 'unpaid'
    check (status in ('paid', 'unpaid', 'partial')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index payments_business_id_idx on public.payments (business_id);
create index payments_paid_at_idx on public.payments (business_id, paid_at);
create index payments_appointment_id_idx on public.payments (appointment_id);

alter table public.payments enable row level security;

create policy "payments_select_own_business"
  on public.payments
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

create policy "payments_insert_own_business"
  on public.payments
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

create policy "payments_update_own_business"
  on public.payments
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

create policy "payments_delete_own_business"
  on public.payments
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));
