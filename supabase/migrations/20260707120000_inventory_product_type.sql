-- Inventory product type, category, and unit conversion (additive)

alter table public.inventory_products
  add column if not exists product_type text not null default 'backbar'
    check (product_type in ('backbar', 'retail'));

alter table public.inventory_products
  add column if not exists category text;

alter table public.inventory_products
  add column if not exists purchase_unit text;

alter table public.inventory_products
  add column if not exists usage_unit text;

alter table public.inventory_products
  add column if not exists unit_conversion_factor numeric not null default 1
    check (unit_conversion_factor > 0);

comment on column public.inventory_products.product_type is
  'backbar = used during services; retail = sold to customers.';

comment on column public.inventory_products.category is
  'Optional free-text category label (e.g. Hair Color, Skincare).';

comment on column public.inventory_products.purchase_unit is
  'Unit the owner buys in (e.g. liter, kg, box).';

comment on column public.inventory_products.usage_unit is
  'Unit used in service recipes (e.g. ml, gram, pcs).';

comment on column public.inventory_products.unit_conversion_factor is
  'How many usage_units per 1 purchase_unit (e.g. 1 liter = 1000 ml → 1000).';

create index if not exists inventory_products_business_type_idx
  on public.inventory_products (business_id, product_type, is_active);
