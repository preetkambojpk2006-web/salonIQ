-- SalonIQ: tiered (marginal) commission slabs (additive, backward-compatible)
-- Business-wide default slabs (staff_id IS NULL) and optional per-staff overrides.
-- Existing flat commission_percent on staff and staff_earnings remain unchanged.

-- ---------------------------------------------------------------------------
-- commission_slabs
-- ---------------------------------------------------------------------------

create table if not exists public.commission_slabs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_id uuid references public.staff (id) on delete cascade,
  min_amount numeric not null default 0,
  max_amount numeric,
  rate numeric not null,
  created_at timestamptz not null default now()
);

comment on column public.commission_slabs.staff_id is
  'NULL = business-wide default slab set; non-null = per-staff override slabs.';

comment on column public.commission_slabs.max_amount is
  'Upper bound (exclusive) of this tier; NULL = and above (no upper limit).';

comment on column public.commission_slabs.min_amount is
  'Lower bound (inclusive) of this tier, based on monthly cumulative revenue.';

comment on column public.commission_slabs.rate is
  'Commission percent applied to revenue within this tier (marginal slab).';

create index if not exists commission_slabs_business_id_idx
  on public.commission_slabs (business_id);

create index if not exists commission_slabs_business_staff_idx
  on public.commission_slabs (business_id, staff_id);

alter table public.commission_slabs enable row level security;

create policy "commission_slabs_select_own_business"
  on public.commission_slabs
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

create policy "commission_slabs_insert_own_business"
  on public.commission_slabs
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

create policy "commission_slabs_update_own_business"
  on public.commission_slabs
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

create policy "commission_slabs_delete_own_business"
  on public.commission_slabs
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

-- ---------------------------------------------------------------------------
-- commission_settings
-- ---------------------------------------------------------------------------

create table if not exists public.commission_settings (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  mode text not null default 'flat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.commission_settings.mode is
  'flat = use existing flat % engine; slab = use tiered commission_slabs.';

alter table public.commission_settings enable row level security;

create policy "commission_settings_select_own_business"
  on public.commission_settings
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

create policy "commission_settings_insert_own_business"
  on public.commission_settings
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

create policy "commission_settings_update_own_business"
  on public.commission_settings
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

create policy "commission_settings_delete_own_business"
  on public.commission_settings
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));
