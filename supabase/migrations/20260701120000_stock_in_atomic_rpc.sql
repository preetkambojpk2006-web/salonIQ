-- Transaction safety: record inventory stock-in atomically.
-- Inserts the purchase ledger row AND updates product quantity/avg cost in one
-- transaction — a failure in either step rolls back both writes.

create or replace function public.record_stock_in_atomic(
  p_business_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_unit_cost numeric,
  p_txn_date date,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product record;
  v_qty numeric;
  v_unit_cost numeric;
  v_total_cost numeric;
  v_current_qty numeric;
  v_current_avg numeric;
  v_new_qty numeric;
  v_new_avg numeric;
  v_txn_id uuid;
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

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;

  if p_unit_cost is null or p_unit_cost < 0 then
    raise exception 'INVALID_UNIT_COST';
  end if;

  if p_txn_date is null then
    raise exception 'INVALID_TXN_DATE';
  end if;

  v_qty := round(p_quantity::numeric, 2);
  v_unit_cost := round(p_unit_cost::numeric, 2);
  v_total_cost := round(v_qty * v_unit_cost, 2);

  select
    id,
    business_id,
    current_quantity,
    avg_unit_cost,
    is_active
  into v_product
  from public.inventory_products
  where id = p_product_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;

  if not v_product.is_active then
    raise exception 'PRODUCT_INACTIVE';
  end if;

  v_current_qty := round(coalesce(v_product.current_quantity, 0)::numeric, 2);
  v_current_avg := round(coalesce(v_product.avg_unit_cost, 0)::numeric, 2);
  v_new_qty := round(v_current_qty + v_qty, 2);

  if v_new_qty > 0 then
    v_new_avg := round(
      (v_current_qty * v_current_avg + v_qty * v_unit_cost) / v_new_qty,
      2
    );
  else
    v_new_avg := v_unit_cost;
  end if;

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
    p_product_id,
    'purchase',
    v_qty,
    v_unit_cost,
    v_total_cost,
    p_txn_date,
    nullif(trim(p_notes), '')
  )
  returning id into v_txn_id;

  update public.inventory_products
  set
    current_quantity = v_new_qty,
    avg_unit_cost = v_new_avg
  where id = p_product_id
    and business_id = p_business_id;

  return jsonb_build_object(
    'ok', true,
    'txn_id', v_txn_id,
    'new_quantity', v_new_qty,
    'new_avg_cost', v_new_avg
  );
end;
$$;

revoke all on function public.record_stock_in_atomic(
  uuid, uuid, numeric, numeric, date, text
) from public;
revoke all on function public.record_stock_in_atomic(
  uuid, uuid, numeric, numeric, date, text
) from anon;
grant execute on function public.record_stock_in_atomic(
  uuid, uuid, numeric, numeric, date, text
) to authenticated;
