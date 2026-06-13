-- SalonIQ: staff advance / loan tracking (additive)
-- Links to staff by staff_name (matches staff_earnings); optional staff_id for roster audit.

create table if not exists public.staff_advances (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_name text not null,
  staff_id uuid references public.staff (id) on delete set null,
  amount numeric(10, 2) not null check (amount > 0),
  note text,
  given_at timestamptz not null default now(),
  status text not null default 'outstanding'
    check (status in ('outstanding', 'settled')),
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

comment on column public.staff_advances.staff_name is
  'Canonical roster name — must match staff_earnings.staff_name for payout deduction.';

comment on column public.staff_advances.staff_id is
  'Optional FK to staff row at time of advance; nullable if staff later deleted.';

create index if not exists staff_advances_business_id_idx
  on public.staff_advances (business_id);

create index if not exists staff_advances_business_staff_status_idx
  on public.staff_advances (business_id, staff_name, status);

create index if not exists staff_advances_business_given_at_idx
  on public.staff_advances (business_id, given_at desc);

alter table public.staff_advances enable row level security;

drop policy if exists "staff_advances_select_own_business" on public.staff_advances;
create policy "staff_advances_select_own_business"
  on public.staff_advances
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

drop policy if exists "staff_advances_insert_own_business" on public.staff_advances;
create policy "staff_advances_insert_own_business"
  on public.staff_advances
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "staff_advances_update_own_business" on public.staff_advances;
create policy "staff_advances_update_own_business"
  on public.staff_advances
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "staff_advances_delete_own_business" on public.staff_advances;
create policy "staff_advances_delete_own_business"
  on public.staff_advances
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

grant select, insert, update, delete on table public.staff_advances to authenticated;
