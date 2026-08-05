/**
 * ROVEXO Product Integration — Upload & Storage Orchestration v1.0
 *
 * PRODUCT INTEGRATION · PHASE IV · COD SÂNGE
 *
 * Owns upload preparation + upload/storage orchestration for Sell.
 * Does NOT rewrite upload protocol · storage backend · API · database.
 *
 * Ownership:
 *   Product Integration → orchestration
 *   Upload Client → transport
 *   Draft Photo Storage → local persistence
 *   Upload Route → server persistence
 *   Pipeline → validation / normalization / metadata
 *   Multi Camera Session → session lifecycle
 */

import type { SellPhoto } from "@/features/sell/types";
import {
  clearDraftPhotos,
  saveDraftPhotos,
} from "@/lib/sell/draft-photo-storage";
import {
  createListingThumbnail,
  compressListingImage,
} from "@/lib/storage/client-images";
import {
  deleteListingImage as deleteListingImageTransport,
  uploadPreparedListingImage,
  type UploadedImageResult,
} from "@/lib/listings/upload-client";

export const PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_IV_V1 = {
  version: "1.0",
  id: "photo-system-product-integration-phase-iv-upload-storage-v1",
  phase: "PRODUCT_INTEGRATION_IV_UPLOAD_STORAGE",
  status: "IMPLEMENTATION",
  scope: "UPLOAD_STORAGE_ORCHESTRATION_ONLY",
  parentPhase: "PRODUCT_INTEGRATION_III_CAMERA_GALLERY",
  parentStatus: "IMPLEMENTATION",
  certifiedLogicUntouchable: true,
  libMediaModificationsForbidden: true,
  newUploadEngineForbidden: true,
  newStorageEngineForbidden: true,
  uploadProtocolRewriteForbidden: true,
  storageBackendRewriteForbidden: true,
  apiRedesignForbidden: true,
  databaseChangesForbidden: true,
  uiRedesignForbidden: true,
  newPhotoLogicForbidden: true,
  canonicalFlow: [
    "CAMERA_OR_GALLERY",
    "PRODUCT_INTEGRATION",
    "SMART_MULTI_CAMERA_SESSION",
    "SMART_MOBILE_IMAGE_PIPELINE",
    "DRAFT",
    "UPLOAD_PREPARATION",
    "UPLOAD_CLIENT",
    "STORAGE",
    "PUBLISH",
  ] as const,
  verifiedSurfaces: [
    "upload_client",
    "upload_route",
    "storage_client",
    "draft_storage",
    "publish_preparation",
    "listing_publish",
    "listing_edit_publish",
  ] as const,
} as const;

/** SELL-107 — upload retry backoff (owned by Product Integration orchestration). Phase A3: faster recover. */
export const SELL_UPLOAD_RETRY_DELAYS_MS = [500, 1500, 3000] as const;

export type PreparedSellListingUpload = {
  file: File;
  thumbnail: File;
};

export type UploadSellListingPhotoInput = {
  file: File;
  productId?: string;
  sessionId?: string;
  onProgress?: (progress: number) => void;
  /**
   * When true (default), skip full-image re-compression — Pipeline/intake already prepared the file.
   * Thumbnail is still created for the upload protocol (route requires thumbnail).
   */
  alreadyPipelinePrepared?: boolean;
};

export type DeleteSellListingPhotoInput = {
  storagePath: string;
  thumbnailStoragePath?: string;
};

/**
 * Upload preparation — Product Integration ownership.
 * Eliminates duplicate full-image compress when intake already prepared the file.
 */
export async function prepareSellListingUpload(
  file: File,
  options?: { alreadyPipelinePrepared?: boolean },
): Promise<PreparedSellListingUpload> {
  const alreadyPrepared = options?.alreadyPipelinePrepared ?? true;

  if (alreadyPrepared) {
    /* Intake already compressed — thumbnail only, never recompress the full file. */
    const thumbnail = await createListingThumbnail(file);
    return { file, thumbnail };
  }

  const compressed = await compressListingImage(file);
  const thumbnail = await createListingThumbnail(compressed);
  return { file: compressed, thumbnail };
}

/**
 * Canonical Sell upload orchestration → Upload Client transport only.
 */
export async function uploadSellListingPhoto(
  input: UploadSellListingPhotoInput,
): Promise<UploadedImageResult> {
  const prepared = await prepareSellListingUpload(input.file, {
    alreadyPipelinePrepared: input.alreadyPipelinePrepared ?? true,
  });

  return uploadPreparedListingImage({
    file: prepared.file,
    thumbnail: prepared.thumbnail,
    productId: input.productId,
    sessionId: input.sessionId,
    onProgress: input.onProgress,
    maxRetries: SELL_UPLOAD_RETRY_DELAYS_MS.length,
    retryDelaysMs: [...SELL_UPLOAD_RETRY_DELAYS_MS],
  });
}

/** Canonical Sell delete orchestration → Upload Client DELETE transport. */
export async function deleteSellListingPhoto(
  input: DeleteSellListingPhotoInput,
): Promise<void> {
  await deleteListingImageTransport(input);
}

/** Draft storage orchestration — persistence remains draft-photo-storage. */
export async function loadSellDraftPhotosViaProductIntegration(): Promise<SellPhoto[]> {
  // R1.3: restore path only — scrub stale/foreign storagePath before Sell remounts draft.
  const { loadSanitizedDraftPhotos } = await import("@/lib/sell/draft-restore-sanitize-v1");
  return loadSanitizedDraftPhotos();
}

export async function saveSellDraftPhotosViaProductIntegration(
  photos: SellPhoto[],
): Promise<void> {
  await saveDraftPhotos(photos);
}

export async function clearSellDraftPhotosViaProductIntegration(): Promise<void> {
  await clearDraftPhotos();
}

export type { UploadedImageResult };
