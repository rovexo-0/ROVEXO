/**
 * ROVEXO Smart Multi Camera Session — Photo Collection Engine types v1.0
 *
 * PHASE IV · COD SÂNGE · Logic only — in-memory references · no hardware · no UI.
 */

import type { SessionPhoto } from "@/lib/media/smart-multi-camera-session/session-types-v1";

export type CollectionPhoto = SessionPhoto;

export type PhotoCollectionState = {
  photos: readonly CollectionPhoto[];
  coverPhotoId: string | null;
  isValid: boolean;
  updatedAt: number;
};

export type AddCollectionPhotoInput = {
  photoId?: string;
  localUri: string;
  width: number;
  height: number;
  rotation?: number;
  timestamp?: number;
};

export type ReplaceCollectionPhotoInput = AddCollectionPhotoInput;

export type PhotoCollectionErrorCode =
  | "CAPACITY_REACHED"
  | "DUPLICATE_PHOTO_ID"
  | "PHOTO_NOT_FOUND"
  | "INVALID_PHOTO"
  | "INVALID_INDEX"
  | "INVALID_ORDER"
  | "MISSING_COVER"
  | "COLLECTION_INVALID";

export type PhotoCollectionFailure = {
  ok: false;
  code: PhotoCollectionErrorCode;
  message: string;
};

export type PhotoCollectionSuccess = {
  ok: true;
  state: PhotoCollectionState;
  events: readonly PhotoCollectionEvent[];
};

export type PhotoCollectionResult = PhotoCollectionSuccess | PhotoCollectionFailure;

export type PhotoCollectionEventType =
  | "PhotoAdded"
  | "PhotoRemoved"
  | "PhotoReplaced"
  | "PhotoReordered"
  | "CoverChanged"
  | "CollectionValidated"
  | "CollectionInvalid";

export type PhotoCollectionEvent =
  | { type: "PhotoAdded"; photoId: string; at: number }
  | { type: "PhotoRemoved"; photoId: string; at: number }
  | { type: "PhotoReplaced"; photoId: string; previousPhotoId: string; at: number }
  | { type: "PhotoReordered"; photoIds: readonly string[]; at: number }
  | { type: "CoverChanged"; coverPhotoId: string | null; at: number }
  | { type: "CollectionValidated"; at: number }
  | {
      type: "CollectionInvalid";
      code: PhotoCollectionErrorCode;
      at: number;
    };
