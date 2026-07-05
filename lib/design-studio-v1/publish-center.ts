import { getPlatformVisualDraft, getPlatformVisualHistory } from "@/lib/platform-visual/reader";
import type { PublishCenterState } from "@/lib/design-studio-v1/types";
import { readLiveBundle } from "@/lib/platform-visual/theme-engine";

export async function getPublishCenterState(): Promise<PublishCenterState> {
  const [draft, live, history] = await Promise.all([
    getPlatformVisualDraft(),
    readLiveBundle(),
    getPlatformVisualHistory(),
  ]);

  const pendingChanges =
    draft.updatedAt !== live.updatedAt || draft.version !== live.version || draft.label !== live.label ? 1 : 0;

  return {
    draftLabel: draft.label,
    liveLabel: live.label,
    draftUpdatedAt: draft.updatedAt,
    liveUpdatedAt: live.updatedAt,
    pendingChanges,
    canPublish: pendingChanges > 0 || draft.label === "Draft",
    canRollback: history.some((entry) => entry.rollbackAvailable),
    historyCount: history.length,
  };
}
