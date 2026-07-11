-- Transaction safety: apply an appointment time-change cascade atomically.
-- The cascade PLAN (which appointments shift and by how much) is computed in
-- app code; this RPC only applies the writes — anchor + all shifted rows —
-- in one transaction. Any failure rolls back the whole cascade.

create or replace function public.apply_appointment_cascade_atomic(
  p_business_id uuid,
  p_anchor_id uuid,
  p_anchor_start timestamptz,
  p_anchor_end timestamptz,
  p_shifted jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
  v_id uuid;
  v_start timestamptz;
  v_end timestamptz;
  v_updated integer;
  v_shifted_count integer := 0;
begin
  -- Ownership guard: caller must be the business owner or an owner/admin
  -- member of this business.
  if p_business_id is null or not (
    exists (
      select 1 from public.businesses b
      where b.id = p_business_id and b.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.business_members m
      where m.business_id = p_business_id
        and m.user_id = auth.uid()
        and m.app_role in ('owner', 'admin')
    )
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if p_anchor_id is null
     or p_anchor_start is null
     or p_anchor_end is null
     or p_anchor_end <= p_anchor_start then
    raise exception 'INVALID_ANCHOR';
  end if;

  if p_shifted is null or jsonb_typeof(p_shifted) <> 'array' then
    raise exception 'INVALID_SHIFTED_PLAN';
  end if;

  update public.appointments
     set start_time = p_anchor_start,
         end_time = p_anchor_end
   where id = p_anchor_id
     and business_id = p_business_id;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'ANCHOR_NOT_FOUND';
  end if;

  for v_row in select * from jsonb_array_elements(p_shifted)
  loop
    v_id := (v_row ->> 'id')::uuid;
    v_start := (v_row ->> 'new_start')::timestamptz;
    v_end := (v_row ->> 'new_end')::timestamptz;

    if v_id is null or v_start is null or v_end is null or v_end <= v_start then
      raise exception 'INVALID_SHIFTED_ROW';
    end if;

    update public.appointments
       set start_time = v_start,
           end_time = v_end
     where id = v_id
       and business_id = p_business_id;

    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      -- Row missing or belongs to another business — abort the whole cascade.
      raise exception 'SHIFTED_NOT_FOUND';
    end if;

    v_shifted_count := v_shifted_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'shifted_count', v_shifted_count);
end;
$$;

revoke all on function public.apply_appointment_cascade_atomic(
  uuid, uuid, timestamptz, timestamptz, jsonb
) from public;
revoke all on function public.apply_appointment_cascade_atomic(
  uuid, uuid, timestamptz, timestamptz, jsonb
) from anon;
grant execute on function public.apply_appointment_cascade_atomic(
  uuid, uuid, timestamptz, timestamptz, jsonb
) to authenticated;
