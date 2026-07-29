/**
 * ROVEXO Product Integration — Sell Photo Canonical Intake v1.0
 *
 * PRODUCT INTEGRATION · PHASE II · COD SÂNGE
 *
 * Canonical Sell photo path:
 *   Gallery/Camera file → Product Integration → Smart Multi Camera Session
 *   → Smart Mobile Image Pipeline → Draft-ready output
 *
 * Integration ONLY — reuses certified engines · no new photo logic · no UI redesign.
 * Upload/storage client preparation is orchestrated here so Sell never bypasses
 * Product Integration (compress/thumbnail remain existing helpers, not Sell-owned).
 */

import {
  createProductPhotoSystem,
  type ProductPhotoSystem,
} from "@/lib/product-integration/photo-system-integration-foundation-v1";
import {
  projectMetadataRecordToSellDraft,
  type SellDraftPhotoMetadata,
} from "@/lib/product-integration/sell-photo-metadata-adapter-v1";
import type { MetadataRecord } from "@/lib/media/smart-mobile-image-pipeline/metadata-types-v1";
import type {
  PipelineImageFormat,
  PipelineOrientation,
} from "@/lib/media/smart-mobile-image-pipeline/pipeline-types-v1";
import {
  compressListingImage,
  createListingThumbnail,
} from "@/lib/storage/client-images";
import { safeRandomUUID } from "@/lib/uuid";

export const PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_II_V1 = {
  version: "1.0",
  id: "photo-system-product-integration-phase-ii-sell-v1",
  phase: "PRODUCT_INTEGRATION_II_SELL_CANONICAL",
  status: "IMPLEMENTATION",
  scope: "SELL_PHOTO_INTEGRATION_ONLY",
  parentPhase: "PRODUCT_INTEGRATION_I_FOUNDATION",
  parentStatus: "CERTIFIED",
  certifiedLogicUntouchable: true,
  newPhotoLogicForbidden: true,
  uiRedesignForbidden: true,
  cameraImplementationForbidden: true,
  uploadImplementationForbidden: true,
  storageImplementationForbidden: true,
  metadataOwner: "SmartMobileImageMetadataEngine",
  canonicalFlow: [
    "USER",
    "GALLERY_OR_CAMERA",
    "PRODUCT_INTEGRATION",
    "SMART_MULTI_CAMERA_SESSION",
    "SMART_MOBILE_IMAGE_PIPELINE",
    "DRAFT_ENGINE",
    "PUBLISH_PREPARATION",
  ] as const,
} as const;

export type SellPhotoIntakePhoto = {
  id: string;
  file: File;
  previewUrl: string;
  uploaded: false;
};

export type SellPhotoIntakeSuccess = {
  ok: true;
  photo: SellPhotoIntakePhoto;
  draftMetadata: SellDraftPhotoMetadata;
  metadataRecord: MetadataRecord;
};

export type SellPhotoIntakeFailure = {
  ok: false;
  message: string;
};

export type SellPhotoIntakeResult = SellPhotoIntakeSuccess | SellPhotoIntakeFailure;

const CAPTURE_READY: ReadonlySet<string> = new Set([
  "CAPTURING",
  "REVIEWING",
  "READY",
]);

function fail(message: string): SellPhotoIntakeFailure {
  return { ok: false, message };
}

function resolvePipelineFormat(file: File): PipelineImageFormat | null {
  const mime = file.type.toLowerCase();
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpeg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  const name = file.name.toLowerCase();
  if (/\.jpe?g$/i.test(name)) return "jpeg";
  if (/\.png$/i.test(name)) return "png";
  if (/\.webp$/i.test(name)) return "webp";
  return null;
}

function extensionForFormat(format: PipelineImageFormat): string {
  if (format === "jpeg") return ".jpg";
  if (format === "png") return ".png";
  return ".webp";
}

async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (typeof Image === "undefined" || typeof URL === "undefined") return null;
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    return null;
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    image.src = url;
  });
}

async function contentFingerprint(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  const bytes = new Uint8Array(buffer);
  let hash = file.size >>> 0;
  const limit = Math.min(bytes.length, 256);
  for (let i = 0; i < limit; i += 1) {
    hash = (Math.imul(hash, 31) + bytes[i]!) >>> 0;
  }
  return `fp-${file.name}-${file.size}-${hash.toString(16)}`;
}

/**
 * Camera entry preparation — starts certified Multi Camera session for gallery/camera intake.
 * No hardware camera implementation.
 */
export function prepareProductPhotoCameraSession(
  system: ProductPhotoSystem,
): { ok: true } | { ok: false; message: string } {
  const session = system.cameraSession.sessionEngine;
  const status = session.getSnapshot().status;

  if (status === "IDLE") {
    const started = session.startSession();
    if (!started.ok) {
      return { ok: false, message: started.message };
    }
    const capturing = session.beginCapturing();
    if (!capturing.ok) {
      return { ok: false, message: capturing.message };
    }
    return { ok: true };
  }

  if (status === "STARTING") {
    const capturing = session.beginCapturing();
    if (!capturing.ok) {
      return { ok: false, message: capturing.message };
    }
    return { ok: true };
  }

  if (CAPTURE_READY.has(status)) {
    return { ok: true };
  }

  const cancelled = session.cancelSession();
  if (!cancelled.ok && session.getSnapshot().status !== "IDLE") {
    return { ok: false, message: "Photo session is not available." };
  }

  const started = session.startSession();
  if (!started.ok) {
    return { ok: false, message: started.message };
  }
  const capturing = session.beginCapturing();
  if (!capturing.ok) {
    return { ok: false, message: capturing.message };
  }
  return { ok: true };
}

