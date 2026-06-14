-- Manual signup approval: new businesses require owner approval before dashboard access.
-- Approve via Supabase SQL:
--   update public.businesses
--   set is_approved = true, approved_at = now()
--   where id = '<business_id>';

alter table public.businesses
  add column if not exists is_approved boolean not null default false,
  add column if not exists approved_at timestamptz;

comment on column public.businesses.is_approved is
  'When false, salon owner/staff see /pending until manually approved.';
comment on column public.businesses.approved_at is
  'Timestamp when the business was approved for dashboard access.';

-- Existing businesses (pre-migration) stay active.
update public.businesses
set
  is_approved = true,
  approved_at = coalesce(approved_at, now())
where is_approved = false;
