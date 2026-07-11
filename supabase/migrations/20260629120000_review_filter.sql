-- Smart review filter: star rating before Google review link (additive)

alter table public.businesses
  add column if not exists review_filter_enabled boolean not null default true;