/**
 * ONE product photo system factory for Sell host (singleton per SellProvider).
 */
export function createSellProductPhotoSystem(): ProductPhotoSystem {
  return createProductPhotoSystem();
}

/**
 * Canonical gallery/camera file intake for Sell draft.
 * Compression/thumbnail use existing storage helpers only as upload preparation
 * behind Product Integration — Sell must not call them directly.
 */
export async function intakeSellGalleryPhoto(
  system: ProductPhotoSystem,
  file: File,
  options?: {
    photoId?: string;
    dominantColour?: string | null;
    /** When replacing an existing draft photo id in session/collection. */
    replacePhotoId?: string;
  },
): Promise<SellPhotoIntakeResult> {
  const prepared = prepareProductPhotoCameraSession(system);
  if (!prepared.ok) {
    return fail(prepared.message);
  }

  let working = file;
  let previewSource = file;
  try {
    working = await compressListingImage(file);
    previewSource = await createListingThumbnail(working);
  } catch {
    working = file;
    previewSource = file;
  }

  const format = resolvePipelineFormat(working);
  if (!format) {
    return fail("Only JPEG, PNG, or WebP images are supported.");
  }

  const dimensions = await readImageDimensions(working);
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1) {
    return fail("Unable to read photo dimensions.");
  }

  const photoId = options?.photoId?.trim() || safeRandomUUID();
  const fingerprint = await contentFingerprint(working);
  const localUri = URL.createObjectURL(working);
  const at = Date.now();
  const orientation: PipelineOrientation = 1;

  const session = system.cameraSession.sessionEngine;
  const collection = system.cameraSession.photoCollection;

  if (options?.replacePhotoId) {
    const replaceId = options.replacePhotoId;
    session.deletePhoto(replaceId);
    collection.removePhoto(replaceId);
  }

  const captured = session.capturePhoto({
    photoId,
    localUri,
    width: dimensions.width,
    height: dimensions.height,
    rotation: 0,
    timestamp: at,
  });
  if (!captured.ok) {
    URL.revokeObjectURL(localUri);
    return fail(captured.message);
  }

  const collected = collection.addPhoto({
    photoId,
    localUri,
    width: dimensions.width,
    height: dimensions.height,
    rotation: 0,
    timestamp: at,
  });
  if (!collected.ok) {
    session.deletePhoto(photoId);
    URL.revokeObjectURL(localUri);
    return fail(collected.message);
  }

  const bytes = new Uint8Array(await working.arrayBuffer());
  const pipelineResult = system.pipelineComposition.process({
    imageId: photoId,
    format,
    mimeType: working.type || `image/${format === "jpeg" ? "jpeg" : format}`,
    extension: extensionForFormat(format),
    width: dimensions.width,
    height: dimensions.height,
    orientation,
    byteLength: working.size,
    contentFingerprint: fingerprint,
    filename: working.name || `photo${extensionForFormat(format)}`,
    localUri,
    bytes,
    timestamp: at,
    at,
  });

  if (!pipelineResult.ok) {
    session.deletePhoto(photoId);
    collection.removePhoto(photoId);
    URL.revokeObjectURL(localUri);
    return fail(pipelineResult.message);
  }

  const metadataRecord = pipelineResult.state.metadata;
  if (!metadataRecord) {
    session.deletePhoto(photoId);
    collection.removePhoto(photoId);
    URL.revokeObjectURL(localUri);
    return fail(
      pipelineResult.state.failureReason ?? "Photo pipeline rejected the image.",
    );
  }
  const draftMetadata = projectMetadataRecordToSellDraft(
    metadataRecord,
    options?.dominantColour ?? null,
  );

  return {
    ok: true,
    photo: {
      id: photoId,
      file: working,
      previewUrl: URL.createObjectURL(previewSource),
      uploaded: false,
    },
    draftMetadata,
    metadataRecord,
  };
}

/** Keep certified session/collection aligned when Sell removes a draft photo. */
export function removeSellPhotoFromProductSystem(
  system: ProductPhotoSystem,
  photoId: string,
): void {
  system.cameraSession.sessionEngine.deletePhoto(photoId);
  system.cameraSession.photoCollection.removePhoto(photoId);
}

/** Keep certified session/collection aligned when Sell reorders draft photos. */
export function reorderSellPhotosInProductSystem(
  system: ProductPhotoSystem,
  fromIndex: number,
  toIndex: number,
): void {
  system.cameraSession.sessionEngine.reorderPhotos(fromIndex, toIndex);
  system.cameraSession.photoCollection.reorderPhotos(fromIndex, toIndex);
}

/** Reset product photo system for a fresh Sell listing session. */
export function resetSellProductPhotoSystem(
  system: ProductPhotoSystem,
): ProductPhotoSystem {
  system.cameraSession.sessionEngine.cancelSession();
  system.cameraSession.photoCollection.clear();
  system.pipelineComposition.reset(Date.now());
  return system;
}
