-- Revenue helpers: sum paid payments where paid_at::date = today (Asia/Kolkata)

create or replace function public.sum_paid_payments_today(p_business_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0)
  from public.payments
  where business_id = p_business_id
    and status = 'paid'
    and paid_at is not null
    and (paid_at at time zone 'Asia/Kolkata')::date =
        (now() at time zone 'Asia/Kolkata')::date;
$$;

revoke all on function public.sum_paid_payments_today(uuid) from public;
grant execute on function public.sum_paid_payments_today(uuid) to authenticated;
