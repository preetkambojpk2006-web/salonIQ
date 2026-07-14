-- Permanent staff settlement ledger (additive)

create table if not exists public.staff_settlement_history (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_name text not null,
  settled_at timestamptz not null default now(),
  gross_commission numeric not null check (gross_commission >= 0),
  fines_deducted numeric not null default 0 check (fines_deducted >= 0),
  advances_deducted numeric not null default 0 check (advances_deducted >= 0),
  net_paid numeric not null check (net_paid >= 0),
  note text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists staff_settlement_history_business_staff_idx
  on public.staff_settlement_history (business_id, staff_name, settled_at desc);

alter table public.staff_settlement_history enable row level security;

create policy "staff_settlement_history_select_own_business"
  on public.staff_settlement_history
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

create policy "staff_settlement_history_insert_own_business"
  on public.staff_settlement_history
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

grant select, insert on table public.staff_settlement_history to authenticated;
