import { createAdminClient } from "@/lib/supabase/admin";
import { getOperationsIncidents } from "@/lib/operations-center-engine/engine";
import type { OperationsIncident } from "@/lib/operations-center-engine/types";
import type { PlatformHealthReport, HealthCheckResult } from "@/lib/ops/health";
import { getPlatformHealthReport } from "@/lib/ops/health";
import type { ProductionOperationsSnapshot } from "@/lib/ops/production-status";
import { getProductionOperationsSnapshot } from "@/lib/ops/production-status";
import type { SuperAdminDashboardData } from "@/lib/super-admin/dashboard";
import { getSuperAdminDashboardData } from "@/lib/super-admin/dashboard";
import type { OmegaAlert } from "@/lib/omega-enterprise-mobile-engine/types";
import { getOmegaAlerts } from "@/lib/omega-enterprise-mobile-engine/engine";
import { getDeviceLifecycleManagerSnapshot } from "@/lib/device-lifecycle-manager-engine/reader";
import { computeFleetSecurityScore } from "@/lib/device-lifecycle-manager-engine/timeline";

export type ExecutiveLiveContext = {
  dashboard: SuperAdminDashboardData | null;
  dashboardError: string | null;
  health: PlatformHealthReport | null;
  healthError: string | null;
  operations: ProductionOperationsSnapshot | null;
  operationsError: string | null;
  incidents: OperationsIncident[] | null;
  incidentsError: string | null;
  omegaAlerts: OmegaAlert[] | null;
  omegaAlertsError: string | null;
  transactions24h: number | null;
  transactions24hError: string | null;
  refundCount24h: number | null;
  refundCount24hError: string | null;
  protectionFee24h: number | null;
  protectionFee24hError: string | null;
  deviceTrustScore: number | null;
  deviceTrustError: string | null;
};

async function safe<T>(run: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try {
    return { data: await run(), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : "Unavailable" };
  }
}

async function countOrdersSince(since: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin.from("orders").select("*", { count: "exact", head: true }).gte("created_at", since);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function countRefundsSince(since: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("wallet_transactions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since)
    .eq("type", "refund");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function sumProtectionFeesSince(since: string): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("wallet_transactions")
    .select("amount")
    .gte("created_at", since)
    .eq("type", "fee");
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((sum, row) => sum + Math.abs(Number(row.amount)), 0);
}

export async function fetchExecutiveLiveContext(): Promise<ExecutiveLiveContext> {
  const since24h = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

  const [dashboard, health, operations, incidents, omegaAlerts, transactions24h, refundCount24h, protectionFee24h, deviceLifecycle] =
    await Promise.all([
      safe(getSuperAdminDashboardData),
      safe(getPlatformHealthReport),
      safe(getProductionOperationsSnapshot),
      safe(getOperationsIncidents),
      safe(getOmegaAlerts),
      safe(() => countOrdersSince(since24h)),
      safe(() => countRefundsSince(since24h)),
      safe(() => sumProtectionFeesSince(since24h)),
      safe(async () => {
        const snapshot = await getDeviceLifecycleManagerSnapshot();
        return computeFleetSecurityScore(snapshot.devices);
      }),
    ]);

  return {
    dashboard: dashboard.data,
    dashboardError: dashboard.error,
    health: health.data,
    healthError: health.error,
    operations: operations.data,
    operationsError: operations.error,
    incidents: incidents.data,
    incidentsError: incidents.error,
    omegaAlerts: omegaAlerts.data,
    omegaAlertsError: omegaAlerts.error,
    transactions24h: transactions24h.data,
    transactions24hError: transactions24h.error,
    refundCount24h: refundCount24h.data,
    refundCount24hError: refundCount24h.error,
    protectionFee24h: protectionFee24h.data,
    protectionFee24hError: protectionFee24h.error,
    deviceTrustScore: deviceLifecycle.data,
    deviceTrustError: deviceLifecycle.error,
  };
}

export function healthCheckToScore(check: HealthCheckResult | undefined): number | null {
  if (!check) return null;
  if (check.status === "healthy") return 100;
  if (check.status === "degraded") return 72;
  return 38;
}

export function healthStatusToScore(status: PlatformHealthReport["status"] | undefined): number | null {
  if (!status) return null;
  if (status === "healthy") return 100;
  if (status === "degraded") return 74;
  return 40;
}

export function unavailableMetric(label: string): import("@/lib/executive-command-engine/types").ExecutiveLiveMetric {
  return { label, value: null, available: false, display: "No live data" };
}

export function liveNumberMetric(label: string, value: number | null, unit?: string, formatter?: (n: number) => string): import("@/lib/executive-command-engine/types").ExecutiveLiveMetric {
  if (value === null) return unavailableMetric(label);
  const display = formatter ? formatter(value) : unit ? `${value}${unit}` : String(value);
  return { label, value, available: true, display, unit };
}

export function liveTextMetric(label: string, value: string | null): import("@/lib/executive-command-engine/types").ExecutiveLiveMetric {
  if (!value) return unavailableMetric(label);
  return { label, value, available: true, display: value };
}
