"use server";

import { formatAppointmentEntityLabel } from "@/lib/audit/format";
import { recordAuditLog } from "@/lib/audit/log";
import { recordCustomerLoyaltyForPayment } from "@/lib/customers/loyalty";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import type { PaymentMethod } from "@/lib/payments/types";
import { recordStaffCommissionForPayment } from "@/lib/staff/commission";
import { todayCalendarDay } from "@/lib/payments/date-utils";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const VALID_METHODS: PaymentMethod[] = ["cash", "upi", "pending", "split"];

/** Server-side cap on a single payment: ₹10 lakh. */
const MAX_PAYMENT_AMOUNT = 1_000_000;

export type RecordPaymentResult =
  | { ok: true; commissionWarning?: boolean; inventoryWarnings?: string[] }
  | { ok: false; error: string };

/** Translate RPC exception codes into the same user-facing messages as before. */
function mapPaymentRpcError(message: string): string {
  if (message.includes("APPOINTMENT_NOT_FOUND")) {
    return "Booking not found.";
  }
  if (message.includes("INVALID_STATUS")) {
    return "Is booking par payment record nahi ho sakti.";
  }
  if (message.includes("ALREADY_PAID")) {
    return "Paid booking ko pending mark nahi kar sakte.";
  }
  if (message.includes("INVALID_AMOUNT")) {
    return "Amount exceeds maximum allowed value.";
  }
  if (message.includes("NOT_AUTHORIZED")) {
    return "Aapko is booking par payment record karne ki permission nahi hai.";
  }
  if (message.includes("INVALID_SPLIT")) {
    return "Cash + UPI total amount ke barabar hona chahiye.";
  }
  return message;
}

function parseSplitAmount(value: FormDataEntryValue | null): number {
  const parsed = Number((value as string)?.trim());
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}

