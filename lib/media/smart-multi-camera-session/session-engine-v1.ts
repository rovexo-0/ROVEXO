/**
 * ROVEXO Smart Multi Camera Session — Session Engine v1.0
 *
 * PHASE I · CERTIFIED · COD SÂNGE · ONE implementation
 *
 * Owns ONLY (SSOT):
 *   session lifecycle · capture-path photo buffer · session upload lifecycle signals ·
 *   session flash/facing INTENT · session events.
 *
 * Does NOT own (consumers / other SSOTs):
 *   Photo Collection rail/cover/order (Photo Collection Engine) ·
 *   runtime flash/facing/permission/camera status (Camera Controller) ·
 *   capture lock (Capture Coordinator) · upload job queue (Upload Queue).
 *
 * FORBIDDEN in this module: UI · camera API · network · storage ·
 * Supabase · image processing · Sell page · toasts · dialogs.
 */

import { safeRandomUUID } from "@/lib/uuid";
import {
  SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS,
  SMART_MULTI_CAMERA_SESSION_MIN_PHOTOS_FOR_UPLOAD,
  type ActiveCamera,
  type CameraSession,
  type CameraSessionStatus,
  type CapturePhotoInput,
  type FlashMode,
  type SessionEngineErrorCode,
  type SessionEngineResult,
  type SessionEvent,
  type SessionPhoto,
} from "@/lib/media/smart-multi-camera-session/session-types-v1";

export const SMART_MULTI_CAMERA_SESSION_ENGINE_V1 = {
  version: "1.0",
  id: "smart-multi-camera-session-engine-v1",
  phase: "I_SESSION_ENGINE",
  status: "CERTIFIED",
  maxPhotos: SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS,
  minPhotosForUpload: SMART_MULTI_CAMERA_SESSION_MIN_PHOTOS_FOR_UPLOAD,
  ssotDomains: ["sessionLifecycle", "sessionCaptureBuffer"] as const,
} as const;

type SessionListener = (event: SessionEvent) => void;

const ERROR_MESSAGE: Record<SessionEngineErrorCode, string> = {
  INVALID_TRANSITION: "Invalid session state transition.",
  NO_SESSION: "No active camera session.",
  SESSION_CAPACITY: "Session photo limit reached.",
  PHOTO_NOT_FOUND: "Photo not found in session.",
  INVALID_PHOTO: "Photo payload is invalid.",
  INVALID_REORDER: "Photo reorder indexes are invalid.",
  UPLOAD_NOT_READY: "Session is not ready for upload.",
  SESSION_TERMINAL: "Session is closed.",
};

/** Deterministic allowed transitions — fail closed on anything else. */
const ALLOWED_TRANSITIONS: Readonly<
  Record<CameraSessionStatus, readonly CameraSessionStatus[]>
> = {
  IDLE: ["STARTING"],
  STARTING: ["CAPTURING", "CANCELLED"],
  CAPTURING: ["CAPTURING", "REVIEWING", "READY", "CANCELLED"],
  REVIEWING: ["CAPTURING", "REVIEWING", "READY", "CANCELLED"],
  READY: ["CAPTURING", "REVIEWING", "UPLOAD_REQUESTED", "CANCELLED"],
  UPLOAD_REQUESTED: ["UPLOADING", "CANCELLED"],
  UPLOADING: ["COMPLETED", "FAILED", "CANCELLED"],
  COMPLETED: [],
  FAILED: ["CAPTURING", "READY", "UPLOAD_REQUESTED", "CANCELLED"],
  CANCELLED: ["IDLE"],
};

function fail(code: SessionEngineErrorCode): SessionEngineResult {
  return { ok: false, code, message: ERROR_MESSAGE[code] };
}

function succeed(
  session: CameraSession,
  events: readonly SessionEvent[],
): SessionEngineResult {
  return { ok: true, session, events };
}

function now(): number {
  return Date.now();
}

