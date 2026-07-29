/**
 * ROVEXO Smart Multi Camera Session — Camera Controller v1.0
 *
 * PHASE II · COD SÂNGE · ONE implementation · Logic only
 *
 * Orchestrates camera lifecycle state. Does NOT capture, render, or
 * access hardware / browser / native camera APIs.
 *
 * Session Engine (Phase I CERTIFIED) is consumed read-only via attach;
 * this controller must never corrupt session state.
 */

import type { CameraSession } from "@/lib/media/smart-multi-camera-session/session-types-v1";
import {
  CAMERA_FLASH_CYCLE,
  type CameraControllerErrorCode,
  type CameraControllerEvent,
  type CameraControllerResult,
  type CameraControllerState,
  type CameraControllerStatus,
  type CameraFacing,
  type CameraFlashMode,
  type CameraPermissionState,
} from "@/lib/media/smart-multi-camera-session/camera-controller-types-v1";

export const SMART_MULTI_CAMERA_CONTROLLER_V1 = {
  version: "1.0",
  id: "smart-multi-camera-controller-v1",
  phase: "II_CAMERA_CONTROLLER",
  status: "CERTIFIED",
  platformAgnostic: true,
  ssotDomains: [
    "cameraState",
    "flashState",
    "permissionState",
    "facingState",
  ] as const,
  hardwareAccessForbidden: true,
  uiForbidden: true,
} as const;

type ControllerListener = (event: CameraControllerEvent) => void;

const ERROR_MESSAGE: Record<CameraControllerErrorCode, string> = {
  INVALID_TRANSITION: "Invalid camera controller state transition.",
  PERMISSION_REQUIRED: "Camera permission is not granted.",
  NO_SESSION: "No camera session attached.",
  SESSION_ALREADY_ATTACHED: "A camera session is already attached.",
  SESSION_MISMATCH: "Attached session does not match.",
  CONTROLLER_STOPPED: "Camera controller is stopped.",
  CONTROLLER_FAILED: "Camera controller is in a failed state.",
  INVALID_FLASH: "Flash mode is invalid.",
  INVALID_CAMERA: "Camera facing is invalid.",
};

const ALLOWED_TRANSITIONS: Readonly<
  Record<CameraControllerStatus, readonly CameraControllerStatus[]>
> = {
  UNINITIALIZED: ["INITIALIZING"],
  INITIALIZING: ["READY", "FAILED", "PERMISSION_DENIED", "STOPPED"],
  READY: ["PAUSED", "STOPPED", "FAILED"],
  PAUSED: ["READY", "STOPPED", "FAILED"],
  STOPPED: ["INITIALIZING"],
  FAILED: ["INITIALIZING", "STOPPED"],
  PERMISSION_DENIED: ["INITIALIZING", "STOPPED"],
};

function fail(code: CameraControllerErrorCode): CameraControllerResult {
  return { ok: false, code, message: ERROR_MESSAGE[code] };
}

function succeed(
  state: CameraControllerState,
  events: readonly CameraControllerEvent[],
): CameraControllerResult {
  return { ok: true, state, events };
}

function now(): number {
  return Date.now();
}

