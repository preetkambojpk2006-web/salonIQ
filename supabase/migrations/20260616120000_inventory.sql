-- SalonIQ: stock / inventory management (additive)
-- Brands → products (cached balance + weighted avg cost) → transaction ledger
-- (purchase / use / adjustment). IST calendar dates on txn_date.

-- ---------------------------------------------------------------------------
-- inventory_brands: supplier / brand catalog per business
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_brands (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, name)
);

comment on table public.inventory_brands is
  'Salon product brands (e.g. Loreal, Wella) — business-scoped catalog.';

create index if not exists inventory_brands_business_active_idx
  on public.inventory_brands (business_id, is_active);

alter table public.inventory_brands enable row level security;

drop policy if exists "inventory_brands_select_own_business" on public.inventory_brands;
create policy "inventory_brands_select_own_business"
  on public.inventory_brands
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

drop policy if exists "inventory_brands_insert_own_business" on public.inventory_brands;
create policy "inventory_brands_insert_own_business"
  on public.inventory_brands
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "inventory_brands_update_own_business" on public.inventory_brands;
create policy "inventory_brands_update_own_business"
  on public.inventory_brands
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "inventory_brands_delete_own_business" on public.inventory_brands;
create policy "inventory_brands_delete_own_business"
  on public.inventory_brands
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

grant select, insert, update, delete on table public.inventory_brands to authenticated;

-- ---------------------------------------------------------------------------
-- inventory_products: SKUs under a brand with cached stock + avg cost
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  brand_id uuid not null references public.inventory_brands (id) on delete restrict,
  name text not null,
  unit_type text not null,
  current_quantity numeric(10, 2) not null default 0
    check (current_quantity >= 0),
  min_quantity numeric(10, 2) not null default 0
    check (min_quantity >= 0),
  avg_unit_cost numeric(10, 2) not null default 0
    check (avg_unit_cost >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, brand_id, name)
);

comment on table public.inventory_products is
  'Retail / consumable products per brand — current_quantity updated on each txn.';

comment on column public.inventory_products.unit_type is
  'Free-text unit label (bottle, tube, jar, liter, gram, piece, etc.).';

comment on column public.inventory_products.current_quantity is
  'Cached on-hand balance — app updates on each inventory_transactions row.';

comment on column public.inventory_products.min_quantity is
  'Low-stock threshold — alert when current_quantity <= min_quantity.';

comment on column public.inventory_products.avg_unit_cost is
  'Weighted average unit cost — updated on purchase transactions.';

create index if not exists inventory_products_business_brand_idx
  on public.inventory_products (business_id, brand_id);

create index if not exists inventory_products_business_active_idx
  on public.inventory_products (business_id, is_active);

alter table public.inventory_products enable row level security;

drop policy if exists "inventory_products_select_own_business" on public.inventory_products;
create policy "inventory_products_select_own_business"
  on public.inventory_products
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

drop policy if exists "inventory_products_insert_own_business" on public.inventory_products;
create policy "inventory_products_insert_own_business"
  on public.inventory_products
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "inventory_products_update_own_business" on public.inventory_products;
create policy "inventory_products_update_own_business"
  on public.inventory_products
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "inventory_products_delete_own_business" on public.inventory_products;
create policy "inventory_products_delete_own_business"
  on public.inventory_products
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

grant select, insert, update, delete on table public.inventory_products to authenticated;

-- ---------------------------------------------------------------------------
-- inventory_transactions: purchase / use / adjustment ledger
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  product_id uuid not null references public.inventory_products (id) on delete restrict,
  txn_type text not null
    check (txn_type in ('purchase', 'use', 'adjustment')),
  quantity numeric(10, 2) not null,
  unit_cost numeric(10, 2),
  total_cost numeric(10, 2),
  txn_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.inventory_transactions is
  'Stock movement ledger — quantity sign: positive = in, negative = out.';

comment on column public.inventory_transactions.txn_type is
  'purchase = stock in; use = consumption; adjustment = manual correction.';

comment on column public.inventory_transactions.quantity is
  'Positive for purchase / adjustment-in; negative for use / adjustment-out.';

comment on column public.inventory_transactions.unit_cost is
  'Per-unit price on purchase; null on use (COGS derived from product avg_unit_cost in app).';

comment on column public.inventory_transactions.total_cost is
  'Purchase spend (quantity * unit_cost); optional COGS snapshot on use.';

comment on column public.inventory_transactions.txn_date is
  'IST calendar date (YYYY-MM-DD) for the stock movement day.';

create index if not exists inventory_transactions_business_txn_date_idx
  on public.inventory_transactions (business_id, txn_date desc);

create index if not exists inventory_transactions_business_product_idx
  on public.inventory_transactions (business_id, product_id);

create index if not exists inventory_transactions_product_txn_date_idx
  on public.inventory_transactions (product_id, txn_date desc);

alter table public.inventory_transactions enable row level security;

drop policy if exists "inventory_transactions_select_own_business" on public.inventory_transactions;
create policy "inventory_transactions_select_own_business"
  on public.inventory_transactions
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

drop policy if exists "inventory_transactions_insert_own_business" on public.inventory_transactions;
create policy "inventory_transactions_insert_own_business"
  on public.inventory_transactions
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "inventory_transactions_update_own_business" on public.inventory_transactions;
create policy "inventory_transactions_update_own_business"
  on public.inventory_transactions
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "inventory_transactions_delete_own_business" on public.inventory_transactions;
create policy "inventory_transactions_delete_own_business"
  on public.inventory_transactions
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

grant select, insert, update, delete on table public.inventory_transactions to authenticated;
