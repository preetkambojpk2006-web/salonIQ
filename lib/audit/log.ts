import type { AuditLogInput } from "@/lib/audit/types";
import { createClient } from "@/lib/supabase/server";

async function resolveAuditPerformer(): Promise<{
  userId: string;
  name: string;
} | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fullName =
    (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta?.name === "string" && meta.name.trim()) ||
    null;

  return {
    userId: user.id,
    name: fullName || user.email || "Owner",
  };
}

/** Non-blocking: never throws; failures are logged only. */
export async function recordAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const performer =
      input.performedBy != null
        ? {
            userId: input.performedBy,
            name: input.performedByName?.trim() || "Owner",
          }
        : await resolveAuditPerformer();

    const supabase = createClient();
    const { error } = await supabase.from("audit_logs").insert({
      business_id: input.businessId,
      performed_by: performer?.userId ?? null,
      performed_by_name: performer?.name ?? null,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId?.trim() || null,
      entity_label: input.entityLabel?.trim() || null,
      old_value: input.oldValue ?? null,
      new_value: input.newValue ?? null,
    });

    if (error) {
      console.warn("recordAuditLog:", error.message);
    }
  } catch (err) {
    console.warn("recordAuditLog:", err);
  }
}