function canTransition(
  from: CameraControllerStatus,
  to: CameraControllerStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

function createInitialState(): CameraControllerState {
  return {
    status: "UNINITIALIZED",
    permission: "UNKNOWN",
    activeCamera: "back",
    flashMode: "auto",
    attachedSessionId: null,
    lastErrorCode: null,
    updatedAt: 0,
  };
}

/**
 * Canonical Camera Controller — single owner of camera orchestration state.
 */
export class SmartMultiCameraController {
  private state: CameraControllerState = createInitialState();
  private readonly listeners = new Set<ControllerListener>();

  getSnapshot(): CameraControllerState {
    return { ...this.state };
  }

  subscribe(listener: ControllerListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** UNINITIALIZED | STOPPED | FAILED | PERMISSION_DENIED → INITIALIZING */
  initialize(): CameraControllerResult {
    if (!canTransition(this.state.status, "INITIALIZING")) {
      return fail("INVALID_TRANSITION");
    }
    return this.commit(
      {
        ...this.state,
        status: "INITIALIZING",
        permission:
          this.state.permission === "GRANTED" ? "GRANTED" : "UNKNOWN",
        lastErrorCode: null,
        updatedAt: now(),
      },
      [],
    );
  }

  /**
   * Host reports permission probe / result.
   * Operations that need the camera require permission === GRANTED.
   */
  setPermission(permission: CameraPermissionState): CameraControllerResult {
    if (this.state.status === "STOPPED") {
      return fail("CONTROLLER_STOPPED");
    }

    const at = now();
    const events: CameraControllerEvent[] = [];
    let status = this.state.status;
    let lastErrorCode = this.state.lastErrorCode;

    if (permission === "CHECKING") {
      if (status === "UNINITIALIZED") {
        return fail("INVALID_TRANSITION");
      }
      return this.commit(
        {
          ...this.state,
          permission: "CHECKING",
          updatedAt: at,
        },
        [],
      );
    }

    if (permission === "GRANTED") {
      events.push({ type: "PermissionGranted", at });
      if (status === "INITIALIZING") {
        if (!canTransition(status, "READY")) {
          return fail("INVALID_TRANSITION");
        }
        status = "READY";
        events.push({ type: "ControllerInitialized", at });
      }
      return this.commit(
        {
          ...this.state,
          status,
          permission: "GRANTED",
          lastErrorCode: null,
          updatedAt: at,
        },
        events,
      );
    }

    if (permission === "DENIED" || permission === "BLOCKED") {
      events.push({ type: "PermissionDenied", permission, at });

      if (status === "INITIALIZING") {
        if (!canTransition("INITIALIZING", "PERMISSION_DENIED")) {
          return fail("INVALID_TRANSITION");
        }
        status = "PERMISSION_DENIED";
      } else if (status === "READY" || status === "PAUSED") {
        if (!canTransition(status, "FAILED")) {
          return fail("INVALID_TRANSITION");
        }
        status = "FAILED";
        lastErrorCode = "PERMISSION_REQUIRED";
        events.push({ type: "ControllerFailed", code: "PERMISSION_REQUIRED", at });
      } else if (status !== "PERMISSION_DENIED" && status !== "FAILED") {
        return fail("INVALID_TRANSITION");
      }

      return this.commit(
        {
          ...this.state,
          status,
          permission,
          lastErrorCode,
          updatedAt: at,
        },
        events,
      );
    }

    // UNKNOWN — reset probe only while not operating
    if (permission === "UNKNOWN") {
      if (status === "READY" || status === "PAUSED") {
        return fail("INVALID_TRANSITION");
      }
      return this.commit(
        {
          ...this.state,
          permission: "UNKNOWN",
          updatedAt: at,
        },
        [],
      );
    }

    return fail("INVALID_TRANSITION");
  }

  /** Attach exactly one CameraSession (by id). */
  attachSession(session: Pick<CameraSession, "sessionId" | "flashMode" | "activeCamera">): CameraControllerResult {
    if (this.state.status === "STOPPED") {
      return fail("CONTROLLER_STOPPED");
    }
    if (this.state.status === "FAILED") {
      return fail("CONTROLLER_FAILED");
    }
    if (!session.sessionId) {
      return fail("NO_SESSION");
    }
    if (
      this.state.attachedSessionId !== null &&
      this.state.attachedSessionId !== session.sessionId
    ) {
      return fail("SESSION_ALREADY_ATTACHED");
    }

    return this.commit(
      {
        ...this.state,
        attachedSessionId: session.sessionId,
        flashMode: session.flashMode,
        activeCamera: session.activeCamera,
        updatedAt: now(),
      },
      [],
    );
  }

  /** Detach session — controller remains; session id cleared. */
  detachSession(): CameraControllerResult {
    if (this.state.attachedSessionId === null) {
      return fail("NO_SESSION");
    }
    return this.commit(
      {
        ...this.state,
        attachedSessionId: null,
        updatedAt: now(),
      },
      [],
    );
  }

  /**
   * Session disappeared / cancelled externally.
   * Fail closed → STOPPED. Does not mutate Session Engine.
   */
  notifySessionLost(sessionId?: string): CameraControllerResult {
    if (this.state.attachedSessionId === null) {
      return fail("NO_SESSION");
    }
    if (sessionId && sessionId !== this.state.attachedSessionId) {
      return fail("SESSION_MISMATCH");
    }
    return this.stopInternal();
  }

  setActiveCamera(activeCamera: CameraFacing): CameraControllerResult {
    const guard = this.requireGrantedOperational();
    if (guard) return guard;
    if (activeCamera !== "back" && activeCamera !== "front") {
      return fail("INVALID_CAMERA");
    }
    if (this.state.activeCamera === activeCamera) {
      return succeed(this.getSnapshot(), []);
    }
    const at = now();
    return this.commit(
      {
        ...this.state,
        activeCamera,
        updatedAt: at,
      },
      [{ type: "CameraChanged", activeCamera, at }],
    );
  }

  switchCamera(): CameraControllerResult {
    const next: CameraFacing = this.state.activeCamera === "back" ? "front" : "back";
    return this.setActiveCamera(next);
  }

  setFlashMode(flashMode: CameraFlashMode): CameraControllerResult {
    const guard = this.requireGrantedOperational();
    if (guard) return guard;
    if (!CAMERA_FLASH_CYCLE.includes(flashMode)) {
      return fail("INVALID_FLASH");
    }
    if (this.state.flashMode === flashMode) {
      return succeed(this.getSnapshot(), []);
    }
    const at = now();
    return this.commit(
      {
        ...this.state,
        flashMode,
        updatedAt: at,
      },
      [{ type: "FlashChanged", flashMode, at }],
    );
  }

  /** Cycle OFF → AUTO → ON → OFF */
  cycleFlashMode(): CameraControllerResult {
    const index = CAMERA_FLASH_CYCLE.indexOf(this.state.flashMode);
    const next = CAMERA_FLASH_CYCLE[(index + 1) % CAMERA_FLASH_CYCLE.length]!;
    return this.setFlashMode(next);
  }

  pause(): CameraControllerResult {
    if (this.state.permission !== "GRANTED") {
      return fail("PERMISSION_REQUIRED");
    }
    if (!canTransition(this.state.status, "PAUSED")) {
      return fail("INVALID_TRANSITION");
    }
    const at = now();
    return this.commit(
      {
        ...this.state,
        status: "PAUSED",
        updatedAt: at,
      },
      [{ type: "ControllerPaused", at }],
    );
  }

  resume(): CameraControllerResult {
    if (this.state.permission !== "GRANTED") {
      return fail("PERMISSION_REQUIRED");
    }
    if (!canTransition(this.state.status, "READY")) {
      return fail("INVALID_TRANSITION");
    }
    if (this.state.status !== "PAUSED") {
      return fail("INVALID_TRANSITION");
    }
    const at = now();
    return this.commit(
      {
        ...this.state,
        status: "READY",
        updatedAt: at,
      },
      [{ type: "ControllerResumed", at }],
    );
  }

  /** Explicit stop — clears session attachment. */
  stop(): CameraControllerResult {
    return this.stopInternal();
  }

  /** Unexpected interruption — prefer PAUSED when possible, else FAILED. */
  notifyInterruption(): CameraControllerResult {
    if (this.state.status === "READY") {
      return this.pause();
    }
    if (this.state.status === "PAUSED") {
      return succeed(this.getSnapshot(), []);
    }
    if (this.state.status === "STOPPED" || this.state.status === "UNINITIALIZED") {
      return fail("INVALID_TRANSITION");
    }
    return this.failController("INVALID_TRANSITION");
  }

  /** Recovery after interruption while PAUSED and permission still granted. */
  recover(): CameraControllerResult {
    if (this.state.status === "PAUSED") {
      return this.resume();
    }
    if (this.state.status === "FAILED" || this.state.status === "PERMISSION_DENIED") {
      return this.initialize();
    }
    if (this.state.status === "STOPPED") {
      return this.initialize();
    }
    return fail("INVALID_TRANSITION");
  }

  private requireGrantedOperational(): CameraControllerResult | null {
    if (this.state.status === "STOPPED") {
      return fail("CONTROLLER_STOPPED");
    }
    if (this.state.status === "FAILED") {
      return fail("CONTROLLER_FAILED");
    }
    if (this.state.permission !== "GRANTED") {
      return fail("PERMISSION_REQUIRED");
    }
    if (this.state.status !== "READY" && this.state.status !== "PAUSED") {
      return fail("INVALID_TRANSITION");
    }
    return null;
  }

  private failController(code: CameraControllerErrorCode): CameraControllerResult {
    if (!canTransition(this.state.status, "FAILED")) {
      return fail("INVALID_TRANSITION");
    }
    const at = now();
    return this.commit(
      {
        ...this.state,
        status: "FAILED",
        lastErrorCode: code,
        updatedAt: at,
      },
      [{ type: "ControllerFailed", code, at }],
    );
  }

  private stopInternal(): CameraControllerResult {
    if (this.state.status === "STOPPED") {
      return succeed(this.getSnapshot(), []);
    }
    if (this.state.status === "UNINITIALIZED") {
      return fail("INVALID_TRANSITION");
    }
    if (!canTransition(this.state.status, "STOPPED")) {
      return fail("INVALID_TRANSITION");
    }
    const at = now();
    return this.commit(
      {
        ...this.state,
        status: "STOPPED",
        attachedSessionId: null,
        updatedAt: at,
      },
      [{ type: "ControllerStopped", at }],
    );
  }

  private commit(
    state: CameraControllerState,
    events: readonly CameraControllerEvent[],
  ): CameraControllerResult {
    this.state = { ...state };
    for (const event of events) {
      this.emit(event);
    }
    return succeed({ ...this.state }, events);
  }

  private emit(event: CameraControllerEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export function createSmartMultiCameraController(): SmartMultiCameraController {
  return new SmartMultiCameraController();
}

export function isCameraControllerTransitionAllowed(
  from: CameraControllerStatus,
  to: CameraControllerStatus,
): boolean {
  return canTransition(from, to);
}
