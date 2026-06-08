-- SalonIQ: business members RBAC (additive)

create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  app_role text not null default 'staff'
    check (app_role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now(),
  unique (user_id, business_id)
);

create index if not exists business_members_user_id_idx
  on public.business_members (user_id);

create index if not exists business_members_business_id_idx
  on public.business_members (business_id);

-- Backfill owners from existing businesses
insert into public.business_members (user_id, business_id, app_role)
select owner_id, id, 'owner'
from public.businesses
on conflict (user_id, business_id) do nothing;

-- Extend tenant access: owners + invited members
create or replace function public.current_user_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select b.id
  from public.businesses b
  where b.owner_id = auth.uid()
  union
  select m.business_id
  from public.business_members m
  where m.user_id = auth.uid();
$$;

-- Business row read access for members (name, settings fields, etc.)
drop policy if exists "businesses_select_own" on public.businesses;

create policy "businesses_select_access"
  on public.businesses
  for select
  to authenticated
  using (
    owner_id = auth.uid()
    or id in (
      select business_id
      from public.business_members
      where user_id = auth.uid()
    )
  );

alter table public.business_members enable row level security;

create policy "business_members_select_own"
  on public.business_members
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "business_members_select_owner_manage"
  on public.business_members
  for select
  to authenticated
  using (
    business_id in (
      select id from public.businesses where owner_id = auth.uid()
    )
  );

create policy "business_members_insert_owner"
  on public.business_members
  for insert
  to authenticated
  with check (
    business_id in (
      select id from public.businesses where owner_id = auth.uid()
    )
  );

create policy "business_members_update_owner"
  on public.business_members
  for update
  to authenticated
  using (
    business_id in (
      select id from public.businesses where owner_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select id from public.businesses where owner_id = auth.uid()
    )
  );

create policy "business_members_delete_owner"
  on public.business_members
  for delete
  to authenticated
  using (
    business_id in (
      select id from public.businesses where owner_id = auth.uid()
    )
  );
