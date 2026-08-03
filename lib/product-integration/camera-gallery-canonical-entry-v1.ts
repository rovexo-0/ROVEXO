/**
 * ROVEXO Product Integration — Camera & Gallery Canonical Entry v1.0
 *
 * PRODUCT INTEGRATION · PHASE III · COD SÂNGE
 *
 * ONE canonical photo entry for Camera and Gallery.
 * Integration ONLY — no hardware camera · no UI redesign · no lib/media changes.
 *
 * Flow:
 *   Camera / Gallery → Product Integration → Smart Multi Camera Session
 *   → Smart Mobile Image Pipeline → Draft → Publish Preparation
 */

import type { SellPhoto } from "@/features/sell/types";
import {
  acquireSellPhotoSession,
  cancelSellPhotoSession,
  resumeSellPhotoSession,
  resetSellPhotoSession,
  assertSingleActiveSellPhotoSession,
} from "@/lib/product-integration/sell-photo-session-host-v1";
import {
  intakeSellGalleryPhoto,
  prepareProductPhotoCameraSession,
  removeSellPhotoFromProductSystem,
  reorderSellPhotosInProductSystem,
  type SellPhotoIntakeResult,
} from "@/lib/product-integration/sell-photo-intake-v1";
import type { ProductPhotoSystem } from "@/lib/product-integration/photo-system-integration-foundation-v1";

export const PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_III_V1 = {
  version: "1.0",
  id: "photo-system-product-integration-phase-iii-camera-gallery-v1",
  phase: "PRODUCT_INTEGRATION_III_CAMERA_GALLERY",
  status: "IMPLEMENTATION",
  scope: "CAMERA_GALLERY_ENTRY_INTEGRATION_ONLY",
  parentPhase: "PRODUCT_INTEGRATION_II_SELL_CANONICAL",
  parentStatus: "IMPLEMENTATION",
  certifiedLogicUntouchable: true,
  libMediaModificationsForbidden: true,
  newPhotoLogicForbidden: true,
  uiRedesignForbidden: true,
  cameraImplementationForbidden: true,
  uploadImplementationForbidden: true,
  storageImplementationForbidden: true,
  metadataOwnershipFrozen: true,
  canonicalFlow: [
    "CAMERA_OR_GALLERY",
    "PRODUCT_INTEGRATION",
    "SMART_MULTI_CAMERA_SESSION",
    "SMART_MOBILE_IMAGE_PIPELINE",
    "DRAFT",
    "PUBLISH_PREPARATION",
  ] as const,
  verifiedEntryPoints: [
    "sell_camera",
    "gallery_picker",
    "add_photo",
    "replace_photo",
    "edit_listing_photo",
  ] as const,
} as const;

/** Canonical entry sources — Product Integration owns routing; Sell does not own camera/gallery. */
export type SellPhotoEntrySource =
  | "sell_camera"
  | "gallery_picker"
  | "add_photo"
  | "replace_photo"
  | "edit_listing_photo"
  | "draft_restore";

export const SELL_PHOTO_CANONICAL_ENTRIES = {
  sellCamera: {
    source: "sell_camera" as const,
    routes: ["/sell/camera"] as const,
    convergesTo: "/sell",
    ownership: "PRODUCT_INTEGRATION",
    note: "Stub redirects to Sell host; session prepared via Product Integration.",
  },
  galleryPicker: {
    source: "gallery_picker" as const,
    host: "features/sell/ui/SellPhotoFileInput.tsx",
    ownership: "PRODUCT_INTEGRATION",
  },
  addPhoto: {
    source: "add_photo" as const,
    host: "features/sell/ui/SellPhotoRail.tsx",
    ownership: "PRODUCT_INTEGRATION",
  },
  replacePhoto: {
    source: "replace_photo" as const,
    host: "features/sell/ui/SellPhotoRail.tsx",
    ownership: "PRODUCT_INTEGRATION",
  },
  editListingPhoto: {
    source: "edit_listing_photo" as const,
    host: "app/(platform)/seller/listings/[id]/edit/page.tsx",
    ownership: "PRODUCT_INTEGRATION_VIA_SELL",
  },
} as const;

export type IntakeSellPhotoFromEntryInput = {
  ownerId: string;
  source: SellPhotoEntrySource;
  file: File;
  photoId?: string;
  replacePhotoId?: string;
  dominantColour?: string | null;
};

/**
 * Camera entry preparation — no hardware.
 * Sell Camera stub and Sell host both call this through Product Integration.
 */
