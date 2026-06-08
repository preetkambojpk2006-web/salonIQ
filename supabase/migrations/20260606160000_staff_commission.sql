-- SalonIQ: staff commission engine (additive)

-- Per-staff default commission rate (%)
alter table public.staff
  add column if not exists commission_percent numeric(5, 2) not null default 30
    check (commission_percent >= 0 and commission_percent <= 100);

-- Earnings ledger: one row per paid appointment commission
create table if not exists public.staff_earnings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_name text not null,
  appointment_id uuid references public.appointments (id) on delete set null,
  service_amount numeric(10, 2) not null default 0 check (service_amount >= 0),
  commission_percent numeric(5, 2) not null default 30
    check (commission_percent >= 0 and commission_percent <= 100),
  commission_amount numeric(10, 2) not null default 0 check (commission_amount >= 0),
  earned_at timestamptz not null default now(),
  status text not null default 'unpaid'
    check (status in ('unpaid', 'paid')),
  created_at timestamptz not null default now()
);

create index if not exists staff_earnings_business_id_idx
  on public.staff_earnings (business_id);

create index if not exists staff_earnings_business_status_idx
  on public.staff_earnings (business_id, status);

create index if not exists staff_earnings_appointment_id_idx
  on public.staff_earnings (appointment_id);

-- Prevent duplicate commission for the same booking
create unique index if not exists staff_earnings_appointment_id_unique
  on public.staff_earnings (appointment_id)
  where appointment_id is not null;

alter table public.staff_earnings enable row level security;

create policy "staff_earnings_select_own_business"
  on public.staff_earnings
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

create policy "staff_earnings_insert_own_business"
  on public.staff_earnings
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

create policy "staff_earnings_update_own_business"
  on public.staff_earnings
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

create policy "staff_earnings_delete_own_business"
  on public.staff_earnings
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));
