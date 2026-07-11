-- Transaction safety: settle a staff payout atomically.
-- Marks all unpaid staff_earnings as paid, deducts outstanding fines (FIFO,
-- whole rows only), then settles outstanding advances (FIFO, whole rows only)
-- — all in one transaction. Any failure rolls back everything.
-- Mirrors the app-side FIFO logic in lib/staff/fines.ts / lib/staff/advances.ts:
-- rows larger than the remaining budget are skipped, never partially settled.

create or replace function public.settle_staff_payout_atomic(
  p_business_id uuid,
  p_staff_name text,
  p_settled_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settled_at timestamptz := coalesce(p_settled_at, now());
  v_gross numeric := 0;
  v_budget numeric := 0;
  v_fine_applied numeric := 0;
  v_advance_applied numeric := 0;
  v_row record;
begin
  -- Ownership guard: caller must be the business owner or an owner/admin
  -- member of this business.
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

  if p_staff_name is null or length(trim(p_staff_name)) = 0 then
    raise exception 'INVALID_STAFF_NAME';
  end if;

  -- Mark all unpaid earnings as paid and capture the gross in one statement.
  with settled as (
    update public.staff_earnings
       set status = 'paid'
     where business_id = p_business_id
       and staff_name = p_staff_name
       and status = 'unpaid'
    returning commission_amount
  )
  select coalesce(round(sum(commission_amount), 2), 0)
    into v_gross
    from settled;

  if v_gross <= 0 then
    raise exception 'NO_UNPAID_COMMISSION';
  end if;

  -- Deduct outstanding fines: FIFO by fine_date, skip rows over budget.
  v_budget := v_gross;

  for v_row in
    select id, amount
      from public.staff_fines
     where business_id = p_business_id
       and staff_name = p_staff_name
       and status = 'outstanding'
     order by fine_date asc
     for update
  loop
    exit when v_budget <= 0;
    continue when v_row.amount > v_budget;

    update public.staff_fines
       set status = 'deducted',
           deducted_at = v_settled_at
     where id = v_row.id;

    v_budget := round(v_budget - v_row.amount, 2);
    v_fine_applied := round(v_fine_applied + v_row.amount, 2);
  end loop;

  -- Settle outstanding advances: FIFO by given_at, skip rows over budget.
  v_budget := round(v_gross - v_fine_applied, 2);

  for v_row in
    select id, amount
      from public.staff_advances
     where business_id = p_business_id
       and staff_name = p_staff_name
       and status = 'outstanding'
     order by given_at asc
     for update
  loop
    exit when v_budget <= 0;
    continue when v_row.amount > v_budget;

    update public.staff_advances
       set status = 'settled',
           settled_at = v_settled_at
     where id = v_row.id;

    v_budget := round(v_budget - v_row.amount, 2);
    v_advance_applied := round(v_advance_applied + v_row.amount, 2);
  end loop;

  return jsonb_build_object(
    'ok', true,
    'gross_unpaid', v_gross,
    'fine_applied', v_fine_applied,
    'advance_applied', v_advance_applied,
    'net_paid', round(greatest(0, v_gross - v_fine_applied - v_advance_applied), 2)
  );
end;
$$;

revoke all on function public.settle_staff_payout_atomic(
  uuid, text, timestamptz
) from public;
revoke all on function public.settle_staff_payout_atomic(
  uuid, text, timestamptz
) from anon;
grant execute on function public.settle_staff_payout_atomic(
  uuid, text, timestamptz
) to authenticated;
