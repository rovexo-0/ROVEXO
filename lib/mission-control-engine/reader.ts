import { createAdminClient } from "@/lib/supabase/admin";
import { getProductionOperationsSnapshot } from "@/lib/ops/production-status";
import { getSuperAdminDashboardData } from "@/lib/super-admin/dashboard";
import { getMonitoringWidgets } from "@/lib/super-admin/insights";
import { getMissionControlSnapshot } from "@/lib/super-admin/mission-control/snapshot";
import {
  getMissionControlEngineSnapshotForAdmin,
  readLiveMissionControlEngineDocument,
} from "@/lib/mission-control-engine/engine";
import {
  MISSION_CONTROL_ENGINE_SECTIONS,
  MISSION_CONTROL_QUICK_ACTIONS,
} from "@/lib/mission-control-engine/registry";
import {
  attachSectionBadges,
  buildMissionControlDashboard,
  buildMissionControlLiveWidgets,
  buildMissionControlMonitoring,
  buildMissionControlNotificationPreviews,
  buildMissionControlStatusBar,
  computeMissionControlAnalytics,
} from "@/lib/mission-control-engine/timeline";
import type {
  MissionControlEngineSnapshot,
  MissionControlV2Context,
} from "@/lib/mission-control-engine/types";
import type { MissionControlSnapshot } from "@/lib/super-admin/mission-control/types";

async function readAuditEvents24h(): Promise<number> {
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const { count } = await admin
      .from("platform_audit_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getMissionControlEngineSnapshot(): Promise<MissionControlEngineSnapshot> {
  const { draft, live, history } = await getMissionControlEngineSnapshotForAdmin();
  return {
    scannedAt: new Date().toISOString(),
    sections: MISSION_CONTROL_ENGINE_SECTIONS,
    draft,
    live,
    history,
  };
}

export async function getPublicMissionControlEngineConfig() {
  return readLiveMissionControlEngineDocument();
}

export async function buildMissionControlV2Context(
  snapshot: MissionControlSnapshot,
): Promise<MissionControlV2Context> {
  const [dashboard, operations, config, auditEvents24h] = await Promise.all([
    getSuperAdminDashboardData(),
    getProductionOperationsSnapshot(),
    readLiveMissionControlEngineDocument(),
    readAuditEvents24h(),
  ]);

  const monitoringWidgets = await getMonitoringWidgets(operations.health);
  const widgets = buildMissionControlLiveWidgets({ snapshot, dashboard, operations, config });
  const dashboardSummary = buildMissionControlDashboard({ config, widgets, auditEvents24h });

  return {
    dashboard: dashboardSummary,
    statusBar: buildMissionControlStatusBar({ snapshot, operations }),
    widgets,
    monitoring: buildMissionControlMonitoring({ operations, monitoringWidgets, config }),
    notifications: buildMissionControlNotificationPreviews({ operations }),
    scannedAt: new Date().toISOString(),
  };
}

export async function getMissionControlV2PageData() {
  const [snapshot, config, auditEvents24h] = await Promise.all([
    getMissionControlSnapshot(),
    readLiveMissionControlEngineDocument(),
    readAuditEvents24h(),
  ]);

  const context = await buildMissionControlV2Context(snapshot);
  const enabledSectionIds = new Set<string>(
    config.sections.filter((s) => s.enabled).map((s) => s.id),
  );
  const enabledQuickActionIds = new Set(
    config.quickActions.filter((a) => a.enabled).map((a) => a.id),
  );

  const sections = attachSectionBadges(
    MISSION_CONTROL_ENGINE_SECTIONS.filter((s) => enabledSectionIds.has(s.id)),
    snapshot.counters,
  );

  const quickActions = MISSION_CONTROL_QUICK_ACTIONS.filter((a) =>
    enabledQuickActionIds.has(a.id),
  );

  const analytics = computeMissionControlAnalytics({ sections, config });

  return {
    snapshot,
    context,
    sections,
    quickActions,
    config,
    analytics,
    auditEvents24h,
  };
}

export async function getMissionControlV2PageDataFromSnapshot(snapshot: MissionControlSnapshot) {
  const [config, auditEvents24h] = await Promise.all([
    readLiveMissionControlEngineDocument(),
    readAuditEvents24h(),
  ]);

  const context = await buildMissionControlV2Context(snapshot);
  const enabledSectionIds = new Set<string>(
    config.sections.filter((s) => s.enabled).map((s) => s.id),
  );
  const enabledQuickActionIds = new Set(
    config.quickActions.filter((a) => a.enabled).map((a) => a.id),
  );

  const sections = attachSectionBadges(
    MISSION_CONTROL_ENGINE_SECTIONS.filter((s) => enabledSectionIds.has(s.id)),
    snapshot.counters,
  );

  const quickActions = MISSION_CONTROL_QUICK_ACTIONS.filter((a) =>
    enabledQuickActionIds.has(a.id),
  );

  return {
    snapshot,
    context,
    sections,
    quickActions,
    config,
    analytics: computeMissionControlAnalytics({ sections, config }),
    auditEvents24h,
  };
}
