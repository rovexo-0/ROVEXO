/**
 * ROVEXO Smart Multi Camera Session — Capture Coordinator types v1.0
 *
 * PHASE III · COD SÂNGE · Logic only — no hardware · no UI · no capture bytes.
 */

export type CaptureCoordinatorStatus =
  | "IDLE"
  | "AWAITING_HOST"
  | "FAILED";

export type CaptureCoordinatorState = {
  status: CaptureCoordinatorStatus;
  lockHeld: boolean;
  pendingRequestId: string | null;
  lastRejectReason: CaptureRejectReason | null;
  lastErrorCode: CaptureCoordinatorErrorCode | null;
  updatedAt: number;
};

export type CaptureRejectReason =
  | "SESSION_NOT_READY"
  | "CONTROLLER_NOT_READY"
  | "PERMISSION_DENIED"
  | "CAPACITY_REACHED"
  | "LOCK_HELD"
  | "NO_PENDING_REQUEST"
  | "HOST_REJECTED"
  | "SESSION_CAPTURE_FAILED"
  | "INVALID_PAYLOAD";

export type CaptureCoordinatorErrorCode =
  | "INVALID_TRANSITION"
  | "SESSION_NOT_READY"
  | "CONTROLLER_NOT_READY"
  | "PERMISSION_REQUIRED"
  | "CAPACITY_REACHED"
  | "CAPTURE_LOCK_HELD"
  | "NO_PENDING_CAPTURE"
  | "COORDINATOR_FAILED"
  | "INVALID_CAPTURE";

export type CaptureCoordinatorEventType =
  | "CaptureRequested"
  | "CaptureAccepted"
  | "CaptureRejected"
  | "CaptureCancelled"
  | "CaptureLockAcquired"
  | "CaptureLockReleased"
  | "CoordinatorFailed";

export type CaptureCoordinatorEvent =
  | { type: "CaptureRequested"; requestId: string; at: number }
  | { type: "CaptureAccepted"; requestId: string; photoId: string; at: number }
  | {
      type: "CaptureRejected";
      requestId: string | null;
      reason: CaptureRejectReason;
      at: number;
    }
  | { type: "CaptureCancelled"; requestId: string; at: number }
  | { type: "CaptureLockAcquired"; requestId: string; at: number }
  | { type: "CaptureLockReleased"; requestId: string | null; at: number }
  | { type: "CoordinatorFailed"; code: CaptureCoordinatorErrorCode; at: number };

export type CaptureCoordinatorFailure = {
  ok: false;
  code: CaptureCoordinatorErrorCode;
  message: string;
};

export type CaptureCoordinatorSuccess = {
  ok: true;
  state: CaptureCoordinatorState;
  events: readonly CaptureCoordinatorEvent[];
};

export type CaptureCoordinatorResult =
  | CaptureCoordinatorSuccess
  | CaptureCoordinatorFailure;
