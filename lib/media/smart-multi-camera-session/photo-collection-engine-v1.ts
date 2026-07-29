/**
 * ROVEXO Smart Multi Camera Session — Photo Collection Engine v1.0
 *
 * PHASE IV · COD SÂNGE · ONE implementation · Logic only
 *
 * Manages in-memory photo references. Does NOT capture, render, upload,
 * or access hardware / storage / network.
 */

import { safeRandomUUID } from "@/lib/uuid";
import { SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS } from "@/lib/media/smart-multi-camera-session/session-types-v1";
import type {
  AddCollectionPhotoInput,
  CollectionPhoto,
  PhotoCollectionErrorCode,
  PhotoCollectionEvent,
  PhotoCollectionResult,
  PhotoCollectionState,
  ReplaceCollectionPhotoInput,
} from "@/lib/media/smart-multi-camera-session/photo-collection-types-v1";

export const SMART_MULTI_CAMERA_PHOTO_COLLECTION_ENGINE_V1 = {
  version: "1.0",
  id: "smart-multi-camera-photo-collection-engine-v1",
  phase: "IV_PHOTO_COLLECTION_ENGINE",
  status: "CERTIFIED",
  maxPhotos: SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS,
  ssotDomains: ["photoCollection", "coverPhoto", "photoOrdering"] as const,
  hardwareAccessForbidden: true,
  uiForbidden: true,
  uploadForbidden: true,
} as const;

type CollectionListener = (event: PhotoCollectionEvent) => void;

const ERROR_MESSAGE: Record<PhotoCollectionErrorCode, string> = {
  CAPACITY_REACHED: "Photo collection capacity reached.",
  DUPLICATE_PHOTO_ID: "Photo id already exists in the collection.",
  PHOTO_NOT_FOUND: "Photo not found in the collection.",
  INVALID_PHOTO: "Photo payload is invalid.",
  INVALID_INDEX: "Photo index is invalid.",
  INVALID_ORDER: "Photo order is invalid.",
  MISSING_COVER: "Cover is missing while collection is not empty.",
  COLLECTION_INVALID: "Photo collection failed validation.",
};

function fail(code: PhotoCollectionErrorCode): PhotoCollectionResult {
  return { ok: false, code, message: ERROR_MESSAGE[code] };
}

function succeed(
  state: PhotoCollectionState,
  events: readonly PhotoCollectionEvent[],
): PhotoCollectionResult {
  return { ok: true, state, events };
}

function now(): number {
  return Date.now();
}

function createEmptyState(at = 0): PhotoCollectionState {
  return {
    photos: [],
    coverPhotoId: null,
    isValid: true,
    updatedAt: at,
  };
}

/** Single pass — contiguous order + first photo is cover (reindex ≡ applyCover). */
function applyCover(photos: readonly CollectionPhoto[]): {
  photos: CollectionPhoto[];
  coverPhotoId: string | null;
} {
  if (photos.length === 0) {
    return { photos: [], coverPhotoId: null };
  }
  return {
    photos: photos.map((photo, index) => ({
      ...photo,
      order: index,
      isCover: index === 0,
    })),
    coverPhotoId: photos[0]!.photoId,
  };
}

function inspectCollection(photos: readonly CollectionPhoto[]): {
  valid: boolean;
  code: PhotoCollectionErrorCode | null;
  coverPhotoId: string | null;
} {
  if (photos.length > SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS) {
    return { valid: false, code: "CAPACITY_REACHED", coverPhotoId: null };
  }

  const ids = new Set<string>();
  for (const photo of photos) {
    if (!photo.photoId || ids.has(photo.photoId)) {
      return { valid: false, code: "DUPLICATE_PHOTO_ID", coverPhotoId: null };
    }
    ids.add(photo.photoId);
  }

  for (let index = 0; index < photos.length; index += 1) {
    if (photos[index]!.order !== index) {
      return { valid: false, code: "INVALID_ORDER", coverPhotoId: null };
    }
  }

  if (photos.length === 0) {
    return { valid: true, code: null, coverPhotoId: null };
  }

  let coverCount = 0;
  for (const photo of photos) {
    if (photo.isCover) coverCount += 1;
  }
  if (coverCount !== 1 || !photos[0]!.isCover) {
    return { valid: false, code: "MISSING_COVER", coverPhotoId: null };
  }

  return { valid: true, code: null, coverPhotoId: photos[0]!.photoId };
}

function isValidPayload(input: AddCollectionPhotoInput): boolean {
  const localUri = input.localUri.trim();
  if (!localUri) return false;
  if (!Number.isFinite(input.width) || !Number.isFinite(input.height)) return false;
  if (input.width <= 0 || input.height <= 0) return false;
  return true;
}

