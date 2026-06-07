-- SalonIQ: Google Business review link (additive)

alter table public.businesses
  add column if not exists google_review_link text;
