import type { SalonBranchOption, SalonService, SalonStaff, StaffServicePrice } from "@/lib/salon/types";
import { createClient } from "@/lib/supabase/server";

type ServiceRow = {
  id: string;
  business_id: string;
  name: string;
  category: string | null;
  duration_mins: number;
  price: number | string;
  is_active: boolean;
};

type StaffRow = {
  id: string;
  business_id: string;
  branch_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  is_active: boolean;
  commission_percent: number | string | null;
  branches: { name: string } | { name: string }[] | null;
};

export async function listServices(businessId: string): Promise<SalonService[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("services")
    .select("id, business_id, name, category, duration_mins, price, is_active")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) {
    console.error("listServices:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapServiceRow(row as ServiceRow));
}

export async function listStaffMembers(businessId: string): Promise<SalonStaff[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("staff")
    .select(
      `
      id,
      business_id,
      branch_id,
      name,
      role,
      phone,
      is_active,
      commission_percent,
      branches ( name )
    `
    )
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) {
    console.error("listStaffMembers:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapStaffRow(row as StaffRow));
}

export async function listBranchOptions(
  businessId: string
): Promise<SalonBranchOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("branches")
    .select("id, name")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) {
    console.error("listBranchOptions:", error.message);
    return [];
  }

  return data ?? [];
}

export async function listStaffServicePrices(
  businessId: string
): Promise<StaffServicePrice[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("staff_service_prices")
    .select("id, business_id, staff_id, service_id, price")
    .eq("business_id", businessId);

  if (error) {
    console.error("listStaffServicePrices:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    business_id: row.business_id as string,
    staff_id: row.staff_id as string,
    service_id: row.service_id as string,
    price: Number(row.price ?? 0),
  }));
}

function mapServiceRow(row: ServiceRow): SalonService {
  return {
    id: row.id,
    business_id: row.business_id,
    name: row.name,
    category: row.category,
    duration_mins: row.duration_mins,
    price: Number(row.price ?? 0),
    is_active: row.is_active,
  };
}

function mapStaffRow(row: StaffRow): SalonStaff {
  const branch = row.branches;
  const branchName = Array.isArray(branch)
    ? branch[0]?.name ?? null
    : branch?.name ?? null;

  return {
    id: row.id,
    business_id: row.business_id,
    branch_id: row.branch_id,
    branch_name: branchName,
    name: row.name,
    role: row.role,
    phone: row.phone,
    is_active: row.is_active,
    commission_percent: Number(row.commission_percent ?? 30),
  };
}
