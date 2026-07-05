import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { recordStaffActivity } from "@/lib/staff-profile/service";
import type { StaffActionContext } from "@/lib/staff-profile/types";
import { decryptStaffPii } from "@/lib/staff-profile/encryption";
import { parseUserAgent } from "@/lib/staff-profile/request-context";

export type StaffPresenceStatus =
  | "online"
  | "away"
  | "busy"
  | "offline"
  | "do_not_disturb"
  | "invisible";

export async function upsertStaffPresence(input: {
  staffId: string;
  status: StaffPresenceStatus;
  message?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("staff_presence" as never).upsert(
    {
      staff_id: input.staffId,
      status: input.status,
      message: input.message ?? null,
      last_active_at: new Date().toISOString(),
    } as never,
    { onConflict: "staff_id" },
  );
}

export async function touchStaffPresence(staffId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("staff_presence" as never).upsert(
    {
      staff_id: staffId,
      status: "online",
      last_active_at: new Date().toISOString(),
    } as never,
    { onConflict: "staff_id" },
  );
}

export async function registerStaffDevice(input: {
  staffId: string;
  profileId: string;
  platform: "android" | "ios" | "windows" | "macos" | "web" | "browser";
  deviceName: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  trusted?: boolean;
  context: StaffActionContext;
}): Promise<string> {
  const parsed = parseUserAgent(input.userAgent);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("staff_registered_devices" as never)
    .insert({
      staff_id: input.staffId,
      profile_id: input.profileId,
      platform: input.platform,
      device_name: input.deviceName,
      os_name: parsed.operatingSystem,
      browser: parsed.browser,
      ip_address: input.ipAddress ?? null,
      trusted: input.trusted ?? false,
      last_seen_at: new Date().toISOString(),
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Device registration failed.");
  }

  await recordStaffActivity({
    staffId: input.staffId,
    actorId: input.context.actorId,
    module: "security",
    action: "Device Registered",
    context: input.context,
    metadata: { platform: input.platform, deviceName: input.deviceName },
  });

  return (data as { id: string }).id;
}

export async function listStaffDirectory(limit = 100): Promise<
  Array<{
    staffId: string;
    fullName: string;
    department: string | null;
    position: string | null;
    status: string;
    presence: StaffPresenceStatus;
    avatarUrl: string | null;
    lastActiveAt: string | null;
    companyEmail: string | null;
    companyPhone: string | null;
    roleIds: string[];
  }>
> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("staff_profiles" as never)
    .select(
      "id, first_name, last_name, department_id, position, status, avatar_url, last_login_at, company_email_encrypted, company_phone_encrypted",
    )
    .eq("status", "active")
    .order("last_name", { ascending: true })
    .limit(limit);

  const rows = (data ?? []) as Array<{
    id: string;
    first_name: string;
    last_name: string;
    department_id: string | null;
    position: string | null;
    status: string;
    avatar_url: string | null;
    last_login_at: string | null;
    company_email_encrypted: string | null;
    company_phone_encrypted: string | null;
  }>;

  const staffIds = rows.map((row) => row.id);
  const presenceMap = new Map<string, { status: StaffPresenceStatus; last_active_at: string }>();
  const roleMap = new Map<string, string[]>();

  if (staffIds.length) {
    const { data: roleRows } = await admin
      .from("staff_member_roles" as never)
      .select("staff_id, role_id")
      .in("staff_id", staffIds);

    for (const row of (roleRows ?? []) as Array<{ staff_id: string; role_id: string }>) {
      const existing = roleMap.get(row.staff_id) ?? [];
      existing.push(row.role_id);
      roleMap.set(row.staff_id, existing);
    }
  }

  if (staffIds.length) {
    const { data: presenceRows } = await admin
      .from("staff_presence" as never)
      .select("staff_id, status, last_active_at")
      .in("staff_id", staffIds);

    for (const row of (presenceRows ?? []) as Array<{
      staff_id: string;
      status: StaffPresenceStatus;
      last_active_at: string;
    }>) {
      presenceMap.set(row.staff_id, { status: row.status, last_active_at: row.last_active_at });
    }
  }

  return rows.map((row) => {
    const presence = presenceMap.get(row.id);
    return {
      staffId: row.id,
      fullName: `${row.first_name} ${row.last_name}`.trim(),
      department: row.department_id,
      position: row.position,
      status: row.status,
      presence: presence?.status ?? "offline",
      avatarUrl: row.avatar_url,
      lastActiveAt: presence?.last_active_at ?? row.last_login_at,
      companyEmail: decryptStaffPii(row.company_email_encrypted),
      companyPhone: decryptStaffPii(row.company_phone_encrypted),
      roleIds: roleMap.get(row.id) ?? [],
    };
  });
}
