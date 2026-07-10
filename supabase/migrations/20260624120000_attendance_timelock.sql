-- Attendance time-lock: server-authoritative check-in + owner correction flag
-- Run in Supabase SQL Editor if not applied via CLI.

alter table public.businesses
  add column if not exists attendance_late_after time not null default '10:00:00';

comment on column public.businesses.attendance_late_after is
  'IST time after which a staff check-in is auto-marked late (e.g. 10:00 = salon opening).';

alter table public.staff_attendance
  add column if not exists owner_corrected boolean not null default false;

comment on column public.staff_attendance.owner_corrected is
  'True when an owner/admin changed status after the original check-in mark.';

create index if not exists staff_attendance_business_date_marked_idx
  on public.staff_attendance (business_id, attendance_date desc, marked_at desc);
