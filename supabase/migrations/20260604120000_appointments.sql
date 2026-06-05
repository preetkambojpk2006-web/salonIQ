-- SalonIQ appointments (multi-tenant)

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete set null,
  customer_id uuid references public.customers (id) on delete set null,
  staff_name text,
  service_name text,
  start_time timestamptz not null,
  end_time timestamptz,
  status text not null default 'pending',
  notes text,
  total_amount numeric not null default 0,
  payment_status text not null default 'unpaid',
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create index appointments_business_id_idx on public.appointments (business_id);
create index appointments_start_time_idx on public.appointments (business_id, start_time);

alter table public.appointments enable row level security;

create policy "appointments_select_own_business"
  on public.appointments
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

create policy "appointments_insert_own_business"
  on public.appointments
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

create policy "appointments_update_own_business"
  on public.appointments
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

create policy "appointments_delete_own_business"
  on public.appointments
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));
