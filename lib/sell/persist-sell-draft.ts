import type { MutableRefObject } from "react";
import type { SellListingDraft } from "@/features/sell/types";
import { saveDraftPhotos } from "@/lib/sell/draft-photo-storage";
import { saveSellDraft, saveUploadSessionId } from "@/lib/sell/draft-storage";
import { resolveEffectiveSellDraft } from "@/lib/sell/resolve-effective-draft";

type PersistableDraftRefs = {
  draftRef: MutableRefObject<SellListingDraft>;
  pendingTitleRef: MutableRefObject<string>;
  pendingDescriptionRef: MutableRefObject<string>;
  uploadSessionId: string;
  flushPendingText: () => void;
};

function resolvePersistableDraft(refs: PersistableDraftRefs): SellListingDraft {
  refs.flushPendingText();
  return resolveEffectiveSellDraft(refs.draftRef.current, {
    title: refs.pendingTitleRef.current,
    description: refs.pendingDescriptionRef.current,
  });
}

/** Synchronous text draft write — survives iOS pagehide / background. */
export function persistSellDraftTextSync(refs: PersistableDraftRefs): boolean {
  try {
    const draft = resolvePersistableDraft(refs);
    saveSellDraft(draft);
    if (refs.uploadSessionId) {
      saveUploadSessionId(refs.uploadSessionId);
    }
    return true;
  } catch {
    return false;
  }
}

export async function persistSellDraftSnapshot(refs: PersistableDraftRefs): Promise<void> {
  persistSellDraftTextSync(refs);
  const draft = resolveEffectiveSellDraft(refs.draftRef.current, {
    title: refs.pendingTitleRef.current,
    description: refs.pendingDescriptionRef.current,
  });
  await saveDraftPhotos(draft.photos);
}
