/**
 * ROVEXO Smart Multi Camera Session — Capture Coordinator v1.0
 *
 * PHASE III · COD SÂNGE · ONE implementation · Logic only
 *
 * Orchestrates capture requests between Session Engine + Camera Controller.
 * Does NOT capture images, render UI, or access hardware.
 */

import { safeRandomUUID } from "@/lib/uuid";
import type { SmartMultiCameraController } from "@/lib/media/smart-multi-camera-session/camera-controller-v1";
import type { SmartMultiCameraSessionEngine } from "@/lib/media/smart-multi-camera-session/session-engine-v1";
import {
  SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS,
  type CapturePhotoInput,
  type CameraSessionStatus,
} from "@/lib/media/smart-multi-camera-session/session-types-v1";
import type {
  CaptureCoordinatorErrorCode,
  CaptureCoordinatorEvent,
  CaptureCoordinatorResult,
  CaptureCoordinatorState,
  CaptureRejectReason,
} from "@/lib/media/smart-multi-camera-session/capture-coordinator-types-v1";

export const SMART_MULTI_CAMERA_CAPTURE_COORDINATOR_V1 = {
  version: "1.0",
  id: "smart-multi-camera-capture-coordinator-v1",
  phase: "III_CAPTURE_COORDINATOR",
  status: "CERTIFIED",
  maxPhotos: SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS,
  hardwareAccessForbidden: true,
  uiForbidden: true,
  singleCaptureLock: true,
} as const;

type CoordinatorListener = (event: CaptureCoordinatorEvent) => void;

export type CaptureCoordinatorDeps = {
  sessionEngine: SmartMultiCameraSessionEngine;
  cameraController: SmartMultiCameraController;
};

const ERROR_MESSAGE: Record<CaptureCoordinatorErrorCode, string> = {
  INVALID_TRANSITION: "Invalid capture coordinator transition.",
  SESSION_NOT_READY: "Camera session is not ready for capture.",
  CONTROLLER_NOT_READY: "Camera controller is not ready for capture.",
  PERMISSION_REQUIRED: "Camera permission is not granted.",
  CAPACITY_REACHED: "Session photo limit reached.",
  CAPTURE_LOCK_HELD: "A capture request is already in progress.",
  NO_PENDING_CAPTURE: "No pending capture request.",
  COORDINATOR_FAILED: "Capture coordinator is in a failed state.",
  INVALID_CAPTURE: "Capture payload is invalid.",
};

/** Session statuses eligible for capture (Phase I capturePhoto + Phase III ready). */
const SESSION_CAPTURE_READY: readonly CameraSessionStatus[] = [
  "CAPTURING",
  "REVIEWING",
  "READY",
];

function fail(code: CaptureCoordinatorErrorCode): CaptureCoordinatorResult {
  return { ok: false, code, message: ERROR_MESSAGE[code] };
}

function succeed(
  state: CaptureCoordinatorState,
  events: readonly CaptureCoordinatorEvent[],
): CaptureCoordinatorResult {
  return { ok: true, state, events };
}

function now(): number {
  return Date.now();
}

function createInitialState(): CaptureCoordinatorState {
  return {
    status: "IDLE",
    lockHeld: false,
    pendingRequestId: null,
    lastRejectReason: null,
    lastErrorCode: null,
    updatedAt: 0,
  };
}

/**
 * Canonical Capture Coordinator — single owner of capture request lifecycle.
 */
export class SmartMultiCameraCaptureCoordinator {
  private state: CaptureCoordinatorState = createInitialState();
  private readonly listeners = new Set<CoordinatorListener>();
  private readonly sessionEngine: SmartMultiCameraSessionEngine;
  private readonly cameraController: SmartMultiCameraController;

  constructor(deps: CaptureCoordinatorDeps) {
    this.sessionEngine = deps.sessionEngine;
    this.cameraController = deps.cameraController;
  }

  getSnapshot(): CaptureCoordinatorState {
    return { ...this.state };
  }

