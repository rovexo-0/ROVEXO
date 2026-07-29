/**
 * ROVEXO Smart Multi Camera Session — Session Engine types v1.0
 *
 * PHASE I · COD SÂNGE · Pure business model — no UI · no camera · no network.
 */

export const SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS = 8 as const;
export const SMART_MULTI_CAMERA_SESSION_MIN_PHOTOS_FOR_UPLOAD = 1 as const;

export type CameraSessionStatus =
  | "IDLE"
  | "STARTING"
  | "CAPTURING"
  | "REVIEWING"
  | "READY"
  | "UPLOAD_REQUESTED"
  | "UPLOADING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type FlashMode = "off" | "on" | "auto";

export type ActiveCamera = "back" | "front";

export type SessionUploadState =
  | "idle"
  | "requested"
  | "uploading"
  | "completed"
  | "failed";

export type SessionPhotoState = "captured";

export type SessionPhoto = {
  photoId: string;
  localUri: string;
  width: number;
  height: number;
  rotation: number;
  timestamp: number;
  order: number;
  isCover: boolean;
  state: SessionPhotoState;
};

export type CameraSession = {
  sessionId: string;
  createdAt: number;
  status: CameraSessionStatus;
  photos: readonly SessionPhoto[];
  coverPhotoId: string | null;
  flashMode: FlashMode;
  activeCamera: ActiveCamera;
  uploadState: SessionUploadState;
};

export type SessionEventType =
  | "SessionStarted"
  | "PhotoCaptured"
  | "PhotoDeleted"
  | "PhotoReordered"
  | "CoverChanged"
  | "SessionCancelled"
  | "UploadRequested"
  | "UploadCompleted"
  | "UploadFailed";

export type SessionEvent =
  | { type: "SessionStarted"; sessionId: string; at: number }
  | { type: "PhotoCaptured"; sessionId: string; photoId: string; at: number }
  | { type: "PhotoDeleted"; sessionId: string; photoId: string; at: number }
  | {
      type: "PhotoReordered";
      sessionId: string;
      photoIds: readonly string[];
      at: number;
    }
  | {
      type: "CoverChanged";
      sessionId: string;
      coverPhotoId: string | null;
      at: number;
    }
  | { type: "SessionCancelled"; sessionId: string; at: number }
  | { type: "UploadRequested"; sessionId: string; at: number }
  | { type: "UploadCompleted"; sessionId: string; at: number }
  | { type: "UploadFailed"; sessionId: string; at: number };

export type SessionEngineErrorCode =
  | "INVALID_TRANSITION"
  | "NO_SESSION"
  | "SESSION_CAPACITY"
  | "PHOTO_NOT_FOUND"
  | "INVALID_PHOTO"
  | "INVALID_REORDER"
  | "UPLOAD_NOT_READY"
  | "SESSION_TERMINAL";

export type SessionEngineFailure = {
  ok: false;
  code: SessionEngineErrorCode;
  message: string;
};

export type SessionEngineSuccess = {
  ok: true;
  session: CameraSession;
  events: readonly SessionEvent[];
};

export type SessionEngineResult = SessionEngineSuccess | SessionEngineFailure;

export type CapturePhotoInput = {
  localUri: string;
  width: number;
  height: number;
  rotation?: number;
  timestamp?: number;
  photoId?: string;
};
