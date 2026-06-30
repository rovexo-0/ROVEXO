import { createAdminClient } from "@/lib/supabase/admin";
import { getOperationsIncidents } from "@/lib/operations-center-engine/engine";
import type { OperationsIncident } from "@/lib/operations-center-engine/types";
import { getProductionOperationsSnapshot } from "@/lib/ops/production-status";
import type { PlatformHealthReport } from "@/lib/ops/health";
import { getPlatformHealthReport } from "@/lib/ops/health";
import { getDeviceLifecycleAlerts } from "@/lib/device-lifecycle-manager-engine/engine";
import type { DeviceLifecycleAlert } from "@/lib/device-lifecycle-manager-engine/types";
import { getOmegaAlerts } from "@/lib/omega-enterprise-mobile-engine/engine";
import type { OmegaAlert } from "@/lib/omega-enterprise-mobile-engine/types";

export type IncidentLiveContext = {
  operationsIncidents: OperationsIncident[] | null;
  operationsError: string | null;
  omegaAlerts: OmegaAlert[] | null;
  omegaError: string | null;
  deviceAlerts: DeviceLifecycleAlert[] | null;
  deviceError: string | null;
  health: PlatformHealthReport | null;
  healthError: string | null;
  operations: Awaited<ReturnType<typeof getProductionOperationsSnapshot>> | null;
  operationsSnapshotError: string | null;
  platformErrors: Array<{ id: string; level: string; category: string; message: string; createdAt: string }> | null;
  platformErrorsError: string | null;
  resolvedTodayCount: number | null;
};

async function safe<T>(run: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try {
    return { data: await run(), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : "Unavailable" };
  }
}

export async function fetchIncidentLiveContext(): Promise<IncidentLiveContext> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [operationsIncidents, omegaAlerts, deviceAlerts, health, operations, platformErrors] = await Promise.all([
    safe(getOperationsIncidents),
    safe(getOmegaAlerts),
    safe(getDeviceLifecycleAlerts),
    safe(getPlatformHealthReport),
    safe(getProductionOperationsSnapshot),
    safe(async () => {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("platform_error_logs")
        .select("id, level, category, message, created_at")
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: row.id,
        level: row.level,
        category: row.category,
        message: row.message,
        createdAt: row.created_at,
      }));
    }),
  ]);

  let resolvedTodayCount: number | null = null;
  if (operationsIncidents.data) {
    resolvedTodayCount = operationsIncidents.data.filter(
      (i) => i.status === "resolved" && new Date(i.updatedAt) >= todayStart,
    ).length;
  }

  return {
    operationsIncidents: operationsIncidents.data,
    operationsError: operationsIncidents.error,
    omegaAlerts: omegaAlerts.data,
    omegaError: omegaAlerts.error,
    deviceAlerts: deviceAlerts.data,
    deviceError: deviceAlerts.error,
    health: health.data,
    healthError: health.error,
    operations: operations.data,
    operationsSnapshotError: operations.error,
    platformErrors: platformErrors.data,
    platformErrorsError: platformErrors.error,
    resolvedTodayCount,
  };
}
