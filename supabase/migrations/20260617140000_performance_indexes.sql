-- Performance: supporting indexes for hot read paths.
--
-- NOTE: several requested indexes already exist from earlier migrations and are
-- intentionally NOT recreated to avoid redundant duplicate indexes:
--   * appointments (business_id, start_time)      -> appointments_start_time_idx
--   * walkin_queue (business_id, joined_at)        -> walkin_queue_business_joined_at_idx
--   * walkin_queue (business_id, status)           -> walkin_queue_business_status_idx
--   * staff_attendance (business_id, attendance_date) -> staff_attendance_business_date_idx
--   * staff_attendance (business_id, staff_id)     -> staff_attendance_business_staff_idx
--
-- The indexes below are new and target filtered/ordered scans that were not
-- previously covered.

-- Calendar / online-pending / day views filter by status alongside business_id
-- and order by start_time.
create index if not exists idx_appointments_business_status_start
  on public.appointments (business_id, status, start_time);

-- Online pending requests RLS query filters by status + source across businesses.
create index if not exists idx_appointments_status_source
  on public.appointments (status, source);

-- Monthly attendance date-wise lookup per staff member.
create index if not exists idx_staff_attendance_staff_date
  on public.staff_attendance (staff_id, attendance_date);

-- Outstanding fines are repeatedly summed/filtered by business + status.
create index if not exists idx_staff_fines_business_status
  on public.staff_fines (business_id, status);
