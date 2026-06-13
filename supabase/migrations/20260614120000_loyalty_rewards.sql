-- SalonIQ: customer loyalty / reward system (additive)
-- Repeating rewards: progress = (visit_count - loyalty_baseline_visits) or
-- (total_spend - loyalty_baseline_spend). On redeem, baselines reset to current totals.

-- ---------------------------------------------------------------------------
-- businesses: owner-configurable reward rule (one rule per salon)
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column if not exists reward_enabled boolean not null default false,
  add column if not exists reward_type text not null default 'visits'
    check (reward_type in ('visits', 'spend')),
  add column if not exists reward_threshold numeric(10, 2) not null default 10
    check (reward_threshold > 0),
  add column if not exists reward_description text;

comment on column public.businesses.reward_enabled is
  'When true, paid visits/spend count toward loyalty and customers can earn rewards.';

comment on column public.businesses.reward_type is
  'visits = count paid completed appointments; spend = sum paid amounts since baseline.';

comment on column public.businesses.reward_threshold is
  'Visits (whole number) or rupee spend required since customer baseline to earn one reward.';

comment on column public.businesses.reward_description is
  'Human-readable reward, e.g. Free Haircut — shown on customer card and WhatsApp.';

-- ---------------------------------------------------------------------------
-- customers: per-customer reward state + baselines for repeating cycles
-- ---------------------------------------------------------------------------
alter table public.customers
  add column if not exists reward_pending boolean not null default false,
  add column if not exists reward_earned_at timestamptz,
  add column if not exists reward_notified_at timestamptz,
  add column if not exists reward_redeemed_at timestamptz,
  add column if not exists loyalty_baseline_visits integer not null default 0
    check (loyalty_baseline_visits >= 0),
  add column if not exists loyalty_baseline_spend numeric(10, 2) not null default 0
    check (loyalty_baseline_spend >= 0);

comment on column public.customers.reward_pending is
  'True when customer has earned a reward and owner has not marked it redeemed yet.';

comment on column public.customers.loyalty_baseline_visits is
  'visit_count snapshot at last redeem — progress = visit_count - loyalty_baseline_visits.';

comment on column public.customers.loyalty_baseline_spend is
  'total_spend snapshot at last redeem — progress = total_spend - loyalty_baseline_spend.';

create index if not exists customers_business_reward_pending_idx
  on public.customers (business_id, reward_pending)
  where reward_pending = true;

-- ---------------------------------------------------------------------------
-- appointments: idempotency — each booking counts at most once for loyalty
-- ---------------------------------------------------------------------------
alter table public.appointments
  add column if not exists loyalty_counted_at timestamptz;

comment on column public.appointments.loyalty_counted_at is
  'Set when this appointment visit/spend was applied to customer loyalty stats.';
