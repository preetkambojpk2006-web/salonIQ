-- SalonIQ: staff attendance + late fine tracking (additive)
-- One attendance row per staff per IST calendar day; fines link to late marks and
-- deduct from payouts via staff_fines (mirrors staff_advances pattern).

-- ---------------------------------------------------------------------------
-- businesses: configurable late fine per instance
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column if not exists late_fine_amount numeric(10, 2) not null default 100
    check (late_fine_amount >= 0);

comment on column public.businesses.late_fine_amount is
  'Fixed rupee fine applied each time a staff member is marked late (per attendance row).';

-- ---------------------------------------------------------------------------
-- staff_attendance: daily present / absent / late marks
-- ---------------------------------------------------------------------------
create table if not exists public.staff_attendance (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete cascade,
  staff_name text not null,
  attendance_date date not null,
  status text not null
    check (status in ('present', 'absent', 'late')),
  marked_at timestamptz not null default now(),
  notes text,
  unique (business_id, staff_id, attendance_date)
);

comment on column public.staff_attendance.staff_name is
  'Roster name snapshot at mark time — must match staff_earnings.staff_name for payout deduction.';

comment on column public.staff_attendance.attendance_date is
  'IST calendar date (YYYY-MM-DD) for the attendance day.';

create index if not exists staff_attendance_business_date_idx
  on public.staff_attendance (business_id, attendance_date);

create index if not exists staff_attendance_business_staff_idx
  on public.staff_attendance (business_id, staff_id);

alter table public.staff_attendance enable row level security;

drop policy if exists "staff_attendance_select_own_business" on public.staff_attendance;
create policy "staff_attendance_select_own_business"
  on public.staff_attendance
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

drop policy if exists "staff_attendance_insert_own_business" on public.staff_attendance;
create policy "staff_attendance_insert_own_business"
  on public.staff_attendance
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "staff_attendance_update_own_business" on public.staff_attendance;
create policy "staff_attendance_update_own_business"
  on public.staff_attendance
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "staff_attendance_delete_own_business" on public.staff_attendance;
create policy "staff_attendance_delete_own_business"
  on public.staff_attendance
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

grant select, insert, update, delete on table public.staff_attendance to authenticated;

-- ---------------------------------------------------------------------------
-- staff_fines: deduction ledger linked to late attendance (payout integration)
-- ---------------------------------------------------------------------------
create table if not exists public.staff_fines (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete cascade,
  staff_name text not null,
  attendance_id uuid references public.staff_attendance (id) on delete set null,
  amount numeric(10, 2) not null check (amount > 0),
  reason text not null default 'Late aana',
  fine_date date not null,
  status text not null default 'outstanding'
    check (status in ('outstanding', 'deducted')),
  deducted_at timestamptz
);

comment on column public.staff_fines.staff_name is
  'Roster name snapshot — must match staff_earnings.staff_name for payout deduction.';

comment on column public.staff_fines.attendance_id is
  'Optional link to the late staff_attendance row that created this fine.';

create index if not exists staff_fines_business_status_idx
  on public.staff_fines (business_id, status);

create index if not exists staff_fines_business_staff_idx
  on public.staff_fines (business_id, staff_id);

alter table public.staff_fines enable row level security;

drop policy if exists "staff_fines_select_own_business" on public.staff_fines;
create policy "staff_fines_select_own_business"
  on public.staff_fines
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

drop policy if exists "staff_fines_insert_own_business" on public.staff_fines;
create policy "staff_fines_insert_own_business"
  on public.staff_fines
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "staff_fines_update_own_business" on public.staff_fines;
create policy "staff_fines_update_own_business"
  on public.staff_fines
  for update
  to authenticated
  using (business_id in (select public.current_user_business_ids()))
  with check (business_id in (select public.current_user_business_ids()));

drop policy if exists "staff_fines_delete_own_business" on public.staff_fines;
create policy "staff_fines_delete_own_business"
  on public.staff_fines
  for delete
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

grant select, insert, update, delete on table public.staff_fines to authenticated;
