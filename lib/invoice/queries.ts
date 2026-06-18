import { createClient } from "@/lib/supabase/client";
import type { GstSettings } from "@/lib/invoice/gst-calculations";

export type InvoiceBusinessContext = {
  businessName: string;
  gst: GstSettings;
  gstNumber: string | null;
};

export type InvoiceBranchContext = {
  name: string;
  address: string | null;
};

const DEFAULT_GST: GstSettings = {
  gst_enabled: false,
  gst_rate: 18,
  gst_inclusive: false,
};

export async function fetchInvoiceContext(
  businessId: string,
  branchId: string | null
): Promise<{
  business: InvoiceBusinessContext;
  branch: InvoiceBranchContext | null;
}> {
  const supabase = createClient();

  const { data: businessRow, error: businessError } = await supabase
    .from("businesses")
    .select("name, gst_enabled, gst_number, gst_rate, gst_inclusive")
    .eq("id", businessId)
    .maybeSingle();

  let branch: InvoiceBranchContext | null = null;
  if (branchId) {
    const { data: branchRow } = await supabase
      .from("branches")
      .select("name, address")
      .eq("id", branchId)
      .maybeSingle();

    if (branchRow) {
      branch = {
        name: branchRow.name,
        address: branchRow.address,
      };
    }
  }

  if (businessError || !businessRow) {
    return {
      business: {
        businessName: "Salon",
        gst: DEFAULT_GST,
        gstNumber: null,
      },
      branch,
    };
  }

  const row = businessRow as {
    name: string;
    gst_enabled?: boolean;
    gst_number?: string | null;
    gst_rate?: number | null;
    gst_inclusive?: boolean;
  };

  return {
    business: {
      businessName: row.name,
      gstNumber: row.gst_number ?? null,
      gst: {
        gst_enabled: row.gst_enabled ?? false,
        gst_rate:
          row.gst_rate != null && Number.isFinite(Number(row.gst_rate))
            ? Number(row.gst_rate)
            : 18,
        gst_inclusive: row.gst_inclusive ?? false,
      },
    },
    branch,
  };
}
