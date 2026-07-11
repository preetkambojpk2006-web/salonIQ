-- Transaction safety: record appointment payment atomically.
-- Inserts/updates the payments row AND marks the appointment completed in one
-- transaction — a failure in either step rolls back both writes.
-- Commission + loyalty recording intentionally stay OUTSIDE this RPC.

create or replace function public.record_appointment_payment_atomic(
  p_appointment_id uuid,
  p_business_id uuid,
  p_amount numeric,
  p_method text,
  p_customer_name text default null,
  p_paid_at timestamptz default null
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

  if p_method is null or p_method not in ('cash', 'upi', 'pending') then
    raise exception 'INVALID_METHOD';
  end if;

  if p_amount is null or p_amount < 0 or p_amount > 1000000 then
    raise exception 'INVALID_AMOUNT';
  end if;

  v_is_paid := p_method in ('cash', 'upi');

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
           status = case when v_is_paid then 'paid' else 'unpaid' end,
           paid_at = case when v_is_paid then v_now else null end
     where id = v_payment_id
       and business_id = p_business_id;
  else
    insert into public.payments (
      business_id, appointment_id, customer_name,
      amount, method, status, paid_at
    ) values (
      p_business_id, p_appointment_id, p_customer_name,
      p_amount, p_method,
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
  uuid, uuid, numeric, text, text, timestamptz
) from public;
revoke all on function public.record_appointment_payment_atomic(
  uuid, uuid, numeric, text, text, timestamptz
) from anon;
grant execute on function public.record_appointment_payment_atomic(
  uuid, uuid, numeric, text, text, timestamptz
) to authenticated;
