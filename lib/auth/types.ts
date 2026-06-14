export type AppRole = "owner" | "admin" | "staff";

export type UserMembership = {
  businessId: string;
  appRole: AppRole;
};
