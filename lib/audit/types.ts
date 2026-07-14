export type AuditEntityType =
  | "appointment"
  | "payment"
  | "service"
  | "inventory_product"
  | "staff";

export type AuditLogEntry = {
  id: string;
  businessId: string;
  performedBy: string | null;
  performedByName: string | null;
  action: string;
  entityType: AuditEntityType;
  entityId: string | null;
  entityLabel: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: string;
};

export type AuditLogInput = {
  businessId: string;
  action: string;
  entityType: AuditEntityType;
  entityId?: string | null;
  entityLabel?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  performedBy?: string | null;
  performedByName?: string | null;
};
