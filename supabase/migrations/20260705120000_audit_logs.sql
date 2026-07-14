-- Permanent audit trail for destructive and critical actions (additive)

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  performed_by uuid references auth.users (id),
  performed_by_name text,
  action text not null,
  entity_type text not null,
  entity_id text,
  entity_label text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_business_created_idx
  on public.audit_logs (business_id, created_at desc);

alter table public.audit_logs enable row level security;

create policy "audit_logs_select_own_business"
  on public.audit_logs
  for select
  to authenticated
  using (business_id in (select public.current_user_business_ids()));

create policy "audit_logs_insert_own_business"
  on public.audit_logs
  for insert
  to authenticated
  with check (business_id in (select public.current_user_business_ids()));

grant select, insert on table public.audit_logs to authenticated;
