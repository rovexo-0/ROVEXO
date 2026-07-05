export const STAFF_ENTERPRISE_PLATFORMS = [
  { id: "android", label: "Android", distribution: ["APK", "Google Play"] },
  { id: "ios", label: "iOS", distribution: ["TestFlight", "App Store"] },
  { id: "windows", label: "Windows", distribution: ["MSIX", "Desktop Installer", "Microsoft Store"] },
  { id: "web", label: "Web", distribution: ["staff.rovexo.co.uk"] },
] as const;

export type StaffEnterprisePlatformId = (typeof STAFF_ENTERPRISE_PLATFORMS)[number]["id"];

export const STAFF_ENTERPRISE_HOST =
  process.env.NEXT_PUBLIC_STAFF_URL?.trim() || "https://staff.rovexo.co.uk";

export const STAFF_ENTERPRISE_MODULES = [
  "marketplace",
  "orders",
  "listings",
  "users",
  "wallet",
  "shipping",
  "analytics",
  "cms",
  "theme-manager",
  "banner-manager",
  "brand-center",
  "design-studio",
  "reports",
  "audit",
  "notifications",
  "messages",
  "voice",
  "video",
  "ai",
  "security",
  "infrastructure",
  "database",
  "monitoring",
] as const;

export type StaffEnterpriseModuleId = (typeof STAFF_ENTERPRISE_MODULES)[number];

/** Maps staff roles to default module access (RBAC baseline — extended by permission grants). */
export const STAFF_ROLE_MODULE_ACCESS: Record<string, readonly StaffEnterpriseModuleId[]> = {
  super_admin: STAFF_ENTERPRISE_MODULES,
  admin: STAFF_ENTERPRISE_MODULES,
  administrator: STAFF_ENTERPRISE_MODULES,
  manager: ["marketplace", "orders", "listings", "users", "analytics", "reports", "messages", "monitoring"],
  support: ["users", "orders", "messages", "notifications"],
  contact_center: ["users", "messages", "notifications"],
  marketplace_moderator: ["marketplace", "listings", "reports", "audit"],
  finance: ["orders", "wallet", "reports", "audit"],
  shipping: ["orders", "shipping", "monitoring"],
  warehouse: ["orders", "shipping"],
  marketing: ["cms", "banner-manager", "brand-center", "analytics"],
  design_studio: ["design-studio", "brand-center", "banner-manager", "cms"],
  content_manager: ["cms", "banner-manager", "theme-manager"],
  business: ["users", "orders", "wallet"],
  ai_team: ["ai", "analytics", "monitoring"],
  security: ["security", "audit", "infrastructure", "monitoring"],
  operations: ["monitoring", "infrastructure", "database", "orders", "shipping"],
  hr: ["users", "audit", "messages"],
  developer: ["infrastructure", "database", "monitoring", "ai"],
};