  subscribe(listener: CoordinatorListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * RequestCapture → validate → lock → CaptureRequested.
   * Host must later accept / reject / cancel.
   */
  requestCapture(requestId?: string): CaptureCoordinatorResult {
    if (this.state.status === "FAILED") {
      return fail("COORDINATOR_FAILED");
    }
    if (this.state.lockHeld || this.state.status === "AWAITING_HOST") {
      return this.rejectImmediate("LOCK_HELD", "CAPTURE_LOCK_HELD");
    }

    const eligibility = this.validateEligibility();
    if (!eligibility.ok) {
      return this.rejectImmediate(eligibility.reason, eligibility.code);
    }

    const id = requestId?.trim() || safeRandomUUID();
    const at = now();
    const events: CaptureCoordinatorEvent[] = [
      { type: "CaptureLockAcquired", requestId: id, at },
      { type: "CaptureRequested", requestId: id, at },
    ];

    return this.commit(
      {
        status: "AWAITING_HOST",
        lockHeld: true,
        pendingRequestId: id,
        lastRejectReason: null,
        lastErrorCode: null,
        updatedAt: at,
      },
      events,
    );
  }

  /**
   * Host success — commit photo into Session Engine, then release lock.
   * Coordinator never reads image bytes.
   */
  acceptCapture(input: CapturePhotoInput, requestId?: string): CaptureCoordinatorResult {
    if (this.state.status !== "AWAITING_HOST" || !this.state.lockHeld || !this.state.pendingRequestId) {
      return fail("NO_PENDING_CAPTURE");
    }
    if (requestId && requestId !== this.state.pendingRequestId) {
      return fail("NO_PENDING_CAPTURE");
    }

    const pendingId = this.state.pendingRequestId;
    const captured = this.sessionEngine.capturePhoto(input);
    const at = now();

    if (!captured.ok) {
      const events: CaptureCoordinatorEvent[] = [
        {
          type: "CaptureRejected",
          requestId: pendingId,
          reason: "SESSION_CAPTURE_FAILED",
          at,
        },
        { type: "CaptureLockReleased", requestId: pendingId, at },
      ];
      return this.commit(
        {
          status: "IDLE",
          lockHeld: false,
          pendingRequestId: null,
          lastRejectReason: "SESSION_CAPTURE_FAILED",
          lastErrorCode: null,
          updatedAt: at,
        },
        events,
      );
    }

    const photoCaptured = captured.events.find((event) => event.type === "PhotoCaptured");
    const photoId =
      (photoCaptured && photoCaptured.type === "PhotoCaptured"
        ? photoCaptured.photoId
        : null) ??
      input.photoId ??
      captured.session.photos[captured.session.photos.length - 1]?.photoId;

    if (!photoId) {
      return this.failCoordinator("INVALID_CAPTURE", pendingId);
    }

    const events: CaptureCoordinatorEvent[] = [
      { type: "CaptureAccepted", requestId: pendingId, photoId, at },
      { type: "CaptureLockReleased", requestId: pendingId, at },
    ];

    return this.commit(
      {
        status: "IDLE",
        lockHeld: false,
        pendingRequestId: null,
        lastRejectReason: null,
        lastErrorCode: null,
        updatedAt: at,
      },
      events,
    );
  }

  /** Host failure while awaiting capture result. */
  rejectCapture(reason: CaptureRejectReason = "HOST_REJECTED", requestId?: string): CaptureCoordinatorResult {
    if (this.state.status !== "AWAITING_HOST" || !this.state.pendingRequestId) {
      return fail("NO_PENDING_CAPTURE");
    }
    if (requestId && requestId !== this.state.pendingRequestId) {
      return fail("NO_PENDING_CAPTURE");
    }

    const pendingId = this.state.pendingRequestId;
    const at = now();
    const events: CaptureCoordinatorEvent[] = [
      { type: "CaptureRejected", requestId: pendingId, reason, at },
      { type: "CaptureLockReleased", requestId: pendingId, at },
    ];

    return this.commit(
      {
        status: "IDLE",
        lockHeld: false,
        pendingRequestId: null,
        lastRejectReason: reason,
        lastErrorCode: null,
        updatedAt: at,
      },
      events,
    );
  }

  /** Cancel pending capture request and release lock. */
  cancelCapture(requestId?: string): CaptureCoordinatorResult {
    if (this.state.status !== "AWAITING_HOST" || !this.state.pendingRequestId) {
      return fail("NO_PENDING_CAPTURE");
    }
    if (requestId && requestId !== this.state.pendingRequestId) {
      return fail("NO_PENDING_CAPTURE");
    }

    const pendingId = this.state.pendingRequestId;
    const at = now();
    const events: CaptureCoordinatorEvent[] = [
      { type: "CaptureCancelled", requestId: pendingId, at },
      { type: "CaptureLockReleased", requestId: pendingId, at },
    ];

    return this.commit(
      {
        status: "IDLE",
        lockHeld: false,
        pendingRequestId: null,
        lastRejectReason: null,
        lastErrorCode: null,
        updatedAt: at,
      },
      events,
    );
  }

  /**
   * Recovery after FAILED — clear error, return IDLE, lock released.
   * Does not mutate Session Engine or Camera Controller.
   */
  recover(): CaptureCoordinatorResult {
    if (this.state.status !== "FAILED" && this.state.status !== "AWAITING_HOST") {
      return fail("INVALID_TRANSITION");
    }

    const pendingId = this.state.pendingRequestId;
    const at = now();
    const events: CaptureCoordinatorEvent[] = [];
    if (this.state.lockHeld) {
      events.push({ type: "CaptureLockReleased", requestId: pendingId, at });
    }

    return this.commit(
      {
        status: "IDLE",
        lockHeld: false,
        pendingRequestId: null,
        lastRejectReason: null,
        lastErrorCode: null,
        updatedAt: at,
      },
      events,
    );
  }

  private validateEligibility():
    | { ok: true }
    | {
        ok: false;
        reason: CaptureRejectReason;
        code: CaptureCoordinatorErrorCode;
      } {
    const session = this.sessionEngine.getSnapshot();
    const controller = this.cameraController.getSnapshot();

    if (!session.sessionId || session.status === "IDLE") {
      return { ok: false, reason: "SESSION_NOT_READY", code: "SESSION_NOT_READY" };
    }
    if (!SESSION_CAPTURE_READY.includes(session.status)) {
      return { ok: false, reason: "SESSION_NOT_READY", code: "SESSION_NOT_READY" };
    }

    if (controller.status !== "READY") {
      return { ok: false, reason: "CONTROLLER_NOT_READY", code: "CONTROLLER_NOT_READY" };
    }
    if (controller.permission !== "GRANTED") {
      return { ok: false, reason: "PERMISSION_DENIED", code: "PERMISSION_REQUIRED" };
    }

    if (session.photos.length >= SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS) {
      return { ok: false, reason: "CAPACITY_REACHED", code: "CAPACITY_REACHED" };
    }

    return { ok: true };
  }

  private rejectImmediate(
    reason: CaptureRejectReason,
    code: CaptureCoordinatorErrorCode,
  ): CaptureCoordinatorResult {
    const at = now();
    const events: CaptureCoordinatorEvent[] = [
      { type: "CaptureRejected", requestId: null, reason, at },
    ];
    // Stay IDLE — duplicate/invalid requests do not take the lock.
    this.emitAll(events);
    return {
      ok: false,
      code,
      message: ERROR_MESSAGE[code],
    };
  }

  private failCoordinator(
    code: CaptureCoordinatorErrorCode,
    pendingId: string,
  ): CaptureCoordinatorResult {
    const at = now();
    const events: CaptureCoordinatorEvent[] = [
      { type: "CoordinatorFailed", code, at },
      { type: "CaptureLockReleased", requestId: pendingId, at },
    ];
    return this.commit(
      {
        status: "FAILED",
        lockHeld: false,
        pendingRequestId: null,
        lastRejectReason: "INVALID_PAYLOAD",
        lastErrorCode: code,
        updatedAt: at,
      },
      events,
    );
  }

  private commit(
    state: CaptureCoordinatorState,
    events: readonly CaptureCoordinatorEvent[],
  ): CaptureCoordinatorResult {
    this.state = { ...state };
    this.emitAll(events);
    return succeed({ ...this.state }, events);
  }

  private emitAll(events: readonly CaptureCoordinatorEvent[]): void {
    for (const event of events) {
      for (const listener of this.listeners) {
        listener(event);
      }
    }
  }
}

export function createSmartMultiCameraCaptureCoordinator(
  deps: CaptureCoordinatorDeps,
): SmartMultiCameraCaptureCoordinator {
  return new SmartMultiCameraCaptureCoordinator(deps);
}
