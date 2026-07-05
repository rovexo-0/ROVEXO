import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditIncidentTimelineAction, canPerformTimelineExport } from "@/lib/incident-timeline-engine/audit";
import {
  INCIDENT_TIMELINE_EXPORTS_KEY,
  INCIDENT_TIMELINE_RECORDS_KEY,
} from "@/lib/incident-timeline-engine/keys";
import { INCIDENT_TIMELINE_EXPORT_TYPES } from "@/lib/incident-timeline-engine/registry";
import type {
  IncidentTimelineExportRecord,
  IncidentTimelineSettings,
  PersistedTimelineRecord,
} from "@/lib/incident-timeline-engine/types";
import { executeOmegaEnterpriseAction } from "@/lib/omega-enterprise-mobile-engine/engine";

export function createDefaultIncidentTimelineSettings(): IncidentTimelineSettings {
  return {
    retentionDays: 90,
    liveRefreshSeconds: 30,
    requireMfaForExport: true,
    appendOnly: true,
  };
}

export async function getIncidentTimelineSettings(): Promise<IncidentTimelineSettings> {
  const { incidentTimelineConfigLifecycle } = await import("@/lib/incident-timeline-engine/config");
  const live = await incidentTimelineConfigLifecycle.readLive();
  return live.settings;
}

export async function getIncidentTimelineExports(): Promise<IncidentTimelineExportRecord[]> {
  return getPlatformSetting(INCIDENT_TIMELINE_EXPORTS_KEY, []);
}

export async function getPersistedTimelineRecords(): Promise<PersistedTimelineRecord[]> {
  return getPlatformSetting(INCIDENT_TIMELINE_RECORDS_KEY, []);
}

async function appendTimelineRecord(record: PersistedTimelineRecord, actorId: string) {
  const records = await getPersistedTimelineRecords();
  await updatePlatformSetting({
    actorId,
    key: INCIDENT_TIMELINE_RECORDS_KEY,
    value: [record, ...records].slice(0, 500) as unknown as Json,
  });
}

export async function executeIncidentTimelineAction(
  action: string,
  actorId: string,
  payload?: {
    format?: "pdf" | "csv" | "xlsx";
    exportId?: string;
    document?: import("@/lib/incident-timeline-engine/config").IncidentTimelineConfigDocument;
    historyId?: string;
  },
): Promise<void> {
  const { isIncidentTimelineConfigAction, executeIncidentTimelineConfigAction } = await import(
    "@/lib/incident-timeline-engine/config-actions"
  );
  if (isIncidentTimelineConfigAction(action)) {
    await executeIncidentTimelineConfigAction(action, actorId, payload);
    return;
  }

  const settings = await getIncidentTimelineSettings();

  if (action === "verify-integrity") {
    await executeOmegaEnterpriseAction("run-scan", actorId);
    await appendTimelineRecord(
      {
        id: `tl-${Date.now().toString(36)}`,
        incidentId: "timeline-integrity",
        timestamp: new Date().toISOString(),
        eventType: "integrity-verification",
        detail: "OMEGA timeline integrity verification executed",
        actorId,
        sourceHash: `integrity-${Date.now()}`,
      },
      actorId,
    );
  } else if (action === "export" || action.startsWith("export-")) {
    const permission = canPerformTimelineExport(settings);
    if (!permission.allowed) throw new Error(permission.reason ?? "Export not allowed");

    const exportDef =
      INCIDENT_TIMELINE_EXPORT_TYPES.find((e) => e.id === payload?.exportId) ??
      INCIDENT_TIMELINE_EXPORT_TYPES.find((e) => e.format === (payload?.format ?? "pdf")) ??
      INCIDENT_TIMELINE_EXPORT_TYPES[0]!;

    const exports = await getIncidentTimelineExports();
    const record: IncidentTimelineExportRecord = {
      id: `itl-export-${Date.now().toString(36)}`,
      label: exportDef.label,
      format: payload?.format ?? exportDef.format,
      generatedAt: new Date().toISOString(),
      generatedBy: actorId,
    };
    await updatePlatformSetting({
      actorId,
      key: INCIDENT_TIMELINE_EXPORTS_KEY,
      value: [record, ...exports].slice(0, 30) as unknown as Json,
    });
    await appendTimelineRecord(
      {
        id: record.id,
        incidentId: "timeline-export",
        timestamp: record.generatedAt,
        eventType: "export",
        detail: `${record.label} (${record.format}) generated`,
        actorId,
        sourceHash: `export-${record.id}`,
      },
      actorId,
    );
  } else {
    throw new Error("Unknown action");
  }

  await auditIncidentTimelineAction({ actorId, action, exportId: payload?.exportId, newValue: payload });
}
