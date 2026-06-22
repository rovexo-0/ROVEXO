export type PermissionAuditEntry = {
  route: string;
  requiredRoles: string[];
  category: "public" | "authenticated" | "admin" | "api";
};

export const PERMISSION_AUDIT: PermissionAuditEntry[] = [
  { route: "/admin/*", requiredRoles: ["admin"], category: "admin" },
  { route: "/api/admin/*", requiredRoles: ["admin"], category: "api" },
  { route: "/api/trust/verification", requiredRoles: ["authenticated"], category: "api" },
  { route: "/api/monetization/subscription", requiredRoles: ["authenticated"], category: "api" },
  { route: "/api/assistant", requiredRoles: ["public"], category: "api" },
  { route: "/api/recently-viewed", requiredRoles: ["authenticated"], category: "api" },
  { route: "/api/saved-searches", requiredRoles: ["authenticated"], category: "api" },
  { route: "/api/follows", requiredRoles: ["authenticated"], category: "api" },
  { route: "/trust", requiredRoles: ["authenticated"], category: "authenticated" },
  { route: "/plans", requiredRoles: ["authenticated"], category: "authenticated" },
  { route: "/business/*", requiredRoles: ["authenticated"], category: "authenticated" },
  { route: "/seller/*", requiredRoles: ["authenticated"], category: "authenticated" },
];

export function auditPermissions(): { total: number; adminGated: number; authGated: number } {
  return {
    total: PERMISSION_AUDIT.length,
    adminGated: PERMISSION_AUDIT.filter((entry) => entry.requiredRoles.includes("admin")).length,
    authGated: PERMISSION_AUDIT.filter((entry) => entry.requiredRoles.includes("authenticated")).length,
  };
}
