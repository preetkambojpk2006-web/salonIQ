-- SalonIQ: customer notes (already in 20260602120000_customers.sql)
-- Safe idempotent confirm for databases that may be missing the column:

alter table public.customers
  add column if not exists notes text;
