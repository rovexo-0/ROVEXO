import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import {
  auditMissionControlEngineAction,
  createMissionControlEngineAuditEntry,
} from "@/lib/mission-control-engine/audit";
import {
  createDefaultMissionControlEngineDocument,
  createDefaultMissionControlEngineHistory,
} from "@/lib/mission-control-engine/defaults";
import {
  MISSION_CONTROL_ENGINE_DRAFT_KEY,
  MISSION_CONTROL_ENGINE_HISTORY_KEY,
  MISSION_CONTROL_ENGINE_LIVE_KEY,
} from "@/lib/mission-control-engine/keys";
import type {
  MissionControlEngineDocument,
  MissionControlEngineHistoryEntry,
} from "@/lib/mission-control-engine/types";

function normalizeDocument(doc: MissionControlEngineDocument): MissionControlEngineDocument {
  const defaults = createDefaultMissionControlEngineDocument(doc.label);
  return {
    ...defaults,
    ...doc,
    sections: doc.sections ?? defaults.sections,
    quickActions: doc.quickActions ?? defaults.quickActions,
    widgets: { ...defaults.widgets, ...doc.widgets },
    productivity: { ...defaults.productivity, ...doc.productivity },
    monitoring: { ...defaults.monitoring, ...doc.monitoring },
    security: { ...defaults.security, ...doc.security },
    integrations: { ...defaults.integrations, ...doc.integrations },
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveMissionControlEngineDocument(): Promise<MissionControlEngineDocument> {
  const doc = await getPlatformSetting<MissionControlEngineDocument>(
    MISSION_CONTROL_ENGINE_LIVE_KEY,
    createDefaultMissionControlEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getMissionControlEngineDraft(): Promise<MissionControlEngineDocument> {
  const live = await readLiveMissionControlEngineDocument();
  const draft = await getPlatformSetting<MissionControlEngineDocument>(
    MISSION_CONTROL_ENGINE_DRAFT_KEY,
    live,
  );
  return normalizeDocument({
    ...draft,
    label: draft.label === "Live" ? "Draft" : draft.label,
  });
}

export async function getMissionControlEngineHistory(): Promise<MissionControlEngineHistoryEntry[]> {
  return getPlatformSetting(
    MISSION_CONTROL_ENGINE_HISTORY_KEY,
    createDefaultMissionControlEngineHistory(),
  );
}

export async function getMissionControlEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getMissionControlEngineDraft(),
    readLiveMissionControlEngineDocument(),
    getMissionControlEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function saveMissionControlEngineDraft(
  document: MissionControlEngineDocument,
  actorId: string,
): Promise<MissionControlEngineDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createMissionControlEngineAuditEntry({
        administrator: actorId,
        module: "mission-control-engine",
        action: "save-draft",
        newValue: { version: document.version },
      }),
      ...document.auditLog,
    ].slice(0, 100),
  });

  await updatePlatformSetting({
    actorId,
    key: MISSION_CONTROL_ENGINE_DRAFT_KEY,
    value: next as unknown as Json,
  });
  await auditMissionControlEngineAction({
    actorId,
    module: "mission-control-engine",
    action: "save-draft",
    newValue: { version: next.version },
  });
  return next;
}

export async function publishMissionControlEngine(actorId: string): Promise<MissionControlEngineDocument> {
  const [draft, live, history] = await Promise.all([
    getMissionControlEngineDraft(),
    readLiveMissionControlEngineDocument(),
    getMissionControlEngineHistory(),
  ]);

  const historyEntry: MissionControlEngineHistoryEntry = {
    id: `mce-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  };

  const published = normalizeDocument({
    ...draft,
    label: "Live",
    updatedAt: new Date().toISOString(),
    auditLog: [
      createMissionControlEngineAuditEntry({
        administrator: actorId,
        module: "mission-control-engine",
        action: "publish",
        previousValue: { version: live.version },
        newValue: { version: draft.version },
      }),
      ...draft.auditLog,
    ].slice(0, 100),
  });

  await Promise.all([
    updatePlatformSetting({
      actorId,
      key: MISSION_CONTROL_ENGINE_LIVE_KEY,
      value: published as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: MISSION_CONTROL_ENGINE_DRAFT_KEY,
      value: { ...published, label: "Draft" } as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: MISSION_CONTROL_ENGINE_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 20) as unknown as Json,
    }),
  ]);

  await auditMissionControlEngineAction({
    actorId,
    module: "mission-control-engine",
    action: "publish",
    previousValue: { label: live.label, version: live.version },
    newValue: { label: published.label, version: published.version },
  });

  return published;
}

export async function rollbackMissionControlEngine(
  historyId: string,
  actorId: string,
): Promise<MissionControlEngineDocument> {
  const history = await getMissionControlEngineHistory();
  const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
  if (!entry?.bundle) throw new Error("Mission Control Engine rollback entry not found.");

  const restored = normalizeDocument({
    ...entry.bundle,
    label: "Live",
    updatedAt: new Date().toISOString(),
  });

  await Promise.all([
    updatePlatformSetting({
      actorId,
      key: MISSION_CONTROL_ENGINE_LIVE_KEY,
      value: restored as unknown as Json,
    }),
    updatePlatformSetting({
      actorId,
      key: MISSION_CONTROL_ENGINE_DRAFT_KEY,
      value: { ...restored, label: "Draft" } as unknown as Json,
    }),
  ]);

  await auditMissionControlEngineAction({
    actorId,
    module: "mission-control-engine",
    action: "rollback",
    previousValue: { historyId },
    newValue: { label: restored.label, version: restored.version },
  });

  return restored;
}

export async function resetMissionControlEngineDraft(actorId: string): Promise<MissionControlEngineDocument> {
  const live = await readLiveMissionControlEngineDocument();
  return saveMissionControlEngineDraft({ ...live, label: "Draft" }, actorId);
}

export async function duplicateMissionControlEngineDraft(
  actorId: string,
): Promise<MissionControlEngineDocument> {
  const draft = await getMissionControlEngineDraft();
  return saveMissionControlEngineDraft(
    { ...draft, label: `${draft.label} Copy`, version: draft.version + 1 },
    actorId,
  );
}

export async function exportMissionControlEngineDocument(): Promise<MissionControlEngineDocument> {
  return getMissionControlEngineDraft();
}

export async function importMissionControlEngineDocument(
  document: MissionControlEngineDocument,
  actorId: string,
): Promise<MissionControlEngineDocument> {
  return saveMissionControlEngineDraft(document, actorId);
}
