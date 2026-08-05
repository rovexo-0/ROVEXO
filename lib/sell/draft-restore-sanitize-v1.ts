/**
 * R1.3 — Sell draft restore sanitization (client IndexedDB only).
 *
 * Mirrors repository ownership gate (`storagePath.startsWith(`${sellerId}/`)`)
 * without changing repository / upload / storage rules.
 * Invalid restored remote image metadata is stripped or discarded so
 * POST /api/sell/draft never receives a foreign or malformed storagePath.
 */

import type { SellPhoto } from "@/features/sell/types";
import {
  loadDraftPhotos,
  saveDraftPhotos,
} from "@/lib/sell/draft-photo-storage";
import { clearDatabaseDraftId } from "@/lib/sell/draft-storage";

export const DRAFT_RESTORE_SANITIZE_V1 = {
  version: "1.0" as const,
  id: "sell-draft-restore-sanitize-v1",
  scope: "INDEXEDDB_DRAFT_RESTORE_ONLY",
} as const;

export type DraftRestoreSanitizeResult = {
  photos: SellPhoto[];
  didMutate: boolean;
  discardedCount: number;
  invalidatedUploadCount: number;
};

/**
 * Same ownership predicate as moveImageToProductFolder prefix check.
 * Also rejects public URLs and absolute paths (never valid object keys).
 */
export function isOwnedListingStoragePath(
  storagePath: string | undefined,
  sellerId: string | null | undefined,
): boolean {
  const id = typeof sellerId === "string" ? sellerId.trim() : "";
  const path = typeof storagePath === "string" ? storagePath.trim() : "";
  if (!id || !path) return false;
  if (path.includes("://") || path.startsWith("//") || path.startsWith("/")) return false;
  return path.startsWith(`${id}/`);
}

function stripRemoteUploadMetadata(photo: SellPhoto): SellPhoto {
  return {
    ...photo,
    uploaded: false,
    uploading: false,
    uploadError: undefined,
    url: undefined,
    thumbnailUrl: undefined,
    storagePath: undefined,
    thumbnailStoragePath: undefined,
    // Keep existingImageId only when path was owned — cleared by caller for stale.
    existingImageId: undefined,
  };
}

/**
 * Sanitize photos restored from IndexedDB / local draft recovery.
 *
 * - Owned storagePath → keep
 * - Stale/foreign/malformed storagePath + local file → clear upload metadata (re-upload later)
 * - Stale/foreign/malformed storagePath + no file → discard (cannot recover)
 * - No sellerId available → treat any remote upload claim as unsafe (strip or discard)
 */
export function sanitizeRestoredSellPhotos(
  photos: readonly SellPhoto[],
  sellerId: string | null | undefined,
): DraftRestoreSanitizeResult {
  let discardedCount = 0;
  let invalidatedUploadCount = 0;
  const next: SellPhoto[] = [];

  for (const photo of photos) {
    const claimsRemoteUpload = Boolean(
      photo.uploaded || photo.storagePath || photo.thumbnailStoragePath || photo.existingImageId,
    );

    if (!claimsRemoteUpload) {
      next.push(photo);
      continue;
    }

    const pathOwned = isOwnedListingStoragePath(photo.storagePath, sellerId);
    if (pathOwned) {
      next.push(photo);
      continue;
    }

    invalidatedUploadCount += 1;

    if (photo.file) {
      next.push(stripRemoteUploadMetadata(photo));
      continue;
    }

    discardedCount += 1;
  }

  const didMutate =
    discardedCount > 0 ||
    invalidatedUploadCount > 0 ||
    next.length !== photos.length;

  return {
    photos: next,
    didMutate,
    discardedCount,
    invalidatedUploadCount,
  };
}

/** Current auth user id for ownership checks during draft restore (browser only). */
export async function resolveDraftRestoreSellerId(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const { tryCreateClient } = await import("@/lib/supabase/client");
    const client = tryCreateClient();
    if (!client) return null;
    const { data } = await client.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Load IndexedDB draft photos and scrub stale/foreign storagePath claims.
 * Re-persists cleaned photos and clears stale database draft id when uploads were invalidated.
 */
export async function loadSanitizedDraftPhotos(): Promise<SellPhoto[]> {
  const raw = await loadDraftPhotos();
  const sellerId = await resolveDraftRestoreSellerId();
  const result = sanitizeRestoredSellPhotos(raw, sellerId);

  if (!result.didMutate) return raw;

  await saveDraftPhotos(result.photos);
  if (result.invalidatedUploadCount > 0 || result.discardedCount > 0) {
    clearDatabaseDraftId();
  }
  return result.photos;
}
