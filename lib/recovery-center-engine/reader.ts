import {
  createDefaultBackups,
  createDefaultRecoveryCenterEngineDocument,
  createDefaultRecoveryCenterEngineHistory,
  createDefaultRecoveryHistory,
  createDefaultSafeModeState,
} from "@/lib/recovery-center-engine/defaults";
import { getPlatformHealthReport } from "@/lib/ops/health";
import type { ProductionOperationsSnapshot } from "@/lib/ops/production-status";
import { getProductionOperationsSnapshot } from "@/lib/ops/production-status";
import { getOperationsIncidents, getOperationsMaintenanceState } from "@/lib/operations-center-engine/engine";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAutomationControls } from "@/lib/super-admin/insights";
import {
  getRecoveryBackups,
  getRecoveryCenterEngineSnapshotForAdmin,
  getRecoveryHistory,
  getRecoveryIncidents,
  getRecoverySafeModeState,
  readLiveRecoveryCenterEngineDocument,
} from "@/lib/recovery-center-engine/engine";
import {
  buildBusinessContinuity,
  buildRecoveryAlerts,
  buildRecoveryDashboard,
  buildRecoveryDashboardWidgets,
  buildRecoveryMonitor,
  getRecoveryAutomationActions,
  getRollbackTargets,
  searchRecoveryData,
} from "@/lib/recovery-center-engine/timeline";
import type { RecoveryEngineSnapshot } from "@/lib/recovery-center-engine/types";

export async function getRecoveryCenterEngineSnapshot(): Promise<RecoveryEngineSnapshot> {
  const [
    { draft, live, history: configHistory },
    health,
    operations,
    backups,
    history,
    incidents,
    safeMode,
    maintenance,
    opsIncidents,
    automation,
  ] = await Promise.all([
    getRecoveryCenterEngineSnapshotForAdmin(),
    getPlatformHealthReport(),
    getProductionOperationsSnapshot(),
    getRecoveryBackups(),
    getRecoveryHistory(),
    getRecoveryIncidents(),
    getRecoverySafeModeState(),
    getOperationsMaintenanceState(),
    getOperationsIncidents(),
    getAutomationControls(),
  ]);

  const rollbackTargets = getRollbackTargets(live);
  const alerts = buildRecoveryAlerts({
    backups,
    safeMode,
    healthStatus: health.status,
    automationEnabled: automation.automaticBackups,
  });
  const dashboard = buildRecoveryDashboard({
    config: live,
    backups,
    history,
    safeMode,
    incidents: incidents.length > 0 ? incidents : opsIncidents.map((i) => ({
      id: i.id,
      title: i.title,
      priority: i.priority,
      status: i.status,
      owner: i.owner,
      notes: i.notes,
      checklist: ["Assess impact", "Notify team"],
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
      timeline: i.timeline,
    })),
    maintenanceEnabled: maintenance.enabled,
    healthStatus: health.status,
  });
  const widgets = buildRecoveryDashboardWidgets({
    backups,
    history,
    safeMode,
    incidents,
    maintenanceEnabled: maintenance.enabled,
    healthStatus: health.status,
  });
  const businessContinuity = buildBusinessContinuity({ backups, healthStatus: health.status, operations });
  const monitor = buildRecoveryMonitor({ backups, history });
  const automationActions = getRecoveryAutomationActions(live);

  return {
    scannedAt: new Date().toISOString(),
    platformStatus: health.status === "healthy" ? "healthy" : health.status === "degraded" ? "warning" : "critical",
    dashboard,
    widgets,
    backups,
    history,
    rollbackTargets,
    alerts,
    incidents,
    safeMode,
    businessContinuity,
    monitor,
    automation: automationActions,
    draft,
    live,
    configHistory,
  };
}

export async function getRecoveryCenterPageData() {
  const snapshot = await getRecoveryCenterEngineSnapshot();
  return { snapshot };
}

/** Static snapshot for build/prerender when live Supabase or health probes are unavailable. */
export function getRecoveryCenterOfflineSnapshot(): RecoveryEngineSnapshot {
  const live = createDefaultRecoveryCenterEngineDocument("Live");
  const draft = createDefaultRecoveryCenterEngineDocument("Draft");
  const configHistory = createDefaultRecoveryCenterEngineHistory();
  const backups = createDefaultBackups();
  const history = createDefaultRecoveryHistory();
  const safeMode = createDefaultSafeModeState();
  const incidents: RecoveryEngineSnapshot["incidents"] = [];
  const healthStatus = "healthy" as const;
  const maintenanceEnabled = false;
  const automationEnabled = true;

  const dashboard = buildRecoveryDashboard({
    config: live,
    backups,
    history,
    safeMode,
    incidents,
    maintenanceEnabled,
    healthStatus,
  });
  const widgets = buildRecoveryDashboardWidgets({
    backups,
    history,
    safeMode,
    incidents,
    maintenanceEnabled,
    healthStatus,
  });
  const alerts = buildRecoveryAlerts({
    backups,
    safeMode,
    healthStatus,
    automationEnabled,
  });
  const businessContinuity = buildBusinessContinuity({
    backups,
    healthStatus,
    operations: {
      environment: {
        supabase: true,
        stripe: false,
        resend: false,
        redis: false,
        cron: false,
        appUrl: true,
      },
    } as ProductionOperationsSnapshot,
  });
  const monitor = buildRecoveryMonitor({ backups, history });
  const automation = getRecoveryAutomationActions(live);

  return {
    scannedAt: new Date().toISOString(),
    platformStatus: "healthy",
    dashboard,
    widgets,
    backups,
    history,
    rollbackTargets: getRollbackTargets(live),
    alerts,
    incidents,
    safeMode,
    businessContinuity,
    monitor,
    automation,
    draft,
    live,
    configHistory,
  };
}

export async function searchRecoveryCenter(query: string) {
  const snapshot = await getRecoveryCenterEngineSnapshot();
  return {
    scannedAt: snapshot.scannedAt,
    ...searchRecoveryData({
      query,
      backups: snapshot.backups,
      history: snapshot.history,
      incidents: snapshot.incidents,
      rollbackTargets: snapshot.rollbackTargets,
    }),
  };
}

export async function getRecoveryBackupsData() {
  const snapshot = await getRecoveryCenterEngineSnapshot();
  return { scannedAt: snapshot.scannedAt, backups: snapshot.backups };
}

export async function getRecoveryHistoryData() {
  const snapshot = await getRecoveryCenterEngineSnapshot();
  return { scannedAt: snapshot.scannedAt, history: snapshot.history };
}

export async function getRecoveryIncidentsData() {
  const snapshot = await getRecoveryCenterEngineSnapshot();
  return { scannedAt: snapshot.scannedAt, incidents: snapshot.incidents };
}

export async function getPublicRecoveryCenterEngineConfig() {
  return readLiveRecoveryCenterEngineDocument();
}

export async function getRecoveryAuditTrail(limit = 20) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_audit_logs")
    .select("id, action, created_at, actor_id")
    .or("action.eq.recovery_center_engine.change,action.eq.backups.manual_ack")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    createdAt: row.created_at,
    actorId: row.actor_id,
  }));
}
