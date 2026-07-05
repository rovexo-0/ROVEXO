import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { decryptStaffPii, encryptStaffPii, hashStaffSearchValue, maskIpAddress } from "@/lib/staff-profile/encryption";
import { staffRoleLabel } from "@/lib/staff-profile/constants";
import { parseUserAgent } from "@/lib/staff-profile/request-context";
import type {
  StaffActionContext,
  StaffActivityEntry,
  StaffActivityFilters,
  StaffActivityModule,
  StaffListFilters,
  StaffListItem,
  StaffLoginEntry,
  StaffPermissionEntry,
  StaffProfileDetail,
  StaffRoleCatalogRow,
  StaffRoleId,
  StaffStatus,
} from "@/lib/staff-profile/types";

type StaffProfileRecord = {
  id: string;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  personal_email_encrypted: string;
  phone_encrypted: string | null;
  status: StaffStatus;
  registered_at: string;
  last_login_at: string | null;
};

function admin() {
  return createAdminClient();
}

function mapStaffRow(
  row: StaffProfileRecord,
  roles: Array<{ id: StaffRoleId; label: string }>,
): StaffListItem {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    personalEmail: decryptStaffPii(row.personal_email_encrypted) ?? "—",
    phoneNumber: decryptStaffPii(row.phone_encrypted),
    status: row.status,
    roles,
    registeredAt: row.registered_at,
    lastLoginAt: row.last_login_at,
  };
}

async function loadRoleMap(staffIds: string[]): Promise<Map<string, Array<{ id: StaffRoleId; label: string }>>> {
  const map = new Map<string, Array<{ id: StaffRoleId; label: string }>>();
  if (!staffIds.length) return map;

  const { data } = await admin()
    .from("staff_member_roles" as never)
    .select("staff_id, role_id, staff_role_catalog(label)")
    .in("staff_id", staffIds);

  for (const row of (data ?? []) as Array<{
    staff_id: string;
    role_id: StaffRoleId;
    staff_role_catalog: { label: string } | null;
  }>) {
    const current = map.get(row.staff_id) ?? [];
    current.push({
      id: row.role_id,
      label: row.staff_role_catalog?.label ?? row.role_id,
    });
    map.set(row.staff_id, current);
  }

  return map;
}

export async function listStaffRoleCatalog(): Promise<StaffRoleCatalogRow[]> {
  const { data } = await admin()
    .from("staff_role_catalog" as never)
    .select("id, label, description, sort_order")
    .order("sort_order", { ascending: true });

  return (data ?? []) as StaffRoleCatalogRow[];
}

