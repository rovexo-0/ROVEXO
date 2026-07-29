/**
 * ROVEXO Smart Multi Camera Session — Recovery Engine types v1.0
 *
 * PHASE VI · COD SÂNGE · Logic only — restores deterministic state · no hardware / UI / network.
 */

export type RecoverySource =
  | "APPLICATION_PAUSE"
  | "APPLICATION_RESUME"
  | "SESSION_LOST"
  | "CONTROLLER_RESTART"
  | "CAPTURE_INTERRUPTION"
  | "UPLOAD_INTERRUPTION"
  | "UNEXPECTED_RESET"
  | "INVALID_STATE"
  | "HOST_RESTART";

export type RecoveryStatus =
  | "NONE"
  | "CHECKING"
  | "RECOVERING"
  | "RESTORED"
  | "FAILED"
  | "RESET_REQUIRED";

export type RecoveryFailureClass =
  | "MISSING_SESSION"
  | "INVALID_CONTROLLER"
  | "INVALID_COLLECTION"
  | "BROKEN_QUEUE"
  | "CAPTURE_LOCK_INVALID"
  | "PERMISSION_INVALID"
  | "ORDER_MISMATCH"
  | "DUPLICATE_SESSION"
  | "INVALID_TRANSITION"
  | "UNRECOVERABLE";

export type RecoveryState = {
  status: RecoveryStatus;
  source: RecoverySource | null;
  failureClass: RecoveryFailureClass | null;
  updatedAt: number;
};

export type RecoveryErrorCode =
  | "INVALID_TRANSITION"
  | "RECOVERY_FAILED"
  | "RESET_REQUIRED"
  | "NO_RECOVERY"
  | "VALIDATION_FAILED";

export type RecoveryFailure = {
  ok: false;
  code: RecoveryErrorCode;
  message: string;
  failureClass?: RecoveryFailureClass;
};

export type RecoverySuccess = {
  ok: true;
  state: RecoveryState;
  events: readonly RecoveryEvent[];
};

export type RecoveryResult = RecoverySuccess | RecoveryFailure;

export type RecoveryEventType =
  | "RecoveryStarted"
  | "RecoveryValidated"
  | "RecoveryRestored"
  | "RecoveryFailed"
  | "RecoveryResetRequired"
  | "RecoveryCompleted";

export type RecoveryEvent =
  | { type: "RecoveryStarted"; source: RecoverySource; at: number }
  | { type: "RecoveryValidated"; source: RecoverySource; at: number }
  | { type: "RecoveryRestored"; source: RecoverySource; at: number }
  | {
      type: "RecoveryFailed";
      source: RecoverySource;
      failureClass: RecoveryFailureClass;
      at: number;
    }
  | {
      type: "RecoveryResetRequired";
      source: RecoverySource;
      failureClass: RecoveryFailureClass;
      at: number;
    }
  | { type: "RecoveryCompleted"; source: RecoverySource; at: number };
