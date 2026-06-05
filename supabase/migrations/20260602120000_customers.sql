-- SalonIQ customers (multi-tenant)

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  phone text,
  gender text,
  birthday date,
  notes text,
  tags text[] not null default '{}'::text[],
  total_spend numeric not null default 0,
  visit_count integer not null default 0,
  last_visit_at timestamptz,
  created_at timestamptz not null default now()
);

create index customers_business_id_idx on public.customers (business_id);

alter table public.customers enable row level security;

create policy "customers_select_own_business"
  on public.customers
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

create policy "customers_insert_own_business"
  on public.customers
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

create policy "customers_update_own_business"
  on public.customers
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

create policy "customers_delete_own_business"
  on public.customers
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));
