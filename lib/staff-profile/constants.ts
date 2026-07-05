import type { StaffRoleId } from "@/lib/staff-profile/types";

export const STAFF_ROLE_IDS: StaffRoleId[] = [
  "administrator",
  "support",
  "marketplace_moderator",
  "finance",
  "shipping",
  "business",
  "content_manager",
];

export const STAFF_ROLE_LABELS: Record<StaffRoleId, string> = {
  administrator: "Administrator",
  support: "Support",
  marketplace_moderator: "Marketplace Moderator",
  finance: "Finance",
  shipping: "Shipping",
  business: "Business",
  content_manager: "Content Manager",
};

export function staffRoleLabel(roleId: StaffRoleId): string {
  return STAFF_ROLE_LABELS[roleId] ?? roleId;
}
