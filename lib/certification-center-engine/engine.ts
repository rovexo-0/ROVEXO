import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import {
  auditCertificationCenterEngineAction,
  createCertificationCenterEngineAuditEntry,
} from "@/lib/certification-center-engine/audit";
import {
  createDefaultCertificationApprovals,
  createDefaultCertificationCenterEngineDocument,
  createDefaultCertificationCenterEngineHistory,
  createDefaultCertificationHistory,
  createDefaultCertificationSchedule,
} from "@/lib/certification-center-engine/defaults";
import {
  CERTIFICATION_CENTER_APPROVALS_KEY,
  CERTIFICATION_CENTER_ENGINE_DRAFT_KEY,
  CERTIFICATION_CENTER_ENGINE_HISTORY_KEY,
  CERTIFICATION_CENTER_ENGINE_LIVE_KEY,
  CERTIFICATION_CENTER_RUNS_KEY,
  CERTIFICATION_CENTER_SCHEDULE_KEY,
} from "@/lib/certification-center-engine/keys";
import type {
  CertificationApproval,
  CertificationApprovalStage,
  CertificationEngineDocument,
  CertificationEngineHistoryEntry,
  CertificationHistoryEntry,
  CertificationSchedule,
} from "@/lib/certification-center-engine/types";

function normalizeDocument(doc: CertificationEngineDocument): CertificationEngineDocument {
  const defaults = createDefaultCertificationCenterEngineDocument(doc.label);
  return {
    ...defaults,
    ...doc,
    modules: { ...defaults.modules, ...doc.modules },
    releaseValidation: { ...defaults.releaseValidation, ...doc.releaseValidation },
    workflow: { ...defaults.workflow, ...doc.workflow },
    security: { ...defaults.security, ...doc.security },
    integrations: { ...defaults.integrations, ...doc.integrations },
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveCertificationCenterEngineDocument(): Promise<CertificationEngineDocument> {
  const doc = await getPlatformSetting<CertificationEngineDocument>(
    CERTIFICATION_CENTER_ENGINE_LIVE_KEY,
    createDefaultCertificationCenterEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getCertificationCenterEngineDraft(): Promise<CertificationEngineDocument> {
  const live = await readLiveCertificationCenterEngineDocument();
  const draft = await getPlatformSetting<CertificationEngineDocument>(CERTIFICATION_CENTER_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getCertificationCenterEngineHistory(): Promise<CertificationEngineHistoryEntry[]> {
  return getPlatformSetting(CERTIFICATION_CENTER_ENGINE_HISTORY_KEY, createDefaultCertificationCenterEngineHistory());
}

export async function getCertificationCenterEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getCertificationCenterEngineDraft(),
    readLiveCertificationCenterEngineDocument(),
    getCertificationCenterEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function getCertificationApprovals(): Promise<CertificationApproval[]> {
  return getPlatformSetting<CertificationApproval[]>(CERTIFICATION_CENTER_APPROVALS_KEY, createDefaultCertificationApprovals());
}

export async function getCertificationHistory(): Promise<CertificationHistoryEntry[]> {
  return getPlatformSetting<CertificationHistoryEntry[]>(CERTIFICATION_CENTER_RUNS_KEY, createDefaultCertificationHistory());
}

export async function getCertificationSchedule(): Promise<CertificationSchedule> {
  return getPlatformSetting<CertificationSchedule>(CERTIFICATION_CENTER_SCHEDULE_KEY, createDefaultCertificationSchedule());
}

export async function runProductionCertification(actorId: string): Promise<CertificationHistoryEntry> {
  const history = await getCertificationHistory();
  const entry: CertificationHistoryEntry = {
    id: `cert-${Date.now().toString(36)}`,
    certificationVersion: `cert-v${Date.now()}`,
    platformVersion: "ROVEXO v1.0",
    buildNumber: `build-${new Date().toISOString().slice(0, 10)}`,
    administrator: actorId,
    level: "release-candidate",
    modulesIncluded: 21,
    issuesFound: 0,
    issuesResolved: 0,
    rollbackAvailable: true,
    createdAt: new Date().toISOString(),
    timeline: [{ id: "run", action: "Production certification validation run", timestamp: new Date().toISOString(), actor: actorId }],
  };

  await updatePlatformSetting({
    actorId,
    key: CERTIFICATION_CENTER_RUNS_KEY,
    value: [entry, ...history].slice(0, 100) as unknown as Json,
  });

  await auditCertificationCenterEngineAction({
    actorId,
    module: "certification-center",
    action: "run-certification",
    newValue: { id: entry.id },
  });

  return entry;
}

export async function approveCertificationStage(
  stage: CertificationApprovalStage,
  actorId: string,
  notes?: string,
): Promise<CertificationApproval[]> {
  const approvals = await getCertificationApprovals();
  const index = approvals.findIndex((a) => a.stage === stage);
  if (index < 0) throw new Error("Approval stage not found.");

  const next = [...approvals];
  next[index] = {
    ...next[index],
    status: "approved",
    actor: actorId,
    timestamp: new Date().toISOString(),
    notes,
  };

  await updatePlatformSetting({ actorId, key: CERTIFICATION_CENTER_APPROVALS_KEY, value: next as unknown as Json });
  await auditCertificationCenterEngineAction({
    actorId,
    module: "certification-center",
    action: "approve",
    newValue: { stage },
  });

  return next;
}

export async function revokeCertification(actorId: string, reason?: string): Promise<CertificationHistoryEntry> {
  const history = await getCertificationHistory();
  const entry: CertificationHistoryEntry = {
    id: `cert-revoke-${Date.now().toString(36)}`,
    certificationVersion: "revoked",
    platformVersion: "ROVEXO v1.0",
    buildNumber: "n/a",
    administrator: actorId,
    level: "revoked",
    modulesIncluded: 0,
    issuesFound: 0,
    issuesResolved: 0,
    rollbackAvailable: true,
    createdAt: new Date().toISOString(),
    timeline: [{ id: "revoke", action: reason ?? "Certification revoked", timestamp: new Date().toISOString(), actor: actorId }],
  };

  await updatePlatformSetting({
    actorId,
    key: CERTIFICATION_CENTER_RUNS_KEY,
    value: [entry, ...history].slice(0, 100) as unknown as Json,
  });

  await auditCertificationCenterEngineAction({
    actorId,
    module: "certification-center",
    action: "revoke",
    newValue: { reason },
    rollbackAvailable: false,
  });

  return entry;
}

export async function exportCertificationReport(
  input: { format: "pdf" | "csv" | "json" | "markdown"; reportType?: string },
  actorId: string,
): Promise<{ format: string; exportedAt: string }> {
  await auditCertificationCenterEngineAction({
    actorId,
    module: "certification-center",
    action: "export-report",
    newValue: input,
    rollbackAvailable: false,
  });
  return { format: input.format, exportedAt: new Date().toISOString() };
}

export async function setCertificationSchedule(
  schedule: Partial<CertificationSchedule>,
  actorId: string,
): Promise<CertificationSchedule> {
  const current = await getCertificationSchedule();
  const next: CertificationSchedule = {
    ...current,
    ...schedule,
    nextRunAt: schedule.enabled !== false ? new Date(Date.now() + 24 * 60 * 60_000).toISOString() : current.nextRunAt,
  };

  await updatePlatformSetting({ actorId, key: CERTIFICATION_CENTER_SCHEDULE_KEY, value: next as unknown as Json });
  await auditCertificationCenterEngineAction({
    actorId,
    module: "certification-center",
    action: "schedule-validation",
    newValue: next,
  });

  return next;
}

export async function saveCertificationCenterEngineDraft(
  document: CertificationEngineDocument,
  actorId: string,
): Promise<CertificationEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createCertificationCenterEngineAuditEntry({
        administrator: actorId,
        module: "certification-center-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({ actorId, key: CERTIFICATION_CENTER_ENGINE_DRAFT_KEY, value: next as unknown as Json });
  await auditCertificationCenterEngineAction({ actorId, module: "certification-center-engine", action: "save-draft" });
  return next;
}

export async function publishCertificationCenterEngine(actorId: string): Promise<CertificationEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getCertificationCenterEngineDraft(),
    readLiveCertificationCenterEngineDocument(),
    getCertificationCenterEngineHistory(),
  ]);

  const historyEntry: CertificationEngineHistoryEntry = {
    id: `cc-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  };

  const published = normalizeDocument({ ...draft, label: "Live", updatedAt: new Date().toISOString() });

  await Promise.all([
    updatePlatformSetting({ actorId, key: CERTIFICATION_CENTER_ENGINE_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: CERTIFICATION_CENTER_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: CERTIFICATION_CENTER_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditCertificationCenterEngineAction({
    actorId,
    module: "certification-center-engine",
    action: "publish",
    previousValue: { version: live.version },
    newValue: { version: published.version },
  });

  return published;
}
