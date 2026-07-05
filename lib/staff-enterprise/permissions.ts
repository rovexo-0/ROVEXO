import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  STAFF_ROLE_MODULE_ACCESS,
  type StaffEnterpriseModuleId,
} from "@/lib/staff-enterprise/constants";

export type StaffPermissionCheck = {
  staffId: string;
  module: StaffEnterpriseModuleId | string;
  action?: string;
  roleIds?: string[];
};

export async function loadStaffRoleIds(staffId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("staff_member_roles" as never)
    .select("role_id")
    .eq("staff_id", staffId);

  return ((data ?? []) as Array<{ role_id: string }>).map((row) => row.role_id);
}

export async function loadStaffRoleIdsByProfileId(profileId: string): Promise<{
  staffId: string | null;
  roleIds: string[];
}> {
  const admin = createAdminClient();
  const { data: staff } = await admin
    .from("staff_profiles" as never)
    .select("id, status")
    .eq("profile_id", profileId)
    .maybeSingle();

  const record = staff as { id: string; status: string } | null;
  if (!record || record.status !== "active") {
    return { staffId: null, roleIds: [] };
  }

  const roleIds = await loadStaffRoleIds(record.id);
  return { staffId: record.id, roleIds };
}

export function roleIdsGrantModule(roleIds: string[], module: string): boolean {
  if (roleIds.includes("super_admin") || roleIds.includes("admin") || roleIds.includes("administrator")) {
    return true;
  }

  for (const roleId of roleIds) {
    const modules = STAFF_ROLE_MODULE_ACCESS[roleId];
    if (modules?.includes(module as StaffEnterpriseModuleId)) {
      return true;
    }
  }

  return false;
}

export async function canStaffPerform(input: StaffPermissionCheck): Promise<boolean> {
  const roleIds = input.roleIds ?? (await loadStaffRoleIds(input.staffId));
  if (roleIdsGrantModule(roleIds, input.module)) {
    return true;
  }

  if (!input.action) return false;

  const admin = createAdminClient();
  const { data } = await admin
    .from("staff_permission_grants" as never)
    .select("granted")
    .eq("staff_id", input.staffId)
    .eq("module", input.module)
    .eq("action", input.action)
    .maybeSingle();

  const grant = data as { granted: boolean } | null;
  return grant?.granted === true;
}

const STAFF_ENTERPRISE_MODULE_IDS = new Set<string>([
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
]);

export async function resolveStaffDashboardModules(staffId: string): Promise<StaffEnterpriseModuleId[]> {
  const roleIds = await loadStaffRoleIds(staffId);
  const modules = new Set<StaffEnterpriseModuleId>();

  for (const roleId of roleIds) {
    const access = STAFF_ROLE_MODULE_ACCESS[roleId] ?? [];
    for (const moduleId of access) {
      modules.add(moduleId);
    }
  }

  const admin = createAdminClient();
  const { data: grants } = await admin
    .from("staff_permission_grants" as never)
    .select("module, granted")
    .eq("staff_id", staffId);

  for (const row of (grants ?? []) as Array<{ module: string; granted: boolean }>) {
    if (row.granted && STAFF_ENTERPRISE_MODULE_IDS.has(row.module)) {
      modules.add(row.module as StaffEnterpriseModuleId);
    }
  }

  return [...modules];
}
