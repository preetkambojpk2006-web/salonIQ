-- Split payment support (additive): a single booking can be paid part Cash +
-- part UPI. cash_amount / upi_amount are only set for method = 'split'.

alter table public.payments
  add column if not exists cash_amount numeric,
  add column if not exists upi_amount numeric;

-- Allow the new 'split' method value.
alter table public.payments
  drop constraint if exists payments_method_check;
alter table public.payments
  add constraint payments_method_check
  check (method in ('cash', 'upi', 'card', 'pending', 'split'));

-- Recreate the atomic payment RPC with two extra params for split amounts.
-- Replacing the argument list requires dropping the old signature first.
drop function if exists public.record_appointment_payment_atomic(
  uuid, uuid, numeric, text, text, timestamptz
);

create or replace function public.record_appointment_payment_atomic(
  p_appointment_id uuid,
  p_business_id uuid,
  p_amount numeric,
  p_method text,
  p_customer_name text default null,
  p_paid_at timestamptz default null,
  p_cash_amount numeric default null,
  p_upi_amount numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_paid boolean;
  v_now timestamptz := coalesce(p_paid_at, now());
  v_appointment record;
  v_payment_id uuid;
  v_cash_amount numeric;
  v_upi_amount numeric;
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

  if p_method is null or p_method not in ('cash', 'upi', 'pending', 'split') then
    raise exception 'INVALID_METHOD';
  end if;

  if p_amount is null or p_amount < 0 or p_amount > 1000000 then
    raise exception 'INVALID_AMOUNT';
  end if;

  v_is_paid := p_method in ('cash', 'upi', 'split');

  -- Split validation: both parts required, non-negative, and must total amount.
  if p_method = 'split' then
    v_cash_amount := round(coalesce(p_cash_amount, 0)::numeric, 2);
    v_upi_amount := round(coalesce(p_upi_amount, 0)::numeric, 2);

    if v_cash_amount < 0 or v_upi_amount < 0 then
      raise exception 'INVALID_SPLIT';
    end if;

    if round(v_cash_amount + v_upi_amount, 2) <> round(p_amount::numeric, 2) then
      raise exception 'INVALID_SPLIT';
    end if;
  else
    v_cash_amount := null;
    v_upi_amount := null;
  end if;

  select id, status, payment_status
    into v_appointment
    from public.appointments
   where id = p_appointment_id
     and business_id = p_business_id
   for update;

  if not found then
    raise exception 'APPOINTMENT_NOT_FOUND';
  end if;

  if v_appointment.status in ('cancelled', 'no_show', 'completed') then
    raise exception 'INVALID_STATUS';
  end if;

  select id
    into v_payment_id
    from public.payments
   where appointment_id = p_appointment_id
     and business_id = p_business_id
   order by created_at desc
   limit 1
   for update;

  -- Cannot downgrade an already-paid booking to pending.
  if not v_is_paid and (
    v_appointment.payment_status = 'paid'
    or exists (
      select 1 from public.payments
      where id = v_payment_id and status = 'paid'
    )
  ) then
    raise exception 'ALREADY_PAID';
  end if;

  if v_payment_id is not null then
    update public.payments
       set customer_name = p_customer_name,
           amount = p_amount,
           method = p_method,
           cash_amount = v_cash_amount,
           upi_amount = v_upi_amount,
           status = case when v_is_paid then 'paid' else 'unpaid' end,
           paid_at = case when v_is_paid then v_now else null end
     where id = v_payment_id
       and business_id = p_business_id;
  else
    insert into public.payments (
      business_id, appointment_id, customer_name,
      amount, method, cash_amount, upi_amount, status, paid_at
    ) values (
      p_business_id, p_appointment_id, p_customer_name,
      p_amount, p_method, v_cash_amount, v_upi_amount,
      case when v_is_paid then 'paid' else 'unpaid' end,
      case when v_is_paid then v_now else null end
    );
  end if;

  update public.appointments
     set status = 'completed',
         payment_status = case when v_is_paid then 'paid' else 'unpaid' end,
         total_amount = p_amount
   where id = p_appointment_id
     and business_id = p_business_id;

  return jsonb_build_object('ok', true, 'paid', v_is_paid);
end;
$$;

revoke all on function public.record_appointment_payment_atomic(
  uuid, uuid, numeric, text, text, timestamptz, numeric, numeric
) from public;
revoke all on function public.record_appointment_payment_atomic(
  uuid, uuid, numeric, text, text, timestamptz, numeric, numeric
) from anon;
grant execute on function public.record_appointment_payment_atomic(
  uuid, uuid, numeric, text, text, timestamptz, numeric, numeric
) to authenticated;
