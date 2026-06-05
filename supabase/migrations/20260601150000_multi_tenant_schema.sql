-- SalonIQ multi-tenant schema
-- Every tenant table includes business_id; branch-scoped tables include branch_id.
-- RLS: authenticated users only access rows for businesses they own.

-- ---------------------------------------------------------------------------
-- businesses
-- owner_id links the row to auth.users (required for owner auth + RLS)
-- ---------------------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  logo_url text,
  phone text,
  email text,
  opening_hours jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index businesses_owner_id_idx on public.businesses (owner_id);

-- ---------------------------------------------------------------------------
-- branches
-- ---------------------------------------------------------------------------
create table public.branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  address text,
  phone text,
  unique (id, business_id)
);

create index branches_business_id_idx on public.branches (business_id);

-- ---------------------------------------------------------------------------
-- staff (branch-scoped)
-- ---------------------------------------------------------------------------
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  branch_id uuid not null,
  name text not null,
  role text,
  phone text,
  is_active boolean not null default true,
  foreign key (branch_id, business_id)
    references public.branches (id, business_id)
    on delete cascade
);

create index staff_business_id_idx on public.staff (business_id);
create index staff_branch_id_idx on public.staff (branch_id);

-- ---------------------------------------------------------------------------
-- services (business-scoped, not branch-scoped)
-- ---------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  category text,
  duration_mins integer not null check (duration_mins > 0),
  price numeric(10, 2) not null check (price >= 0),
  is_active boolean not null default true
);

create index services_business_id_idx on public.services (business_id);

-- ---------------------------------------------------------------------------
-- RLS helper: business IDs owned by the current user
-- ---------------------------------------------------------------------------
create or replace function public.current_user_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.businesses
  where owner_id = auth.uid();
$$;

revoke all on function public.current_user_business_ids() from public;
grant execute on function public.current_user_business_ids() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.businesses enable row level security;
alter table public.branches enable row level security;
alter table public.staff enable row level security;
alter table public.services enable row level security;

-- businesses
create policy "businesses_select_own"
  on public.businesses
  for select
  to authenticated
  using (owner_id = auth.uid());

create policy "businesses_insert_own"
  on public.businesses
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "businesses_update_own"
  on public.businesses
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "businesses_delete_own"
  on public.businesses
  for delete
  to authenticated
  using (owner_id = auth.uid());

-- branches
create policy "branches_select_own_business"
  on public.branches
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

create policy "branches_insert_own_business"
  on public.branches
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

create policy "branches_update_own_business"
  on public.branches
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

create policy "branches_delete_own_business"
  on public.branches
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

-- staff
create policy "staff_select_own_business"
  on public.staff
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

create policy "staff_insert_own_business"
  on public.staff
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

create policy "staff_update_own_business"
  on public.staff
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

create policy "staff_delete_own_business"
  on public.staff
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

-- services
create policy "services_select_own_business"
  on public.services
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

create policy "services_insert_own_business"
  on public.services
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

create policy "services_update_own_business"
  on public.services
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

create policy "services_delete_own_business"
  on public.services
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));
