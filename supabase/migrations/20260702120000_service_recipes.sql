-- Service recipes: per-service inventory usage for auto-deduction (additive).

create table if not exists public.service_recipes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  product_id uuid not null references public.inventory_products (id) on delete cascade,
  quantity numeric not null check (quantity > 0),
  unit text,
  created_at timestamptz not null default now(),
  unique (service_id, product_id)
);

create index if not exists service_recipes_business_service_idx
  on public.service_recipes (business_id, service_id);

alter table public.service_recipes enable row level security;

drop policy if exists "service_recipes_select_own_business" on public.service_recipes;
create policy "service_recipes_select_own_business"
  on public.service_recipes
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

drop policy if exists "service_recipes_insert_own_business" on public.service_recipes;
create policy "service_recipes_insert_own_business"
  on public.service_recipes
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "service_recipes_update_own_business" on public.service_recipes;
create policy "service_recipes_update_own_business"
  on public.service_recipes
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "service_recipes_delete_own_business" on public.service_recipes;
create policy "service_recipes_delete_own_business"
  on public.service_recipes
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

grant select, insert, update, delete on table public.service_recipes to authenticated;

-- Auto-deduct recipe ingredients from stock when a service is completed + paid.
-- Non-blocking by design: products without enough stock are skipped and returned
-- as warnings; the caller never fails a payment because of inventory.
-- Ledger insert + quantity update for each product happen in one transaction.
create or replace function public.deduct_service_recipe_stock(
  p_business_id uuid,
  p_service_name text,
  p_txn_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service_id uuid;
  v_recipe record;
  v_new_qty numeric;
  v_usage_cost numeric;
  v_warnings text[] := '{}';
begin
  -- Ownership guard: caller must be the business owner or an owner/admin
  -- member of this business. Never trust the client-supplied business_id.
  if p_business_id is null or not (
    exists (
      select 1 from public.businesses b
      where b.id = p_business_id and b.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.business_members m
      where m.business_id = p_business_id
        and m.user_id = auth.uid()
        and m.app_role in ('owner', 'admin')
    )
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if p_service_name is null or trim(p_service_name) = '' then
    return jsonb_build_object('ok', true, 'warnings', '[]'::jsonb);
  end if;

  select s.id
    into v_service_id
    from public.services s
   where s.business_id = p_business_id
     and s.name = trim(p_service_name)
     and s.is_active = true
   order by s.created_at asc
   limit 1;

  if v_service_id is null then
    return jsonb_build_object('ok', true, 'warnings', '[]'::jsonb);
  end if;

  for v_recipe in
    select
      sr.product_id,
      sr.quantity,
      p.name as product_name,
      p.current_quantity,
      p.avg_unit_cost
    from public.service_recipes sr
    join public.inventory_products p
      on p.id = sr.product_id
     and p.business_id = sr.business_id
    where sr.business_id = p_business_id
      and sr.service_id = v_service_id
      and p.is_active = true
    for update of p
  loop
    if round(coalesce(v_recipe.current_quantity, 0)::numeric, 2)
       >= round(v_recipe.quantity::numeric, 2) then
      v_new_qty := round(
        coalesce(v_recipe.current_quantity, 0)::numeric
          - v_recipe.quantity::numeric,
        2
      );
      v_usage_cost := round(
        v_recipe.quantity::numeric * coalesce(v_recipe.avg_unit_cost, 0)::numeric,
        2
      );

      insert into public.inventory_transactions (
        business_id,
        product_id,
        txn_type,
        quantity,
        unit_cost,
        total_cost,
        txn_date,
        notes
      ) values (
        p_business_id,
        v_recipe.product_id,
        'use',
        -round(v_recipe.quantity::numeric, 2),
        null,
        v_usage_cost,
        p_txn_date,
        'Auto-deduct: ' || trim(p_service_name)
      );

      update public.inventory_products
         set current_quantity = v_new_qty
       where id = v_recipe.product_id
         and business_id = p_business_id;
    else
      v_warnings := array_append(v_warnings, v_recipe.product_name);
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'warnings', to_jsonb(v_warnings));
end;
$$;

revoke all on function public.deduct_service_recipe_stock(uuid, text, date)
  from public;
revoke all on function public.deduct_service_recipe_stock(uuid, text, date)
  from anon;
grant execute on function public.deduct_service_recipe_stock(uuid, text, date)
  to authenticated;
