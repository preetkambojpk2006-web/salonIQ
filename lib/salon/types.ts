export type SalonService = {
  id: string;
  business_id: string;
  name: string;
  category: string | null;
  duration_mins: number;
  price: number;
  is_active: boolean;
};

export type SalonStaff = {
  id: string;
  business_id: string;
  branch_id: string;
  branch_name: string | null;
  name: string;
  role: string | null;
  phone: string | null;
  is_active: boolean;
  commission_percent: number;
};

export type SalonBranchOption = {
  id: string;
  name: string;
};

export type StaffServicePrice = {
  id: string;
  business_id: string;
  staff_id: string;
  service_id: string;
  price: number;
};
