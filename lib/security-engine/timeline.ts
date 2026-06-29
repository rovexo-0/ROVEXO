import { auditPermissions } from "@/lib/security/permissions-audit";
import type {
  SecurityEngineAnalytics,
  SecurityEngineDashboard,
  SecurityEngineDeviceSummary,
  SecurityEngineSessionSummary,
  SecurityEngineThreatLevelId,
} from "@/lib/security-engine/types";

export function mapDevices(
  rows: Array<{ id: string; platform?: string | null; updated_at?: string | null }>,
): SecurityEngineDeviceSummary[] {
  return rows.map((row) => ({
    id: row.id,
    platform: row.platform ?? "unknown",
    label: row.platform ?? "Registered device",
    trusted: true,
    lastSeenAt: row.updated_at ?? undefined,
  }));
}

export function mapSession(input: {
  accessTokenPrefix: string;
  createdAt: string;
  lastSignInAt?: string | null;
  expiresAt?: string;
  provider: string;
}): SecurityEngineSessionSummary {
  return {
    id: input.accessTokenPrefix,
    provider: input.provider,
    createdAt: input.createdAt,
    lastSignInAt: input.lastSignInAt,
    expiresAt: input.expiresAt,
    current: true,
  };
}

export function deriveThreatLevel(input: {
  mfaEnabled: boolean;
  failedLogins24h: number;
  deviceCount: number;
}): SecurityEngineThreatLevelId {
  if (input.failedLogins24h >= 10) return "critical";
  if (input.failedLogins24h >= 5 || !input.mfaEnabled) return "high";
  if (input.deviceCount > 5) return "elevated";
  return "low";
}

export function buildSecurityDashboard(input: {
  mfaEnabled: boolean;
  deviceCount: number;
  sessionCount: number;
  failedLogins24h: number;
  platformProtections: number;
}): SecurityEngineDashboard {
  const threatLevel = deriveThreatLevel({
    mfaEnabled: input.mfaEnabled,
    failedLogins24h: input.failedLogins24h,
    deviceCount: input.deviceCount,
  });

  let score = 40;
  if (input.mfaEnabled) score += 25;
  if (input.sessionCount > 0) score += 10;
  if (input.deviceCount <= 3) score += 10;
  if (input.failedLogins24h === 0) score += 10;
  if (input.platformProtections >= 6) score += 5;
  score = Math.min(100, score);

  const authenticationStatus: SecurityEngineDashboard["authenticationStatus"] =
    input.mfaEnabled && input.failedLogins24h < 3
      ? "protected"
      : input.mfaEnabled || input.failedLogins24h < 5
        ? "partial"
        : "at-risk";

  return {
    securityScore: score,
    threatLevel,
    mfaEnabled: input.mfaEnabled,
    activeSessions: input.sessionCount,
    registeredDevices: input.deviceCount,
    failedLogins24h: input.failedLogins24h,
    apiHealth: input.platformProtections >= 6 ? 98 : 85,
    authenticationStatus,
  };
}

export function computeSecurityAnalytics(
  permissionAudit: ReturnType<typeof auditPermissions>,
  fraudEnabledCount: number,
  auditEventCount: number,
  platformProtectionCount: number,
): SecurityEngineAnalytics {
  return {
    permissionRoutes: permissionAudit.total,
    adminGatedRoutes: permissionAudit.adminGated,
    authGatedRoutes: permissionAudit.authGated,
    fraudSignals: fraudEnabledCount,
    auditEvents: auditEventCount,
    platformProtections: platformProtectionCount,
  };
}

export function countEnabledProtections(platformSecurity: Record<string, boolean>): number {
  return Object.values(platformSecurity).filter(Boolean).length;
}

export function countEnabledFraudSignals(fraudDetection: Record<string, boolean>): number {
  return Object.values(fraudDetection).filter(Boolean).length;
}
