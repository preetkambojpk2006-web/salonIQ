import type { AuditLogEntry } from "@/lib/audit/types";
import { createClient } from "@/lib/supabase/server";

type AuditLogRow = {
  id: string;
  business_id: string;
  performed_by: string | null;
  performed_by_name: string | null;
  action: string;
  entity_type: AuditLogEntry["entityType"];
  entity_id: string | null;
  entity_label: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
};

function mapAuditLogRow(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    businessId: row.business_id,
    performedBy: row.performed_by,
    performedByName: row.performed_by_name,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    oldValue: row.old_value,
    newValue: row.new_value,
    createdAt: row.created_at,
  };
}

export async function getAuditLogs(businessId: string): Promise<AuditLogEntry[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .select(
      "id, business_id, performed_by, performed_by_name, action, entity_type, entity_id, entity_label, old_value, new_value, created_at"
    )
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("getAuditLogs:", error.message);
    return [];
  }

  return (data as AuditLogRow[] | null)?.map(mapAuditLogRow) ?? [];
}
