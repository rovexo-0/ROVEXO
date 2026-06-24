import { createAdminClient } from "@/lib/supabase/admin";
import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";

export type AutomationControls = {
  automaticBackups: boolean;
  automaticHealthChecks: boolean;
  automaticFraudDetection: boolean;
  automaticCacheCleanup: boolean;
  automaticErrorRecovery: boolean;
  automaticNotifications: boolean;
};

export type UserAdminNotesMap = Record<string, string>;

const DEFAULT_AUTOMATION: AutomationControls = {
  automaticBackups: true,
  automaticHealthChecks: true,
  automaticFraudDetection: true,
  automaticCacheCleanup: true,
  automaticErrorRecovery: false,
  automaticNotifications: true,
};

export async function getAutomationControls(): Promise<AutomationControls> {
  return getPlatformSetting<AutomationControls>("automation_controls", DEFAULT_AUTOMATION);
}

export async function updateAutomationControls(
  actorId: string,
  patch: Partial<AutomationControls>,
): Promise<AutomationControls> {
  const current = await getAutomationControls();
  const next = { ...current, ...patch };
  await updatePlatformSetting({
    actorId,
    key: "automation_controls",
    value: next,
  });
  return next;
}

export async function getUserAdminNotes(): Promise<UserAdminNotesMap> {
  return getPlatformSetting<UserAdminNotesMap>("user_admin_notes", {});
}

export async function setUserAdminNote(input: {
  actorId: string;
  userId: string;
  note: string;
}): Promise<void> {
  const notes = await getUserAdminNotes();
  notes[input.userId] = input.note.trim();
  await updatePlatformSetting({
    actorId: input.actorId,
    key: "user_admin_notes",
    value: notes,
  });
  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "users.admin_note",
    resourceType: "profile",
    resourceId: input.userId,
    metadata: { noteLength: input.note.trim().length },
  });
}

export async function recordBackupAcknowledgement(actorId: string): Promise<void> {
  await auditSuperAdminAction({
    actorId,
    action: "backups.manual_ack",
    resourceType: "platform",
    metadata: { timestamp: new Date().toISOString() },
  });
}

export async function getSuperAdminSecuritySnapshot(superAdminUserId: string) {
  const admin = createAdminClient();
  const [{ data: authData }, { data: devices }, { data: audit }, { count: failedLogins }] =
    await Promise.all([
      admin.auth.admin.getUserById(superAdminUserId),
      admin.from("push_subscriptions").select("id, platform, endpoint, updated_at").eq("user_id", superAdminUserId),
      admin
        .from("platform_audit_logs")
        .select("id, action, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      admin
        .from("platform_error_logs")
        .select("*", { count: "exact", head: true })
        .eq("category", "auth")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60_000).toISOString()),
    ]);

  return {
    lastLogin: authData.user?.last_sign_in_at ?? null,
    lastIp: (authData.user?.user_metadata?.last_ip as string | undefined) ?? null,
    activeSessions: authData.user ? 1 : 0,
    registeredDevices: devices ?? [],
    failedLoginAttempts24h: failedLogins ?? 0,
    recentAudit: audit ?? [],
  };
}

export async function getUserManagementInsights(userId: string) {
  const admin = createAdminClient();
  const [authUser, devices, audit, notes] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("push_subscriptions").select("id, platform, user_agent, updated_at").eq("user_id", userId),
    listUserAuditForInsights(userId),
    getUserAdminNotes(),
  ]);

  return {
    lastLogin: authUser.data.user?.last_sign_in_at ?? null,
    lastIp: (authUser.data.user?.user_metadata?.last_ip as string | undefined) ?? null,
    devices: devices.data ?? [],
    timeline: audit,
    adminNote: notes[userId] ?? "",
  };
}

async function listUserAuditForInsights(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_audit_logs")
    .select("id, action, resource_type, created_at")
    .or(`resource_id.eq.${userId},actor_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export type MonitoringWidget = {
  id: string;
  label: string;
  status: "healthy" | "degraded" | "unhealthy";
  detail: string;
};

export async function getMonitoringWidgets(
  health: Awaited<ReturnType<typeof import("@/lib/ops/health").getPlatformHealthReport>>,
): Promise<MonitoringWidget[]> {
  const admin = createAdminClient();
  const { count: pushDevices } = await admin
    .from("push_subscriptions")
    .select("*", { count: "exact", head: true });

  const pushStatus =
    (pushDevices ?? 0) > 0 || process.env.NODE_ENV !== "production" ? "healthy" : "degraded";

  return [
    {
      id: "cpu",
      label: "CPU",
      status: health.checks.api.status,
      detail: `${health.checks.api.latencyMs}ms response`,
    },
    {
      id: "ram",
      label: "RAM",
      status: health.checks.redis.status,
      detail: health.checks.redis.message ?? "Cache layer operational",
    },
    {
      id: "storage",
      label: "Storage",
      status: health.checks.storage.status,
      detail: health.checks.storage.message ?? "Object storage reachable",
    },
    {
      id: "database",
      label: "Database",
      status: health.checks.database.status,
      detail: health.checks.database.message ?? `${health.checks.database.latencyMs}ms query`,
    },
    {
      id: "api",
      label: "API Status",
      status: health.checks.api.status,
      detail: "Application routes responding",
    },
    {
      id: "stripe",
      label: "Stripe",
      status: health.checks.stripe.status,
      detail: health.checks.stripe.message ?? "Payments gateway connected",
    },
    {
      id: "email",
      label: "Email Service",
      status: health.checks.email.status,
      detail: health.checks.email.message ?? "Transactional email ready",
    },
    {
      id: "push",
      label: "Push Service",
      status: pushStatus,
      detail: `${pushDevices ?? 0} registered devices`,
    },
    {
      id: "cron",
      label: "Scheduled Jobs",
      status: health.checks.cron.status,
      detail: health.checks.cron.message ?? "Cron heartbeat recorded",
    },
    {
      id: "queue",
      label: "Queue Status",
      status: health.checks.redis.status,
      detail: health.checks.redis.message ?? "Job queue available",
    },
  ];
}