export async function recordAppointmentPayment(
  formData: FormData
): Promise<RecordPaymentResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Please sign in again." };
  }

  const businessId = await getOwnerBusinessId();
  if (!businessId) {
    return { ok: false, error: "Set up your salon first." };
  }

  const appointmentId = (formData.get("appointment_id") as string)?.trim();
  const method = (formData.get("method") as string)?.trim() as PaymentMethod;

  if (!appointmentId || !VALID_METHODS.includes(method)) {
    return { ok: false, error: "Invalid payment request." };
  }

  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select(
      "id, business_id, status, payment_status, total_amount, staff_name, service_name, customer_id, start_time, loyalty_counted_at, customers ( name )"
    )
    .eq("id", appointmentId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (fetchError) {
    console.error("recordAppointmentPayment fetch:", fetchError.message);
    return { ok: false, error: fetchError.message };
  }

  if (!appointment) {
    return { ok: false, error: "Booking not found." };
  }

  if (
    appointment.status === "cancelled" ||
    appointment.status === "no_show" ||
    appointment.status === "completed"
  ) {
    return { ok: false, error: "Is booking par payment record nahi ho sakti." };
  }

  const customers = appointment.customers as
    | { name: string }
    | { name: string }[]
    | null;
  const customerName = Array.isArray(customers)
    ? customers[0]?.name ?? null
    : customers?.name ?? null;

  const amountOverrideRaw = (formData.get("amount") as string)?.trim();
  const originalAmount = Number(appointment.total_amount ?? 0);
  let amount = originalAmount;

  if (amountOverrideRaw) {
    const parsed = Number(amountOverrideRaw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { ok: false, error: "Invalid payment amount." };
    }
    amount = parsed;
  }

  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: "Invalid payment amount." };
  }

  if (amount > MAX_PAYMENT_AMOUNT) {
    return { ok: false, error: "Amount exceeds maximum allowed value." };
  }

  const isPaid = method === "cash" || method === "upi" || method === "split";
  if (isPaid && amount < 0) {
    return { ok: false, error: "Paid amount 0 se kam nahi ho sakta." };
  }

  let cashAmount: number | null = null;
  let upiAmount: number | null = null;

  if (method === "split") {
    cashAmount = parseSplitAmount(formData.get("cash_amount"));
    upiAmount = parseSplitAmount(formData.get("upi_amount"));

    if (cashAmount + upiAmount !== Math.round(amount)) {
      return {
        ok: false,
        error: "Cash + UPI total amount ke barabar hona chahiye.",
      };
    }
  }

  const now = new Date().toISOString();
  const rowBusinessId = appointment.business_id as string;

  if (!isPaid && appointment.payment_status === "paid") {
    return {
      ok: false,
      error: "Paid booking ko pending mark nahi kar sakte.",
    };
  }

  // Atomic RPC: payment upsert + appointment status update happen in one
  // DB transaction — either both writes land or neither does.
  const { error: rpcError } = await supabase.rpc(
    "record_appointment_payment_atomic",
    {
      p_appointment_id: appointmentId,
      p_business_id: rowBusinessId,
      p_amount: amount,
      p_method: method,
      p_customer_name: customerName,
      p_paid_at: now,
      p_cash_amount: cashAmount,
      p_upi_amount: upiAmount,
    }
  );

  if (rpcError) {
    console.error("recordAppointmentPayment rpc:", rpcError.message);
    return { ok: false, error: mapPaymentRpcError(rpcError.message) };
  }

  if (amountOverrideRaw && amount !== originalAmount) {
    void recordAuditLog({
      businessId: rowBusinessId,
      action: "payment.edited",
      entityType: "payment",
      entityId: appointmentId,
      entityLabel: formatAppointmentEntityLabel({
        customerName,
        serviceName: appointment.service_name as string | null,
        startTime: appointment.start_time as string | null,
      }),
      oldValue: { amount: originalAmount },
      newValue: { amount },
    });
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/money");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");

  let commissionWarning = false;
  let inventoryWarnings: string[] = [];

  if (isPaid) {
    const commissionResult = await recordStaffCommissionForPayment({
      businessId: rowBusinessId,
      appointmentId,
      staffName: appointment.staff_name as string | null,
      serviceAmount: amount,
      earnedAt: now,
    });

    if (!commissionResult.ok) {
      console.error(
        "recordStaffCommissionForPayment:",
        commissionResult.error
      );
      commissionWarning = true;
    }

    const customerId = appointment.customer_id as string | null;
    if (customerId) {
      void recordCustomerLoyaltyForPayment({
        businessId: rowBusinessId,
        appointmentId,
        customerId,
        amount,
        paidAt: now,
      }).catch((err) => {
        console.error("recordCustomerLoyaltyForPayment:", err);
      });
    }

    // Auto-deduct recipe ingredients from stock. NEVER blocks payment — any
    // failure or low-stock item is surfaced as a non-blocking warning only.
    inventoryWarnings = await deductServiceRecipeStock({
      supabase,
      businessId: rowBusinessId,
      serviceName: appointment.service_name as string | null,
      txnDate: todayCalendarDay(),
    });
  }

  return {
    ok: true,
    ...(commissionWarning ? { commissionWarning: true } : {}),
    ...(inventoryWarnings.length > 0 ? { inventoryWarnings } : {}),
  };
}

/** Non-blocking: returns product names that could not be deducted (low stock). */
async function deductServiceRecipeStock(params: {
  supabase: ReturnType<typeof createClient>;
  businessId: string;
  serviceName: string | null;
  txnDate: string;
}): Promise<string[]> {
  const serviceName = params.serviceName?.trim();
  if (!serviceName) return [];

  try {
    const { data, error } = await params.supabase.rpc(
      "deduct_service_recipe_stock",
      {
        p_business_id: params.businessId,
        p_service_name: serviceName,
        p_txn_date: params.txnDate,
      }
    );

    if (error) {
      console.error("deductServiceRecipeStock rpc:", error.message);
      return [];
    }

    const warnings = (data as { warnings?: unknown } | null)?.warnings;
    if (Array.isArray(warnings)) {
      return warnings.filter(
        (name): name is string => typeof name === "string" && name.length > 0
      );
    }
    return [];
  } catch (err) {
    console.error("deductServiceRecipeStock:", err);
    return [];
  }
}
