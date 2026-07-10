-- Reviews & social prompts after payment (additive)

alter table public.businesses
  add column if not exists google_review_url text,
  add column if not exists instagram_url text,
  add column if not exists review_prompt_enabled boolean not null default false,
  add column if not exists instagram_prompt_enabled boolean not null default false;

-- Backfill from legacy google_review_link where present
update public.businesses
set google_review_url = google_review_link
where google_review_url is null
  and google_review_link is not null
  and trim(google_review_link) <> '';
