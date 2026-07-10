-- Branch limit per business (set manually by admin based on plan tier)

alter table public.businesses
  add column if not exists max_branches integer not null default 2
    check (max_branches >= 1);

comment on column public.businesses.max_branches is
  'Maximum branches allowed for this business. Set by admin via SQL based on plan. Default 2 = ₹1499 plan.';
