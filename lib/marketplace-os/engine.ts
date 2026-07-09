import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { createDefaultMosDocument, createDefaultMosHistory } from "@/lib/marketplace-os/defaults";
import { MOS_DRAFT_KEY, MOS_HISTORY_KEY, MOS_LIVE_KEY } from "@/lib/marketplace-os/keys";
import type { MosDocument, MosHistoryEntry } from "@/lib/marketplace-os/types";

function normalizeDocument(doc: MosDocument): MosDocument {
  const defaults = createDefaultMosDocument(doc.label);
  return {
    ...defaults,
    ...doc,
    thresholds: { ...defaults.thresholds, ...doc.thresholds },
    rules: doc.rules?.length ? doc.rules : defaults.rules,
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveMosDocument(): Promise<MosDocument> {
  const doc = await getPlatformSetting<MosDocument>(MOS_LIVE_KEY, createDefaultMosDocument("Live"));
  return normalizeDocument(doc);
}

export async function getMosDraft(): Promise<MosDocument> {
  const live = await readLiveMosDocument();
  const draft = await getPlatformSetting<MosDocument>(MOS_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getMosHistory(): Promise<MosHistoryEntry[]> {
  return getPlatformSetting(MOS_HISTORY_KEY, createDefaultMosHistory());
}

export async function getMosSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([getMosDraft(), readLiveMosDocument(), getMosHistory()]);
  return { draft, live, history };
}

export async function saveMosDraft(document: MosDocument, actorId: string): Promise<MosDocument> {
  const next = normalizeDocument({
    ...document,
    label: "Draft",
    updatedAt: new Date().toISOString(),
  });

  await updatePlatformSetting({ actorId, key: MOS_DRAFT_KEY, value: next as unknown as Json });
  return next;
}

export async function publishMos(actorId: string): Promise<MosDocument> {
  const [draft, live, history] = await Promise.all([getMosDraft(), readLiveMosDocument(), getMosHistory()]);

  const historyEntry: MosHistoryEntry = {
    id: `mos-${Date.now()}`,
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
  });

  await Promise.all([
    updatePlatformSetting({ actorId, key: MOS_LIVE_KEY, value: published as unknown as Json }),
    updatePlatformSetting({
      actorId,
      key: MOS_HISTORY_KEY,
      value: [historyEntry, ...history].slice(0, 50) as unknown as Json,
    }),
  ]);

  return published;
}

export async function updateMosThresholds(
  thresholds: Partial<MosDocument["thresholds"]>,
  actorId: string,
): Promise<MosDocument> {
  const draft = await getMosDraft();
  return saveMosDraft({ ...draft, thresholds: { ...draft.thresholds, ...thresholds } }, actorId);
}
