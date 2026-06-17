-- Explicit onboarding completion flag so middleware/layout do not rely on
-- inferred staff/service counts (avoids redirect loop after the final step).

alter table public.businesses
  add column if not exists onboarding_completed boolean not null default false;

comment on column public.businesses.onboarding_completed is
  'Set true when the owner finishes the final onboarding step (services).';

-- Backfill businesses that already satisfied the inferred onboarding rules.
update public.businesses b
set onboarding_completed = true
where onboarding_completed = false
  and exists (
    select 1 from public.branches br where br.business_id = b.id
  )
  and (
    exists (select 1 from public.staff s where s.business_id = b.id)
    or coalesce((b.opening_hours -> 'onboarding_skips' ->> 'staff')::boolean, false)
  )
  and (
    exists (select 1 from public.services sv where sv.business_id = b.id)
    or coalesce((b.opening_hours -> 'onboarding_skips' ->> 'services')::boolean, false)
  );