export function prepareSellCameraEntry(
  ownerId: string,
): { ok: true; system: ProductPhotoSystem } | { ok: false; message: string } {
  return resumeSellPhotoSession(ownerId);
}

/**
 * Gallery entry preparation — same certified session path as camera.
 */
export function prepareSellGalleryEntry(
  ownerId: string,
): { ok: true; system: ProductPhotoSystem } | { ok: false; message: string } {
  return resumeSellPhotoSession(ownerId);
}

/**
 * ONE canonical intake for every Camera / Gallery / Replace / Add / Edit entry.
 */
export async function intakeSellPhotoFromCanonicalEntry(
  input: IntakeSellPhotoFromEntryInput,
): Promise<SellPhotoIntakeResult> {
  const prepared =
    input.source === "sell_camera"
      ? prepareSellCameraEntry(input.ownerId)
      : prepareSellGalleryEntry(input.ownerId);

  if (!prepared.ok) {
    return { ok: false, message: prepared.message };
  }

  const replacePhotoId =
    input.replacePhotoId ??
    (input.source === "replace_photo" || input.source === "edit_listing_photo"
      ? input.photoId
      : undefined);

  return intakeSellGalleryPhoto(prepared.system, input.file, {
    photoId: input.photoId,
    replacePhotoId,
    dominantColour: input.dominantColour,
  });
}

async function readRemoteOrBlobDimensions(
  uri: string,
): Promise<{ width: number; height: number } | null> {
  if (typeof Image === "undefined") return null;
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => resolve(null);
    image.src = uri;
  });
}

/**
 * Draft / edit restore — re-open ONE session and register photos.
 * File-backed photos re-enter Session → Pipeline.
 * URL-only photos register into Session/Collection (already published; no upload rewrite).
 */
export async function resumeSellDraftPhotosIntoSession(
  ownerId: string,
  photos: readonly SellPhoto[],
): Promise<{ ok: true; resumed: number; failed: number } | { ok: false; message: string }> {
  const prepared = resumeSellPhotoSession(ownerId);
  if (!prepared.ok) {
    return { ok: false, message: prepared.message };
  }

  const system = prepared.system;
  let resumed = 0;
  let failed = 0;

  for (const photo of photos) {
    if (photo.file) {
      const result = await intakeSellGalleryPhoto(system, photo.file, {
        photoId: photo.id,
        replacePhotoId: system.cameraSession.sessionEngine
          .getSnapshot()
          .photos.some((item) => item.photoId === photo.id)
          ? photo.id
          : undefined,
      });
      if (result.ok) resumed += 1;
      else failed += 1;
      continue;
    }

    const localUri = photo.previewUrl || photo.url || photo.thumbnailUrl || "";
    if (!localUri) {
      failed += 1;
      continue;
    }

    const dimensions = await readRemoteOrBlobDimensions(localUri);
    if (!dimensions || dimensions.width < 1 || dimensions.height < 1) {
      failed += 1;
      continue;
    }

    const at = Date.now();
    const session = system.cameraSession.sessionEngine;
    const collection = system.cameraSession.photoCollection;

    if (session.getSnapshot().photos.some((item) => item.photoId === photo.id)) {
      session.deletePhoto(photo.id);
      collection.removePhoto(photo.id);
    }

    const captured = session.capturePhoto({
      photoId: photo.id,
      localUri,
      width: dimensions.width,
      height: dimensions.height,
      rotation: 0,
      timestamp: at,
    });
    if (!captured.ok) {
      failed += 1;
      continue;
    }

    const collected = collection.addPhoto({
      photoId: photo.id,
      localUri,
      width: dimensions.width,
      height: dimensions.height,
      rotation: 0,
      timestamp: at,
    });
    if (!collected.ok) {
      session.deletePhoto(photo.id);
      failed += 1;
      continue;
    }

    resumed += 1;
  }

  return { ok: true, resumed, failed };
}

export function removeSellPhotoViaCanonicalEntry(ownerId: string, photoId: string): void {
  const system = acquireSellPhotoSession(ownerId);
  removeSellPhotoFromProductSystem(system, photoId);
}

export function reorderSellPhotosViaCanonicalEntry(
  ownerId: string,
  fromIndex: number,
  toIndex: number,
): void {
  const system = acquireSellPhotoSession(ownerId);
  reorderSellPhotosInProductSystem(system, fromIndex, toIndex);
}

export {
  cancelSellPhotoSession,
  resetSellPhotoSession,
  assertSingleActiveSellPhotoSession,
  prepareProductPhotoCameraSession,
};
