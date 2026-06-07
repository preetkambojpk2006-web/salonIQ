-- SalonIQ: customer no-show reliability tracker (additive)

alter table public.customers
  add column if not exists no_show_count integer not null default 0,
  add column if not exists reliability text not null default 'good'
    check (reliability in ('good', 'warning', 'blacklisted'));
