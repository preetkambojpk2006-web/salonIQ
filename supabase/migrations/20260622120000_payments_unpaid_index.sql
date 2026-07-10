-- Insights / money pending-collection: filter unpaid payments by business_id + status.
create index if not exists idx_payments_business_unpaid
  on public.payments (business_id)
  where status = 'unpaid';