export async function listStaffProfiles(filters: StaffListFilters = {}): Promise<StaffListItem[]> {
  const limit = Math.min(filters.limit ?? 100, 200);
  const offset = filters.offset ?? 0;
  const sort = filters.sort ?? "alphabetical";

  let staffIdsForRole: string[] | null = null;
  if (filters.role && filters.role !== "all") {
    const { data: roleRows } = await admin()
      .from("staff_member_roles" as never)
      .select("staff_id")
      .eq("role_id", filters.role);
    staffIdsForRole = ((roleRows ?? []) as Array<{ staff_id: string }>).map((row) => row.staff_id);
    if (!staffIdsForRole.length) return [];
  }

  let query = admin().from("staff_profiles" as never).select("*");

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (staffIdsForRole) {
    query = query.in("id", staffIdsForRole);
  }

  if (filters.query?.trim()) {
    const normalized = filters.query.trim().toLowerCase();
    const hash = hashStaffSearchValue(normalized);
    query = query.or(
      [
        `personal_email_hash.eq.${hash}`,
        `phone_hash.eq.${hash}`,
        `first_name.ilike.%${normalized}%`,
        `last_name.ilike.%${normalized}%`,
      ].join(","),
    );
  }

  switch (sort) {
    case "oldest_registration":
      query = query.order("registered_at", { ascending: true });
      break;
    case "recently_active":
      query = query.order("last_login_at", { ascending: false, nullsFirst: false });
      break;
    case "least_active":
      query = query.order("last_login_at", { ascending: true, nullsFirst: true });
      break;
    case "newest_registration":
      query = query.order("registered_at", { ascending: false });
      break;
    case "alphabetical":
    default:
      query = query.order("last_name", { ascending: true }).order("first_name", { ascending: true });
      break;
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as StaffProfileRecord[];
  const roleMap = await loadRoleMap(rows.map((row) => row.id));
  return rows.map((row) => mapStaffRow(row, roleMap.get(row.id) ?? []));
}

export async function getStaffProfileDetail(staffId: string): Promise<StaffProfileDetail | null> {
  const { data } = await admin()
    .from("staff_profiles" as never)
    .select("*")
    .eq("id", staffId)
    .maybeSingle();

  if (!data) return null;
  const row = data as StaffProfileRecord;
  const roleMap = await loadRoleMap([row.id]);
  return {
    ...mapStaffRow(row, roleMap.get(row.id) ?? []),
    profileId: row.profile_id,
  };
}

export async function recordStaffActivity(input: {
  staffId: string;
  actorId: string;
  targetStaffId?: string | null;
  module: StaffActivityModule | string;
  action: string;
  result?: "success" | "failed";
  context?: StaffActionContext;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const parsed = parseUserAgent(input.context?.userAgent);
  const ip = input.context?.ipAddress ?? null;

  await admin().from("staff_activity_logs" as never).insert({
    staff_id: input.staffId,
    actor_id: input.actorId,
    target_staff_id: input.targetStaffId ?? input.staffId,
    module: input.module,
    action: input.action,
    result: input.result ?? "success",
    ip_address: ip,
    browser: parsed.browser,
    operating_system: parsed.operatingSystem,
    device: parsed.device,
    metadata: input.metadata ?? {},
  } as never);

  await auditSuperAdminAction({
    actorId: input.actorId,
    action: `staff.${input.action}`,
    resourceType: "staff_profile",
    resourceId: input.staffId,
    metadata: {
      module: input.module,
      result: input.result ?? "success",
      targetStaffId: input.targetStaffId ?? input.staffId,
      ipAddress: maskIpAddress(ip),
      browser: parsed.browser,
      device: parsed.device,
    },
  });
}

export async function listStaffActivity(
  staffId: string,
  filters: StaffActivityFilters = {},
): Promise<StaffActivityEntry[]> {
  const limit = Math.min(filters.limit ?? 50, 100);
  const offset = filters.offset ?? 0;

  let query = admin()
    .from("staff_activity_logs" as never)
    .select("id, module, action, result, ip_address, browser, operating_system, device, created_at")
    .eq("staff_id", staffId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.module && filters.module !== "all") {
    query = query.eq("module", filters.module);
  }

  const { data } = await query;
  return ((data ?? []) as Array<Record<string, string | null>>).map((row) => ({
    id: row.id as string,
    module: row.module as string,
    action: row.action as string,
    result: row.result as string,
    ipAddressMasked: maskIpAddress(row.ip_address),
    browser: row.browser,
    operatingSystem: row.operating_system,
    device: row.device,
    createdAt: row.created_at as string,
  }));
}

export async function listStaffLoginHistory(
  staffId: string,
  limit = 50,
  offset = 0,
): Promise<StaffLoginEntry[]> {
  const { data } = await admin()
    .from("staff_login_events" as never)
    .select("id, status, ip_address, browser, operating_system, device, country, city, created_at")
    .eq("staff_id", staffId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return ((data ?? []) as Array<Record<string, string | null>>).map((row) => ({
    id: row.id as string,
    status: row.status as "success" | "failed",
    ipAddressMasked: maskIpAddress(row.ip_address),
    browser: row.browser,
    operatingSystem: row.operating_system,
    device: row.device,
    country: row.country,
    city: row.city,
    createdAt: row.created_at as string,
  }));
}

export async function listStaffPermissionHistory(
  staffId: string,
  limit = 50,
  offset = 0,
): Promise<StaffPermissionEntry[]> {
  const { data } = await admin()
    .from("staff_permission_history" as never)
    .select("id, role_id, change_type, performed_by, created_at, staff_role_catalog(label)")
    .eq("staff_id", staffId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const performerIds = ((data ?? []) as Array<{ performed_by: string | null }>)
    .map((row) => row.performed_by)
    .filter(Boolean) as string[];

  const performerNames = new Map<string, string>();
  if (performerIds.length) {
    const { data: profiles } = await admin()
      .from("profiles")
      .select("id, full_name, username")
      .in("id", performerIds);
    for (const profile of profiles ?? []) {
      performerNames.set(profile.id, profile.full_name ?? profile.username ?? "Super Admin");
    }
  }

  return ((data ?? []) as Array<{
    id: string;
    role_id: StaffRoleId;
    change_type: "added" | "removed";
    performed_by: string | null;
    created_at: string;
    staff_role_catalog: { label: string } | null;
  }>).map((row) => ({
    id: row.id,
    roleId: row.role_id,
    roleLabel: row.staff_role_catalog?.label ?? row.role_id,
    changeType: row.change_type,
    performedByName: row.performed_by ? performerNames.get(row.performed_by) ?? null : null,
    createdAt: row.created_at,
  }));
}

export async function createStaffProfile(
  input: {
    firstName: string;
    lastName: string;
    personalEmail: string;
    phoneNumber?: string | null;
    profileId?: string | null;
    roleIds?: StaffRoleId[];
  },
  context: StaffActionContext,
): Promise<StaffProfileDetail> {
  const email = input.personalEmail.trim().toLowerCase();
  const phone = input.phoneNumber?.trim() ?? null;

  const { data, error } = await admin()
    .from("staff_profiles" as never)
    .insert({
      profile_id: input.profileId ?? null,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      personal_email_encrypted: encryptStaffPii(email),
      personal_email_hash: hashStaffSearchValue(email),
      phone_encrypted: phone ? encryptStaffPii(phone) : null,
      phone_hash: phone ? hashStaffSearchValue(phone) : null,
      status: "active",
    } as never)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create staff profile.");
  }

  const staffId = (data as StaffProfileRecord).id;
  for (const roleId of input.roleIds ?? []) {
    await assignStaffRole(staffId, roleId, context);
  }

  await recordStaffActivity({
    staffId,
    actorId: context.actorId,
    module: "administration",
    action: "Staff Profile Created",
    context,
  });

  const detail = await getStaffProfileDetail(staffId);
  if (!detail) throw new Error("Staff profile not found after creation.");
  return detail;
}

export async function assignStaffRole(
  staffId: string,
  roleId: StaffRoleId,
  context: StaffActionContext,
): Promise<void> {
  await admin().from("staff_member_roles" as never).upsert({
    staff_id: staffId,
    role_id: roleId,
    assigned_by: context.actorId,
    assigned_at: new Date().toISOString(),
  } as never);

  await admin().from("staff_permission_history" as never).insert({
    staff_id: staffId,
    role_id: roleId,
    change_type: "added",
    performed_by: context.actorId,
  } as never);

  await recordStaffActivity({
    staffId,
    actorId: context.actorId,
    module: "administration",
    action: `${staffRoleLabel(roleId)} role assigned`,
    context,
  });
}

export async function removeStaffRole(
  staffId: string,
  roleId: StaffRoleId,
  context: StaffActionContext,
): Promise<void> {
  await admin().from("staff_member_roles" as never).delete().eq("staff_id", staffId).eq("role_id", roleId);

  await admin().from("staff_permission_history" as never).insert({
    staff_id: staffId,
    role_id: roleId,
    change_type: "removed",
    performed_by: context.actorId,
  } as never);

  await recordStaffActivity({
    staffId,
    actorId: context.actorId,
    module: "administration",
    action: `${staffRoleLabel(roleId)} role removed`,
    context,
  });
}

export async function updateStaffStatus(
  staffId: string,
  status: StaffStatus,
  context: StaffActionContext,
): Promise<void> {
  const { error } = await admin()
    .from("staff_profiles" as never)
    .update({ status } as never)
    .eq("id", staffId);

  if (error) throw new Error(error.message);

  const action =
    status === "suspended" ? "Staff Suspended" : status === "archived" ? "Staff Archived" : "Staff Reactivated";

  await recordStaffActivity({
    staffId,
    actorId: context.actorId,
    module: "security",
    action,
    context,
  });
}

export async function updateStaffProfileFields(
  staffId: string,
  input: {
    firstName?: string;
    lastName?: string;
    personalEmail?: string;
    phoneNumber?: string | null;
  },
  context: StaffActionContext,
): Promise<void> {
  const patch: Record<string, string | null> = {};
  if (input.firstName?.trim()) patch.first_name = input.firstName.trim();
  if (input.lastName?.trim()) patch.last_name = input.lastName.trim();
  if (input.personalEmail?.trim()) {
    const email = input.personalEmail.trim().toLowerCase();
    patch.personal_email_encrypted = encryptStaffPii(email);
    patch.personal_email_hash = hashStaffSearchValue(email);
  }
  if (input.phoneNumber !== undefined) {
    const phone = input.phoneNumber?.trim() ?? null;
    patch.phone_encrypted = phone ? encryptStaffPii(phone) : null;
    patch.phone_hash = phone ? hashStaffSearchValue(phone) : null;
  }

  if (Object.keys(patch).length) {
    const { error } = await admin().from("staff_profiles" as never).update(patch as never).eq("id", staffId);
    if (error) throw new Error(error.message);
  }

  await recordStaffActivity({
    staffId,
    actorId: context.actorId,
    module: "administration",
    action: "Profile Updated",
    context,
  });
}

export async function resetStaffPassword(staffId: string, context: StaffActionContext): Promise<void> {
  const detail = await getStaffProfileDetail(staffId);
  if (!detail?.profileId) {
    throw new Error("Staff member is not linked to a login account.");
  }

  const password = `RovexoStaff${Math.random().toString(36).slice(2, 10)}!`;
  await admin().auth.admin.updateUserById(detail.profileId, { password });

  await recordStaffActivity({
    staffId,
    actorId: context.actorId,
    module: "security",
    action: "Password Reset",
    context,
  });
}

export async function forceStaffLogout(staffId: string, context: StaffActionContext): Promise<void> {
  const detail = await getStaffProfileDetail(staffId);
  if (!detail?.profileId) {
    throw new Error("Staff member is not linked to a login account.");
  }

  const { error } = await admin().auth.admin.signOut(detail.profileId, "global");
  if (error) {
    throw new Error(error.message);
  }

  await recordStaffActivity({
    staffId,
    actorId: context.actorId,
    module: "security",
    action: "Force Logout",
    context,
  });
}

export async function syncStaffLastLogin(profileId: string): Promise<void> {
  const { data } = await admin()
    .from("staff_profiles" as never)
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  const staff = data as { id: string } | null;
  if (!staff?.id) return;

  const now = new Date().toISOString();
  await admin().from("staff_profiles" as never).update({ last_login_at: now } as never).eq("id", staff.id);
}

export async function recordStaffLoginEvent(input: {
  staffId: string;
  profileId: string;
  status: "success" | "failed";
  ipAddress?: string | null;
  userAgent?: string | null;
  country?: string | null;
  city?: string | null;
}): Promise<void> {
  const parsed = parseUserAgent(input.userAgent);
  await admin().from("staff_login_events" as never).insert({
    staff_id: input.staffId,
    profile_id: input.profileId,
    status: input.status,
    ip_address: input.ipAddress ?? null,
    browser: parsed.browser,
    operating_system: parsed.operatingSystem,
    device: parsed.device,
    country: input.country ?? null,
    city: input.city ?? null,
  } as never);

  if (input.status === "success") {
    await admin()
      .from("staff_profiles" as never)
      .update({ last_login_at: new Date().toISOString() } as never)
      .eq("id", input.staffId);
  }
}

export async function ensureSuperAdminStaffProfile(context: StaffActionContext): Promise<void> {
  const { data: superAdmin } = await admin()
    .from("profiles")
    .select("id, email, full_name, phone")
    .eq("role", "super_admin")
    .maybeSingle();

  if (!superAdmin?.email) return;

  const { data: existingData } = await admin()
    .from("staff_profiles" as never)
    .select("id")
    .eq("profile_id", superAdmin.id)
    .maybeSingle();

  const existing = existingData as { id: string } | null;
  if (existing?.id) return;

  const [firstName, ...rest] = (superAdmin.full_name ?? "Super Admin").split(" ");
  await createStaffProfile(
    {
      firstName: firstName || "Super",
      lastName: rest.join(" ") || "Admin",
      personalEmail: superAdmin.email,
      phoneNumber: superAdmin.phone,
      profileId: superAdmin.id,
      roleIds: ["administrator"],
    },
    context,
  );
}
