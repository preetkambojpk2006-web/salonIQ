-- SalonIQ: daily revenue target on businesses (additive)
-- Safe to re-run (IF NOT EXISTS)

alter table public.businesses
  add column if not exists daily_revenue_target numeric(10, 2)
    check (daily_revenue_target is null or daily_revenue_target >= 0);