/**
 * Canonical Photo Collection Engine — single owner of in-memory photo references.
 */
export class SmartMultiCameraPhotoCollectionEngine {
  private state: PhotoCollectionState = createEmptyState();
  private readonly listeners = new Set<CollectionListener>();

  getSnapshot(): PhotoCollectionState {
    return {
      ...this.state,
      photos: this.state.photos.map((photo) => ({ ...photo })),
    };
  }

  subscribe(listener: CollectionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  addPhoto(input: AddCollectionPhotoInput): PhotoCollectionResult {
    if (!isValidPayload(input)) {
      return fail("INVALID_PHOTO");
    }
    if (this.state.photos.length >= SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS) {
      return fail("CAPACITY_REACHED");
    }

    const photoId = input.photoId?.trim() || safeRandomUUID();
    if (!photoId) {
      return fail("INVALID_PHOTO");
    }
    if (this.state.photos.some((photo) => photo.photoId === photoId)) {
      return fail("DUPLICATE_PHOTO_ID");
    }

    const at = input.timestamp ?? now();
    const isFirst = this.state.photos.length === 0;
    const nextPhoto: CollectionPhoto = {
      photoId,
      localUri: input.localUri.trim(),
      width: input.width,
      height: input.height,
      rotation: input.rotation ?? 0,
      timestamp: at,
      order: this.state.photos.length,
      isCover: isFirst,
      state: "captured",
    };

    const covered = applyCover([...this.state.photos, nextPhoto]);

    const events: PhotoCollectionEvent[] = [
      { type: "PhotoAdded", photoId, at },
    ];
    if (covered.coverPhotoId !== this.state.coverPhotoId) {
      events.push({ type: "CoverChanged", coverPhotoId: covered.coverPhotoId, at });
    }

    return this.commit(
      {
        photos: covered.photos,
        coverPhotoId: covered.coverPhotoId,
        isValid: true,
        updatedAt: at,
      },
      events,
    );
  }

  removePhoto(photoId: string): PhotoCollectionResult {
    const existing = this.state.photos.find((photo) => photo.photoId === photoId);
    if (!existing) {
      return fail("PHOTO_NOT_FOUND");
    }

    const at = now();
    const remaining = this.state.photos.filter((photo) => photo.photoId !== photoId);
    const covered = applyCover(remaining);

    const events: PhotoCollectionEvent[] = [
      { type: "PhotoRemoved", photoId, at },
    ];
    if (covered.coverPhotoId !== this.state.coverPhotoId) {
      events.push({ type: "CoverChanged", coverPhotoId: covered.coverPhotoId, at });
    }

    return this.commit(
      {
        photos: covered.photos,
        coverPhotoId: covered.coverPhotoId,
        isValid: true,
        updatedAt: at,
      },
      events,
    );
  }

  replacePhoto(photoId: string, input: ReplaceCollectionPhotoInput): PhotoCollectionResult {
    const index = this.state.photos.findIndex((photo) => photo.photoId === photoId);
    if (index < 0) {
      return fail("PHOTO_NOT_FOUND");
    }
    if (!isValidPayload(input)) {
      return fail("INVALID_PHOTO");
    }

    const nextId = input.photoId?.trim() || photoId;
    if (
      nextId !== photoId &&
      this.state.photos.some((photo) => photo.photoId === nextId)
    ) {
      return fail("DUPLICATE_PHOTO_ID");
    }

    const at = input.timestamp ?? now();
    const previous = this.state.photos[index]!;
    const replaced: CollectionPhoto = {
      ...previous,
      photoId: nextId,
      localUri: input.localUri.trim(),
      width: input.width,
      height: input.height,
      rotation: input.rotation ?? previous.rotation,
      timestamp: at,
      state: "captured",
    };

    const mutable = [...this.state.photos];
    mutable[index] = replaced;
    const covered = applyCover(mutable);

    const events: PhotoCollectionEvent[] = [
      { type: "PhotoReplaced", photoId: nextId, previousPhotoId: photoId, at },
    ];
    if (covered.coverPhotoId !== this.state.coverPhotoId) {
      events.push({ type: "CoverChanged", coverPhotoId: covered.coverPhotoId, at });
    }

    return this.commit(
      {
        photos: covered.photos,
        coverPhotoId: covered.coverPhotoId,
        isValid: true,
        updatedAt: at,
      },
      events,
    );
  }

  reorderPhotos(fromIndex: number, toIndex: number): PhotoCollectionResult {
    const length = this.state.photos.length;
    if (
      length === 0 ||
      !Number.isInteger(fromIndex) ||
      !Number.isInteger(toIndex) ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= length ||
      toIndex >= length
    ) {
      return fail("INVALID_INDEX");
    }
    if (fromIndex === toIndex) {
      return succeed(this.getSnapshot(), []);
    }

    const mutable = [...this.state.photos];
    const [moved] = mutable.splice(fromIndex, 1);
    if (!moved) {
      return fail("INVALID_INDEX");
    }
    mutable.splice(toIndex, 0, moved);

    const at = now();
    const covered = applyCover(mutable);
    const events: PhotoCollectionEvent[] = [
      {
        type: "PhotoReordered",
        photoIds: covered.photos.map((photo) => photo.photoId),
        at,
      },
    ];
    if (covered.coverPhotoId !== this.state.coverPhotoId) {
      events.push({ type: "CoverChanged", coverPhotoId: covered.coverPhotoId, at });
    }

    return this.commit(
      {
        photos: covered.photos,
        coverPhotoId: covered.coverPhotoId,
        isValid: true,
        updatedAt: at,
      },
      events,
    );
  }

  setCover(photoId: string): PhotoCollectionResult {
    const index = this.state.photos.findIndex((photo) => photo.photoId === photoId);
    if (index < 0) {
      return fail("PHOTO_NOT_FOUND");
    }
    if (this.state.coverPhotoId === photoId && this.state.photos[0]?.photoId === photoId) {
      return succeed(this.getSnapshot(), []);
    }

    const mutable = [...this.state.photos];
    const [moved] = mutable.splice(index, 1);
    if (!moved) {
      return fail("PHOTO_NOT_FOUND");
    }
    mutable.unshift(moved);

    const at = now();
    const covered = applyCover(mutable);
    return this.commit(
      {
        photos: covered.photos,
        coverPhotoId: covered.coverPhotoId,
        isValid: true,
        updatedAt: at,
      },
      [{ type: "CoverChanged", coverPhotoId: covered.coverPhotoId, at }],
    );
  }

  clear(): PhotoCollectionResult {
    if (this.state.photos.length === 0) {
      return succeed(this.getSnapshot(), []);
    }
    const at = now();
    const previousCover = this.state.coverPhotoId;
    const removedIds = this.state.photos.map((photo) => photo.photoId);
    const events: PhotoCollectionEvent[] = removedIds.map((photoId) => ({
      type: "PhotoRemoved" as const,
      photoId,
      at,
    }));
    if (previousCover !== null) {
      events.push({ type: "CoverChanged", coverPhotoId: null, at });
    }
    return this.commit(createEmptyState(at), events);
  }

  /** Validate current collection · emit CollectionValidated or CollectionInvalid. */
  validate(): PhotoCollectionResult {
    const at = now();
    const inspection = inspectCollection(this.state.photos);

    if (!inspection.valid || inspection.code) {
      const code = inspection.code ?? "COLLECTION_INVALID";
      const events: PhotoCollectionEvent[] = [
        { type: "CollectionInvalid", code, at },
      ];
      this.state = {
        ...this.state,
        isValid: false,
        updatedAt: at,
      };
      this.emitAll(events);
      return fail(code);
    }

    if (this.state.photos.length > 0 && this.state.coverPhotoId !== inspection.coverPhotoId) {
      const events: PhotoCollectionEvent[] = [
        { type: "CollectionInvalid", code: "MISSING_COVER", at },
      ];
      this.state = { ...this.state, isValid: false, updatedAt: at };
      this.emitAll(events);
      return fail("MISSING_COVER");
    }

    const events: PhotoCollectionEvent[] = [{ type: "CollectionValidated", at }];
    return this.commit(
      {
        ...this.state,
        isValid: true,
        updatedAt: at,
      },
      events,
    );
  }

  private commit(
    state: PhotoCollectionState,
    events: readonly PhotoCollectionEvent[],
  ): PhotoCollectionResult {
    // Take ownership of the freshly built photos array (single defensive clone on return).
    this.state = {
      ...state,
      photos: state.photos,
    };
    this.emitAll(events);
    return succeed(this.getSnapshot(), events);
  }

  private emitAll(events: readonly PhotoCollectionEvent[]): void {
    for (const event of events) {
      for (const listener of this.listeners) {
        listener(event);
      }
    }
  }
}

export function createSmartMultiCameraPhotoCollectionEngine(): SmartMultiCameraPhotoCollectionEngine {
  return new SmartMultiCameraPhotoCollectionEngine();
}
