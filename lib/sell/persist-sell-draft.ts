import type { MutableRefObject } from "react";
import type { SellListingDraft } from "@/features/sell/types";
import { saveDraftPhotos } from "@/lib/sell/draft-photo-storage";
import { saveSellDraft, saveUploadSessionId } from "@/lib/sell/draft-storage";
import { resolveEffectiveSellDraft } from "@/lib/sell/resolve-effective-draft";
import { sellInputDiag } from "@/lib/sell/sell-input-diagnostics";

type PersistableDraftRefs = {
  draftRef: MutableRefObject<SellListingDraft>;
  pendingTitleRef: MutableRefObject<string>;
  pendingDescriptionRef: MutableRefObject<string>;
  uploadSessionId: string;
};

/** Read pending keystrokes from refs — never flush/sync to React state during autosave. */
function resolvePersistableDraft(refs: PersistableDraftRefs): SellListingDraft {
  const draft = resolveEffectiveSellDraft(refs.draftRef.current, {
    title: refs.pendingTitleRef.current,
    description: refs.pendingDescriptionRef.current,
  });
  sellInputDiag("persist.resolve", {
    titleLen: refs.pendingTitleRef.current.length,
    descriptionLen: refs.pendingDescriptionRef.current.length,
    draftDescriptionLen: refs.draftRef.current.description.length,
  });
  return draft;
}

/** Synchronous text draft write — survives iOS pagehide / background. */
export function persistSellDraftTextSync(refs: PersistableDraftRefs): boolean {
  try {
    const draft = resolvePersistableDraft(refs);
    saveSellDraft(draft);
    if (refs.uploadSessionId) {
      saveUploadSessionId(refs.uploadSessionId);
    }
    sellInputDiag("persist.textSync.done");
    return true;
  } catch (error) {
    sellInputDiag("persist.textSync.error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return false;
  }
}

export async function persistSellDraftSnapshot(refs: PersistableDraftRefs): Promise<void> {
  sellInputDiag("persist.snapshot.start");
  persistSellDraftTextSync(refs);
  const draft = resolveEffectiveSellDraft(refs.draftRef.current, {
    title: refs.pendingTitleRef.current,
    description: refs.pendingDescriptionRef.current,
  });
  await saveDraftPhotos(draft.photos);
  sellInputDiag("persist.snapshot.done");
}
