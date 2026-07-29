/**
 * ROVEXO Smart Multi Camera Session — Camera Controller types v1.0
 *
 * PHASE II · COD SÂNGE · Logic only — platform-agnostic · no hardware · no UI.
 */

export type CameraControllerStatus =
  | "UNINITIALIZED"
  | "INITIALIZING"
  | "READY"
  | "PAUSED"
  | "STOPPED"
  | "FAILED"
  | "PERMISSION_DENIED";

export type CameraFacing = "back" | "front";

export type CameraFlashMode = "off" | "auto" | "on";

export type CameraPermissionState =
  | "UNKNOWN"
  | "CHECKING"
  | "GRANTED"
  | "DENIED"
  | "BLOCKED";

export type CameraControllerState = {
  status: CameraControllerStatus;
  permission: CameraPermissionState;
  activeCamera: CameraFacing;
  flashMode: CameraFlashMode;
  attachedSessionId: string | null;
  lastErrorCode: CameraControllerErrorCode | null;
  updatedAt: number;
};

export type CameraControllerEventType =
  | "ControllerInitialized"
  | "PermissionGranted"
  | "PermissionDenied"
  | "CameraChanged"
  | "FlashChanged"
  | "ControllerPaused"
  | "ControllerResumed"
  | "ControllerStopped"
  | "ControllerFailed";

export type CameraControllerEvent =
  | { type: "ControllerInitialized"; at: number }
  | { type: "PermissionGranted"; at: number }
  | { type: "PermissionDenied"; permission: "DENIED" | "BLOCKED"; at: number }
  | { type: "CameraChanged"; activeCamera: CameraFacing; at: number }
  | { type: "FlashChanged"; flashMode: CameraFlashMode; at: number }
  | { type: "ControllerPaused"; at: number }
  | { type: "ControllerResumed"; at: number }
  | { type: "ControllerStopped"; at: number }
  | { type: "ControllerFailed"; code: CameraControllerErrorCode; at: number };

export type CameraControllerErrorCode =
  | "INVALID_TRANSITION"
  | "PERMISSION_REQUIRED"
  | "NO_SESSION"
  | "SESSION_ALREADY_ATTACHED"
  | "SESSION_MISMATCH"
  | "CONTROLLER_STOPPED"
  | "CONTROLLER_FAILED"
  | "INVALID_FLASH"
  | "INVALID_CAMERA";

export type CameraControllerFailure = {
  ok: false;
  code: CameraControllerErrorCode;
  message: string;
};

export type CameraControllerSuccess = {
  ok: true;
  state: CameraControllerState;
  events: readonly CameraControllerEvent[];
};

export type CameraControllerResult = CameraControllerSuccess | CameraControllerFailure;

export const CAMERA_FLASH_CYCLE: readonly CameraFlashMode[] = ["off", "auto", "on"] as const;