function canTransition(from: CameraSessionStatus, to: CameraSessionStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

function isTerminal(status: CameraSessionStatus): boolean {
  return status === "COMPLETED" || status === "CANCELLED";
}

function createIdleSession(): CameraSession {
  return {
    sessionId: "",
    createdAt: 0,
    status: "IDLE",
    photos: [],
    coverPhotoId: null,
    flashMode: "auto",
    activeCamera: "back",
    uploadState: "idle",
  };
}

/** Defensive clone — snapshots must never alias internal mutable state. */
function cloneSession(session: CameraSession): CameraSession {
  return {
    ...session,
    photos: session.photos.map((photo) => ({ ...photo })),
  };
}

/**
 * Contiguous order by array position + cover selection.
 * Prefer calling directly — do not pre-reindex (applyCover already reindexes).
 */
function applyCover(
  photos: readonly SessionPhoto[],
  preferredCoverId: string | null,
): { photos: SessionPhoto[]; coverPhotoId: string | null } {
  if (photos.length === 0) {
    return { photos: [], coverPhotoId: null };
  }

  const preferredIndex =
    preferredCoverId === null
      ? 0
      : photos.findIndex((photo) => photo.photoId === preferredCoverId);
  const coverIndex = preferredIndex >= 0 ? preferredIndex : 0;
  const coverPhotoId = photos[coverIndex]!.photoId;

  return {
    photos: photos.map((photo, index) => ({
      ...photo,
      order: index,
      isCover: photo.photoId === coverPhotoId,
    })),
    coverPhotoId,
  };
}

function hasActiveSession(session: CameraSession): boolean {
  return session.status !== "IDLE" && session.sessionId !== "";
}

/**
 * Canonical Session Engine — single owner of Smart Multi Camera Session state.
 */
export class SmartMultiCameraSessionEngine {
  private session: CameraSession = createIdleSession();
  private readonly listeners = new Set<SessionListener>();

  getSnapshot(): CameraSession {
    return cloneSession(this.session);
  }

  subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** IDLE → STARTING · emits SessionStarted */
  startSession(options?: {
    flashMode?: FlashMode;
    activeCamera?: ActiveCamera;
    sessionId?: string;
    createdAt?: number;
  }): SessionEngineResult {
    if (this.session.status !== "IDLE") {
      return fail("INVALID_TRANSITION");
    }

    const createdAt = options?.createdAt ?? now();
    const sessionId = options?.sessionId ?? safeRandomUUID();
    const next: CameraSession = {
      sessionId,
      createdAt,
      status: "STARTING",
      photos: [],
      coverPhotoId: null,
      flashMode: options?.flashMode ?? "auto",
      activeCamera: options?.activeCamera ?? "back",
      uploadState: "idle",
    };

    const event: SessionEvent = {
      type: "SessionStarted",
      sessionId,
      at: createdAt,
    };
    return this.commit(next, [event]);
  }

  /** STARTING → CAPTURING */
  beginCapturing(): SessionEngineResult {
    return this.transitionTo("CAPTURING");
  }

  /** CAPTURING | REVIEWING | READY → REVIEWING */
  enterReviewing(): SessionEngineResult {
    if (!hasActiveSession(this.session)) {
      return fail("NO_SESSION");
    }
    if (!canTransition(this.session.status, "REVIEWING")) {
      return fail("INVALID_TRANSITION");
    }
    return this.commit({ ...this.session, status: "REVIEWING" }, []);
  }

  /**
   * Mark session READY when at least one photo exists.
   * Allowed from CAPTURING | REVIEWING | FAILED.
   */
  markReady(): SessionEngineResult {
    if (!hasActiveSession(this.session)) {
      return fail("NO_SESSION");
    }
    if (this.session.photos.length < SMART_MULTI_CAMERA_SESSION_MIN_PHOTOS_FOR_UPLOAD) {
      return fail("UPLOAD_NOT_READY");
    }
    if (!canTransition(this.session.status, "READY")) {
      return fail("INVALID_TRANSITION");
    }
    return this.commit(
      {
        ...this.session,
        status: "READY",
        uploadState: this.session.uploadState === "failed" ? "idle" : this.session.uploadState,
      },
      [],
    );
  }

  /** Capture a photo into the session (no camera / no upload). */
  capturePhoto(input: CapturePhotoInput): SessionEngineResult {
    if (!hasActiveSession(this.session)) {
      return fail("NO_SESSION");
    }
    if (isTerminal(this.session.status) || this.session.status === "COMPLETED") {
      return fail("SESSION_TERMINAL");
    }

    const captureStatuses: CameraSessionStatus[] = ["CAPTURING", "REVIEWING", "READY"];
    if (!captureStatuses.includes(this.session.status)) {
      return fail("INVALID_TRANSITION");
    }
    if (this.session.photos.length >= SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS) {
      return fail("SESSION_CAPACITY");
    }

    const localUri = input.localUri.trim();
    if (!localUri || !Number.isFinite(input.width) || !Number.isFinite(input.height)) {
      return fail("INVALID_PHOTO");
    }
    if (input.width <= 0 || input.height <= 0) {
      return fail("INVALID_PHOTO");
    }

    const timestamp = input.timestamp ?? now();
    const photoId = input.photoId ?? safeRandomUUID();
    if (this.session.photos.some((photo) => photo.photoId === photoId)) {
      return fail("INVALID_PHOTO");
    }

    const isFirst = this.session.photos.length === 0;
    const photo: SessionPhoto = {
      photoId,
      localUri,
      width: input.width,
      height: input.height,
      rotation: input.rotation ?? 0,
      timestamp,
      order: this.session.photos.length,
      isCover: isFirst,
      state: "captured",
    };

    const photos = [...this.session.photos, photo];
    const covered = applyCover(photos, isFirst ? photoId : this.session.coverPhotoId);
    const status: CameraSessionStatus =
      this.session.status === "REVIEWING" ? "REVIEWING" : "CAPTURING";

    if (status !== this.session.status && !canTransition(this.session.status, status)) {
      return fail("INVALID_TRANSITION");
    }

    const events: SessionEvent[] = [
      {
        type: "PhotoCaptured",
        sessionId: this.session.sessionId,
        photoId,
        at: timestamp,
      },
    ];
    if (isFirst || covered.coverPhotoId !== this.session.coverPhotoId) {
      events.push({
        type: "CoverChanged",
        sessionId: this.session.sessionId,
        coverPhotoId: covered.coverPhotoId,
        at: timestamp,
      });
    }

    return this.commit(
      {
        ...this.session,
        status,
        photos: covered.photos,
        coverPhotoId: covered.coverPhotoId,
      },
      events,
    );
  }

  /** Instant delete · reindex · cover reassignment · events. */
  deletePhoto(photoId: string): SessionEngineResult {
    if (!hasActiveSession(this.session)) {
      return fail("NO_SESSION");
    }
    if (
      this.session.status === "UPLOAD_REQUESTED" ||
      this.session.status === "UPLOADING" ||
      this.session.status === "COMPLETED"
    ) {
      return fail("INVALID_TRANSITION");
    }

    const editStatuses: CameraSessionStatus[] = ["CAPTURING", "REVIEWING", "READY", "FAILED"];
    if (!editStatuses.includes(this.session.status)) {
      return fail("INVALID_TRANSITION");
    }

    const existing = this.session.photos.find((photo) => photo.photoId === photoId);
    if (!existing) {
      return fail("PHOTO_NOT_FOUND");
    }

    const at = now();
    const remaining = this.session.photos.filter((photo) => photo.photoId !== photoId);
    const preferredCover =
      this.session.coverPhotoId === photoId ? null : this.session.coverPhotoId;
    const covered = applyCover(remaining, preferredCover);

    const events: SessionEvent[] = [
      {
        type: "PhotoDeleted",
        sessionId: this.session.sessionId,
        photoId,
        at,
      },
    ];
    if (covered.coverPhotoId !== this.session.coverPhotoId) {
      events.push({
        type: "CoverChanged",
        sessionId: this.session.sessionId,
        coverPhotoId: covered.coverPhotoId,
        at,
      });
    }

    const nextStatus: CameraSessionStatus =
      covered.photos.length === 0
        ? "CAPTURING"
        : this.session.status === "FAILED"
          ? "READY"
          : this.session.status;

    return this.commit(
      {
        ...this.session,
        status: nextStatus,
        photos: covered.photos,
        coverPhotoId: covered.coverPhotoId,
        uploadState: this.session.status === "FAILED" ? "idle" : this.session.uploadState,
      },
      events,
    );
  }

  /** Press-hold reorder · first becomes cover. */
  reorderPhotos(fromIndex: number, toIndex: number): SessionEngineResult {
    if (!hasActiveSession(this.session)) {
      return fail("NO_SESSION");
    }

    const editStatuses: CameraSessionStatus[] = ["CAPTURING", "REVIEWING", "READY"];
    if (!editStatuses.includes(this.session.status)) {
      return fail("INVALID_TRANSITION");
    }

    const length = this.session.photos.length;
    if (
      length === 0 ||
      !Number.isInteger(fromIndex) ||
      !Number.isInteger(toIndex) ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= length ||
      toIndex >= length
    ) {
      return fail("INVALID_REORDER");
    }
    if (fromIndex === toIndex) {
      return succeed(cloneSession(this.session), []);
    }

    const mutable = [...this.session.photos];
    const [moved] = mutable.splice(fromIndex, 1);
    if (!moved) {
      return fail("INVALID_REORDER");
    }
    mutable.splice(toIndex, 0, moved);

    const at = now();
    const covered = applyCover(mutable, mutable[0]?.photoId ?? null);
    const events: SessionEvent[] = [
      {
        type: "PhotoReordered",
        sessionId: this.session.sessionId,
        photoIds: covered.photos.map((photo) => photo.photoId),
        at,
      },
    ];
    if (covered.coverPhotoId !== this.session.coverPhotoId) {
      events.push({
        type: "CoverChanged",
        sessionId: this.session.sessionId,
        coverPhotoId: covered.coverPhotoId,
        at,
      });
    }

    return this.commit(
      {
        ...this.session,
        photos: covered.photos,
        coverPhotoId: covered.coverPhotoId,
      },
      events,
    );
  }

  setFlashMode(flashMode: FlashMode): SessionEngineResult {
    if (!hasActiveSession(this.session)) {
      return fail("NO_SESSION");
    }
    if (isTerminal(this.session.status) || this.session.status === "COMPLETED") {
      return fail("SESSION_TERMINAL");
    }
    return this.commit({ ...this.session, flashMode }, []);
  }

  setActiveCamera(activeCamera: ActiveCamera): SessionEngineResult {
    if (!hasActiveSession(this.session)) {
      return fail("NO_SESSION");
    }
    if (isTerminal(this.session.status) || this.session.status === "COMPLETED") {
      return fail("SESSION_TERMINAL");
    }
    return this.commit({ ...this.session, activeCamera }, []);
  }

  /**
   * Next — MUST NOT upload.
   * READY → UPLOAD_REQUESTED only.
   */
  requestUpload(): SessionEngineResult {
    if (!hasActiveSession(this.session)) {
      return fail("NO_SESSION");
    }
    if (this.session.photos.length < SMART_MULTI_CAMERA_SESSION_MIN_PHOTOS_FOR_UPLOAD) {
      return fail("UPLOAD_NOT_READY");
    }
    if (this.session.status === "FAILED") {
      if (!canTransition("FAILED", "UPLOAD_REQUESTED")) {
        return fail("INVALID_TRANSITION");
      }
    } else if (this.session.status !== "READY") {
      return fail("INVALID_TRANSITION");
    } else if (!canTransition("READY", "UPLOAD_REQUESTED")) {
      return fail("INVALID_TRANSITION");
    }

    const at = now();
    const event: SessionEvent = {
      type: "UploadRequested",
      sessionId: this.session.sessionId,
      at,
    };
    return this.commit(
      {
        ...this.session,
        status: "UPLOAD_REQUESTED",
        uploadState: "requested",
      },
      [event],
    );
  }

  /** Host signals upload work started — UPLOAD_REQUESTED → UPLOADING */
  notifyUploadStarted(): SessionEngineResult {
    if (!hasActiveSession(this.session)) {
      return fail("NO_SESSION");
    }
    if (!canTransition(this.session.status, "UPLOADING")) {
      return fail("INVALID_TRANSITION");
    }
    return this.commit(
      {
        ...this.session,
        status: "UPLOADING",
        uploadState: "uploading",
      },
      [],
    );
  }

  /** Host signals success — UPLOADING → COMPLETED */
  notifyUploadCompleted(): SessionEngineResult {
    if (!hasActiveSession(this.session)) {
      return fail("NO_SESSION");
    }
    if (!canTransition(this.session.status, "COMPLETED")) {
      return fail("INVALID_TRANSITION");
    }
    const at = now();
    const event: SessionEvent = {
      type: "UploadCompleted",
      sessionId: this.session.sessionId,
      at,
    };
    return this.commit(
      {
        ...this.session,
        status: "COMPLETED",
        uploadState: "completed",
      },
      [event],
    );
  }

  /** Host signals failure — UPLOADING → FAILED · remain recoverable */
  notifyUploadFailed(): SessionEngineResult {
    if (!hasActiveSession(this.session)) {
      return fail("NO_SESSION");
    }
    if (!canTransition(this.session.status, "FAILED")) {
      return fail("INVALID_TRANSITION");
    }
    const at = now();
    const event: SessionEvent = {
      type: "UploadFailed",
      sessionId: this.session.sessionId,
      at,
    };
    return this.commit(
      {
        ...this.session,
        status: "FAILED",
        uploadState: "failed",
      },
      [event],
    );
  }

  /**
   * Cancel — destroy session · clear references · return IDLE.
   * Emits SessionCancelled then resets.
   */
  cancelSession(): SessionEngineResult {
    if (this.session.status === "IDLE") {
      return succeed(cloneSession(this.session), []);
    }
    if (this.session.status === "COMPLETED") {
      return fail("SESSION_TERMINAL");
    }

    const previousId = this.session.sessionId;
    const at = now();
    const cancelledEvent: SessionEvent = {
      type: "SessionCancelled",
      sessionId: previousId || "unknown",
      at,
    };

    if (hasActiveSession(this.session) && canTransition(this.session.status, "CANCELLED")) {
      this.emit(cancelledEvent);
      this.session = createIdleSession();
      return succeed(cloneSession(this.session), [cancelledEvent]);
    }

    // Fail closed: still clear to IDLE if we had a session identity.
    if (previousId) {
      this.emit(cancelledEvent);
      this.session = createIdleSession();
      return succeed(cloneSession(this.session), [cancelledEvent]);
    }

    return fail("INVALID_TRANSITION");
  }

  private transitionTo(status: CameraSessionStatus): SessionEngineResult {
    if (!hasActiveSession(this.session) && this.session.status !== "STARTING") {
      return fail("NO_SESSION");
    }
    if (!canTransition(this.session.status, status)) {
      return fail("INVALID_TRANSITION");
    }
    return this.commit({ ...this.session, status }, []);
  }

  private commit(
    session: CameraSession,
    events: readonly SessionEvent[],
  ): SessionEngineResult {
    // Take ownership of freshly built photos (callers always allocate new arrays).
    this.session = {
      ...session,
      photos: session.photos,
    };
    for (const event of events) {
      this.emit(event);
    }
    return succeed(cloneSession(this.session), events);
  }

  private emit(event: SessionEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

/** Factory — one engine instance per session owner (e.g. Sell host). */
export function createSmartMultiCameraSessionEngine(): SmartMultiCameraSessionEngine {
  return new SmartMultiCameraSessionEngine();
}

export function isSessionTransitionAllowed(
  from: CameraSessionStatus,
  to: CameraSessionStatus,
): boolean {
  return canTransition(from, to);
}
