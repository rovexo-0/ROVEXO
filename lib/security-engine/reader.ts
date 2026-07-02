import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRole } from "@/lib/auth/session";
import { auditPermissions } from "@/lib/security/permissions-audit";
import {
  readLiveSecurityEngineDocument,
  getSecurityEngineSnapshotForAdmin,
} from "@/lib/security-engine/engine";
import { SECURITY_ENGINE_MODULES } from "@/lib/security-engine/registry";
import {
  buildSecurityDashboard,
  computeSecurityAnalytics,
  countEnabledFraudSignals,
  countEnabledProtections,
  mapDevices,
  mapSession,
} from "@/lib/security-engine/timeline";
import type {
  SecurityEngineAnalytics,
  SecurityEngineContext,
  SecurityEngineSnapshot,
} from "@/lib/security-engine/types";

export async function getPublicSecurityEngineConfig() {
  return readLiveSecurityEngineDocument();
}

export async function getSecurityEngineSnapshot(): Promise<SecurityEngineSnapshot> {
  const { draft, live, history } = await getSecurityEngineSnapshotForAdmin();
  return {
    scannedAt: new Date().toISOString(),
    modules: SECURITY_ENGINE_MODULES,
    draft,
    live,
    history,
  };
}

async function readUserMfaEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  return (data?.totp ?? []).some((factor) => factor.status === "verified");
}

async function readUserSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  return mapSession({
    accessTokenPrefix: data.session.access_token.slice(0, 12),
    createdAt: data.session.user.created_at,
    lastSignInAt: data.session.user.last_sign_in_at,
    expiresAt: data.session.expires_at
      ? new Date(data.session.expires_at * 1000).toISOString()
      : undefined,
    provider: (data.session.user.app_metadata.provider as string) ?? "email",
  });
}

async function readUserDevices(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("push_subscriptions")
    .select("id, platform, updated_at")
    .eq("user_id", userId);
  return mapDevices(data ?? []);
}

async function readFailedLogins24h(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("platform_error_logs")
    .select("*", { count: "exact", head: true })
    .eq("category", "auth")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60_000).toISOString());
  void userId;
  return count ?? 0;
}

export async function getSecurityEngineContext(userId: string): Promise<SecurityEngineContext> {
  const [config, role, mfaEnabled, session, devices, failedLogins24h] = await Promise.all([
    readLiveSecurityEngineDocument(),
    getUserRole(userId),
    readUserMfaEnabled(),
    readUserSession(),
    readUserDevices(userId),
    readFailedLogins24h(userId),
  ]);

  const platformProtections = countEnabledProtections(config.platformSecurity);
  const dashboard = buildSecurityDashboard({
    mfaEnabled,
    deviceCount: devices.length,
    sessionCount: session ? 1 : 0,
    failedLogins24h,
    platformProtections,
  });

  return {
    dashboard,
    role: role ?? "buyer",
    devices,
    sessions: session ? [session] : [],
    compliance: config.compliance,
  };
}

export async function getSecurityEngineAnalyticsForUser(userId: string): Promise<SecurityEngineAnalytics> {
  const config = await readLiveSecurityEngineDocument();
  const permissionAudit = auditPermissions();
  const admin = createAdminClient();
  const { count: auditCount } = await admin
    .from("platform_audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("actor_id", userId);

  return computeSecurityAnalytics(
    permissionAudit,
    countEnabledFraudSignals(config.fraudDetection),
    auditCount ?? 0,
    countEnabledProtections(config.platformSecurity),
  );
}
