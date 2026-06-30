import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformHealthReport } from "@/lib/ops/health";
import { getProductionOperationsSnapshot } from "@/lib/ops/production-status";
import { getSuperAdminDashboardData } from "@/lib/super-admin/dashboard";
import {
  getOperationsEngineSnapshotForAdmin,
  getOperationsIncidents,
  getOperationsMaintenanceState,
  readLiveOperationsEngineDocument,
} from "@/lib/operations-center-engine/engine";
import {
  buildDashboardWidgets,
  buildLiveCounters,
  buildOperationsAlerts,
  buildOperationsDashboard,
  buildPlatformServices,
  buildSystemMetrics,
  getRecoveryActions,
  searchOperationsData,
} from "@/lib/operations-center-engine/timeline";
import type { OperationsEngineSnapshot, OperationsLogEntry } from "@/lib/operations-center-engine/types";

async function fetchOperationsLogs(): Promise<Record<string, OperationsLogEntry[]>> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const categories = ["api", "cron", "email", "payment", "auth", "admin", "storage", "unhandled"] as const;

  const entries = await Promise.all(
    categories.map(async (category) => {
      const { data } = await admin
        .from("platform_error_logs")
        .select("id, level, category, message, created_at")
        .eq("category", category)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20);
      return [
        category,
        (data ?? []).map((row) => ({
          id: row.id,
          level: row.level,
          category: row.category,
          message: row.message,
          createdAt: row.created_at,
        })),
      ] as const;
    }),
  );

  const auditLogs = await admin
    .from("platform_audit_logs")
    .select("id, action, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    application: entries.find(([c]) => c === "unhandled")?.[1] ?? [],
    api: entries.find(([c]) => c === "api")?.[1] ?? [],
    system: entries.find(([c]) => c === "admin")?.[1] ?? [],
    security: entries.find(([c]) => c === "auth")?.[1] ?? [],
    authentication: entries.find(([c]) => c === "auth")?.[1] ?? [],
    payment: entries.find(([c]) => c === "payment")?.[1] ?? [],
    shipping: [],
    webhook: [],
    cron: entries.find(([c]) => c === "cron")?.[1] ?? [],
    deployment: [],
    error: entries.find(([c]) => c === "unhandled")?.[1] ?? [],
    audit:
      auditLogs.data?.map((row) => ({
        id: row.id,
        level: "info",
        category: "audit",
        message: row.action,
        createdAt: row.created_at,
      })) ?? [],
  };
}

export async function getOperationsCenterEngineSnapshot(): Promise<OperationsEngineSnapshot> {
  const [{ draft, live, history }, operations, health, dashboard, incidents, maintenance, logs] =
    await Promise.all([
      getOperationsEngineSnapshotForAdmin(),
      getProductionOperationsSnapshot(),
      getPlatformHealthReport(),
      getSuperAdminDashboardData(),
      getOperationsIncidents(),
      getOperationsMaintenanceState(),
      fetchOperationsLogs(),
    ]);

  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { count: errorCount } = await admin
    .from("platform_error_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);

  const services = buildPlatformServices({ health, operations, env: operations.environment });
  const systemMetrics = buildSystemMetrics({ health, operations, errorCount: errorCount ?? 0 });
  const counters = buildLiveCounters({ dashboard, operations, health });
  const alerts = buildOperationsAlerts({ operations, health });
  const widgets = buildDashboardWidgets({ dashboard, operations, health });
  const recoveryActions = getRecoveryActions(live);

  return {
    scannedAt: new Date().toISOString(),
    services,
    systemMetrics,
    counters,
    alerts,
    incidents,
    logs,
    maintenance,
    recoveryActions,
    widgets,
    draft,
    live,
    history,
  };
}

export async function getOperationsCenterPageData() {
  const snapshot = await getOperationsCenterEngineSnapshot();
  const dashboard = buildOperationsDashboard({
    config: snapshot.live,
    services: snapshot.services,
    alerts: snapshot.alerts,
    incidents: snapshot.incidents,
    maintenance: snapshot.maintenance,
  });
  return { snapshot, dashboard };
}

export async function searchOperationsCenter(query: string) {
  const snapshot = await getOperationsCenterEngineSnapshot();
  return {
    scannedAt: snapshot.scannedAt,
    ...searchOperationsData({
      query,
      services: snapshot.services,
      alerts: snapshot.alerts,
      incidents: snapshot.incidents,
      logs: snapshot.logs,
    }),
  };
}

export async function getOperationsHealthData() {
  const snapshot = await getOperationsCenterEngineSnapshot();
  return {
    scannedAt: snapshot.scannedAt,
    services: snapshot.services,
    systemMetrics: snapshot.systemMetrics,
    widgets: snapshot.widgets,
  };
}

export async function getOperationsLogsData() {
  const snapshot = await getOperationsCenterEngineSnapshot();
  return { scannedAt: snapshot.scannedAt, logs: snapshot.logs };
}

export async function getOperationsAlertsData() {
  const snapshot = await getOperationsCenterEngineSnapshot();
  return { scannedAt: snapshot.scannedAt, alerts: snapshot.alerts };
}

export async function getOperationsIncidentsData() {
  const snapshot = await getOperationsCenterEngineSnapshot();
  return { scannedAt: snapshot.scannedAt, incidents: snapshot.incidents };
}

export async function getPublicOperationsEngineConfig() {
  return readLiveOperationsEngineDocument();
}
