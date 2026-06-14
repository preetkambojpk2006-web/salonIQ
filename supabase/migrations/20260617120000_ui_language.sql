-- SalonIQ: business UI language preference (additive)
-- Apply via Supabase Dashboard SQL Editor when ready.

alter table public.businesses
  add column if not exists ui_language text not null default 'hi'
    check (ui_language in ('en', 'hi'));

comment on column public.businesses.ui_language is
  'Dashboard UI language: en = English, hi = Hinglish (roman).';
