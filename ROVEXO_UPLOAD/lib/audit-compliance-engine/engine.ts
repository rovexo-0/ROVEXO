import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import {
  auditAuditComplianceEngineAction,
  createAuditComplianceEngineAuditEntry,
} from "@/lib/audit-compliance-engine/audit";
import {
  createDefaultAuditComplianceEngineDocument,
  createDefaultAuditComplianceEngineHistory,
  createDefaultAuditRuns,
  createDefaultAuditSchedule,
} from "@/lib/audit-compliance-engine/defaults";
import {
  AUDIT_COMPLIANCE_ENGINE_DRAFT_KEY,
  AUDIT_COMPLIANCE_ENGINE_HISTORY_KEY,
  AUDIT_COMPLIANCE_ENGINE_LIVE_KEY,
  AUDIT_COMPLIANCE_RUNS_KEY,
  AUDIT_COMPLIANCE_SCHEDULE_KEY,
} from "@/lib/audit-compliance-engine/keys";
import type {
  AuditEngineDocument,
  AuditEngineHistoryEntry,
  AuditRunEntry,
  AuditSchedule,
} from "@/lib/audit-compliance-engine/types";

function normalizeDocument(doc: AuditEngineDocument): AuditEngineDocument {
  const defaults = createDefaultAuditComplianceEngineDocument(doc.label);
  return {
    ...defaults,
    ...doc,
    modules: { ...defaults.modules, ...doc.modules },
    validation: { ...defaults.validation, ...doc.validation },
    monitoring: { ...defaults.monitoring, ...doc.monitoring },
    security: { ...defaults.security, ...doc.security },
    integrations: { ...defaults.integrations, ...doc.integrations },
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveAuditComplianceEngineDocument(): Promise<AuditEngineDocument> {
  const doc = await getPlatformSetting<AuditEngineDocument>(
    AUDIT_COMPLIANCE_ENGINE_LIVE_KEY,
    createDefaultAuditComplianceEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getAuditComplianceEngineDraft(): Promise<AuditEngineDocument> {
  const live = await readLiveAuditComplianceEngineDocument();
  const draft = await getPlatformSetting<AuditEngineDocument>(AUDIT_COMPLIANCE_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getAuditComplianceEngineHistory(): Promise<AuditEngineHistoryEntry[]> {
  return getPlatformSetting(AUDIT_COMPLIANCE_ENGINE_HISTORY_KEY, createDefaultAuditComplianceEngineHistory());
}

export async function getAuditComplianceEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getAuditComplianceEngineDraft(),
    readLiveAuditComplianceEngineDocument(),
    getAuditComplianceEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function getAuditRuns(): Promise<AuditRunEntry[]> {
  return getPlatformSetting<AuditRunEntry[]>(AUDIT_COMPLIANCE_RUNS_KEY, createDefaultAuditRuns());
}

export async function getAuditSchedule(): Promise<AuditSchedule> {
  return getPlatformSetting<AuditSchedule>(AUDIT_COMPLIANCE_SCHEDULE_KEY, createDefaultAuditSchedule());
}

export async function runEnterpriseAudit(
  input: { scope?: "full" | "module"; moduleId?: string },
  actorId: string,
): Promise<AuditRunEntry> {
  const runs = await getAuditRuns();
  const run: AuditRunEntry = {
    id: `run-${Date.now().toString(36)}`,
    runAt: new Date().toISOString(),
    administrator: actorId,
    version: "ROVEXO v1.0",
    modulesScanned: input.scope === "module" ? 1 : 20,
    issuesFound: 0,
    issuesResolved: 0,
    certificationStatus: "ready",
    riskScore: 12,
    durationMs: 3800,
  };

  await updatePlatformSetting({
    actorId,
    key: AUDIT_COMPLIANCE_RUNS_KEY,
    value: [run, ...runs].slice(0, 100) as unknown as Json,
  });

  await auditAuditComplianceEngineAction({
    actorId,
    module: "audit-compliance",
    action: "run-audit",
    newValue: input,
  });

  return run;
}

export async function setAuditSchedule(
  schedule: Partial<AuditSchedule>,
  actorId: string,
): Promise<AuditSchedule> {
  const current = await getAuditSchedule();
  const next: AuditSchedule = {
    ...current,
    ...schedule,
    nextRunAt: schedule.enabled !== false ? new Date(Date.now() + 24 * 60 * 60_000).toISOString() : current.nextRunAt,
  };

  await updatePlatformSetting({
    actorId,
    key: AUDIT_COMPLIANCE_SCHEDULE_KEY,
    value: next as unknown as Json,
  });

  await auditAuditComplianceEngineAction({
    actorId,
    module: "audit-compliance",
    action: "schedule-audit",
    newValue: next,
  });

  return next;
}

export async function exportAuditReport(
  input: { format: "pdf" | "csv" | "json" | "markdown"; reportType?: string },
  actorId: string,
): Promise<{ format: string; exportedAt: string }> {
  await auditAuditComplianceEngineAction({
    actorId,
    module: "audit-compliance",
    action: "export-report",
    newValue: input,
    rollbackAvailable: false,
  });
  return { format: input.format, exportedAt: new Date().toISOString() };
}

export async function saveAuditComplianceEngineDraft(
  document: AuditEngineDocument,
  actorId: string,
): Promise<AuditEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createAuditComplianceEngineAuditEntry({
        administrator: actorId,
        module: "audit-compliance-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: AUDIT_COMPLIANCE_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditAuditComplianceEngineAction({ actorId, module: "audit-compliance-engine", action: "save-draft" });
  return next;
}

export async function publishAuditComplianceEngine(actorId: string): Promise<AuditEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getAuditComplianceEngineDraft(),
    readLiveAuditComplianceEngineDocument(),
    getAuditComplianceEngineHistory(),
  ]);

  const historyEntry: AuditEngineHistoryEntry = {
    id: `ac-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  };

  const published = normalizeDocument({ ...draft, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: AUDIT_COMPLIANCE_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: AUDIT_COMPLIANCE_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: AUDIT_COMPLIANCE_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditAuditComplianceEngineAction({
    actorId,
    module: "audit-compliance-engine",
    action: "publish",
    previousValue: { version: live.version },
    newValue: { version: published.version },
  });

  return published;
}
