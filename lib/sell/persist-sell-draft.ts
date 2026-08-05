import type { MutableRefObject } from "react";
import type { SellListingDraft } from "@/features/sell/types";
import { saveSellDraftPhotosViaProductIntegration } from "@/lib/product-integration/upload-storage-orchestration-v1";
import {
  canAutosaveDatabaseDraft,
  canPersistDatabaseDraft,
  DRAFT_DATABASE_SSOT_V1,
  type DatabaseDraftPersistResult,
} from "@/lib/sell/draft-database-ssot-v1";
import {
  clearDatabaseDraftId,
  loadDatabaseDraftId,
  saveDatabaseDraftId,
  saveSellDraft,
  saveUploadSessionId,
} from "@/lib/sell/draft-storage";
import { touchDraftSavedAt } from "@/lib/sell/draft-engine";
import { resolveEffectiveSellDraft } from "@/lib/sell/resolve-effective-draft";
import { sellInputDiag } from "@/lib/sell/sell-input-diagnostics";
import { sellProfilePersist } from "@/lib/sell/sell-profiler";

type PersistableDraftRefs = {
  draftRef: MutableRefObject<SellListingDraft>;
  pendingTitleRef: MutableRefObject<string>;
  pendingDescriptionRef: MutableRefObject<string>;
  uploadSessionId: string;
};

/** Post-publish / intentional reset shell — must not rewrite storage or POST. */
function isPostPublishEmptyShell(draft: SellListingDraft): boolean {
  return (
    draft.photos.length === 0 &&
    draft.title.trim().length === 0 &&
    draft.description.trim().length === 0 &&
    draft.categoryPath == null &&
    draft.price.trim().length === 0
  );
}

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
    sellProfilePersist("textSync");
    const draft = resolvePersistableDraft(refs);
    // P10.1 — do not re-seed localStorage with an intentional empty shell.
    if (isPostPublishEmptyShell(draft)) {
      sellInputDiag("persist.textSync.skip_empty");
      return false;
    }
    saveSellDraft(draft);
    touchDraftSavedAt();
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

export async function persistDatabaseDraftFromSellDraft(
  draft: SellListingDraft,
  options?: { draftId?: string | null },
): Promise<DatabaseDraftPersistResult> {
  // Publish-failure recovery still uses photo-only gate (API pads incomplete fields).
  // Autosave callers must pass canAutosaveDatabaseDraft first (P10.1).
  if (!canPersistDatabaseDraft(draft)) {
    return { ok: false, error: "DRAFT_PHOTO_REQUIRED" };
  }

  const draftId = options?.draftId?.trim() || loadDatabaseDraftId();
  const uploaded = draft.photos.filter(
    (photo) => photo.uploaded && photo.url && photo.storagePath,
  );

  try {
    const response = await fetch(DRAFT_DATABASE_SSOT_V1.apiPath, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draftId: draftId || undefined,
        title: draft.title,
        description: draft.description,
        brand: draft.brand,
        color: draft.color,
        size: draft.size,
        condition: draft.condition,
        price: draft.price,
        acceptOffers: draft.acceptOffers,
        freeDelivery: draft.freeDelivery,
        shippingMethod: draft.shippingMethod,
        parcelSize: draft.parcelSize,
        stock: draft.stock,
        categoryPath: draft.categoryPath
          ? {
              categorySlug: draft.categoryPath.categorySlug,
              subcategorySlug: draft.categoryPath.subcategorySlug,
              childCategorySlug: draft.categoryPath.childCategorySlug,
              categorySlugs: draft.categoryPath.segments.map((segment) => segment.slug),
              pathLabel: draft.categoryPath.pathLabel,
              segments: draft.categoryPath.segments,
            }
          : null,
        images: uploaded.map((photo, index) => ({
          url: photo.url!,
          thumbnailUrl: photo.thumbnailUrl ?? photo.url!,
          storagePath: photo.storagePath!,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      }),
    });

    const body = (await response.json().catch(() => null)) as {
      ok?: boolean;
      draftId?: string;
      error?: string;
      code?: string;
    } | null;

    if (!response.ok || !body?.ok || !body.draftId) {
      // Stale draft id → clear and create a fresh draft row once.
      if (response.status === 404 && draftId) {
        clearDatabaseDraftId();
        return persistDatabaseDraftFromSellDraft(draft, { draftId: null });
      }
      return {
        ok: false,
        error: body?.code || body?.error || `HTTP_${response.status}`,
      };
    }

    saveDatabaseDraftId(body.draftId);
    return { ok: true, draftId: body.draftId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "DRAFT_SAVE_FAILED",
    };
  }
}

export async function persistSellDraftSnapshot(
  refs: PersistableDraftRefs,
  options?: { databaseDraftId?: string | null; persistDatabase?: boolean },
): Promise<{ databaseDraftSaved: boolean; draftId?: string }> {
  sellProfilePersist("snapshot");
  sellInputDiag("persist.snapshot.start");
  const draft = resolveEffectiveSellDraft(refs.draftRef.current, {
    title: refs.pendingTitleRef.current,
    description: refs.pendingDescriptionRef.current,
  });

  // P10.1 — post-publish / intentional empty reset: no local rewrite, no POST.
  if (isPostPublishEmptyShell(draft)) {
    sellInputDiag("persist.snapshot.skip_empty");
    return { databaseDraftSaved: false };
  }

  persistSellDraftTextSync(refs);
  try {
    await saveSellDraftPhotosViaProductIntegration(draft.photos);
  } catch (error) {
    sellInputDiag("persist.snapshot.error", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }

  if (options?.persistDatabase === false) {
    sellInputDiag("persist.snapshot.done");
    return { databaseDraftSaved: false };
  }

  if (!canAutosaveDatabaseDraft(draft)) {
    sellInputDiag("persist.snapshot.skip_database", {
      photos: draft.photos.length,
      price: draft.price,
    });
    return { databaseDraftSaved: false };
  }

  const dbResult = await persistDatabaseDraftFromSellDraft(draft, {
    draftId: options?.databaseDraftId,
  });
  sellInputDiag("persist.snapshot.done", {
    databaseDraftSaved: dbResult.ok,
    draftId: dbResult.ok ? dbResult.draftId : undefined,
  });
  return dbResult.ok
    ? { databaseDraftSaved: true, draftId: dbResult.draftId }
    : { databaseDraftSaved: false };
}
