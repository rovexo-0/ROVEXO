/**
 * Smart Multi Camera Session — Phase I–IX public surface.
 *
 * Phase I–IX: CERTIFIED logic / SSOT / integration
 * UI / hardware / network / pipeline remain gated.
 */

export {
  SMART_MULTI_CAMERA_SESSION_ENGINE_V1,
  SmartMultiCameraSessionEngine,
  createSmartMultiCameraSessionEngine,
  isSessionTransitionAllowed,
} from "@/lib/media/smart-multi-camera-session/session-engine-v1";

export {
  SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS,
  SMART_MULTI_CAMERA_SESSION_MIN_PHOTOS_FOR_UPLOAD,
  type ActiveCamera,
  type CameraSession,
  type CameraSessionStatus,
  type CapturePhotoInput,
  type FlashMode,
  type SessionEngineErrorCode,
  type SessionEngineFailure,
  type SessionEngineResult,
  type SessionEngineSuccess,
  type SessionEvent,
  type SessionEventType,
  type SessionPhoto,
  type SessionPhotoState,
  type SessionUploadState,
} from "@/lib/media/smart-multi-camera-session/session-types-v1";

export {
  SMART_MULTI_CAMERA_CONTROLLER_V1,
  SmartMultiCameraController,
  createSmartMultiCameraController,
  isCameraControllerTransitionAllowed,
} from "@/lib/media/smart-multi-camera-session/camera-controller-v1";

export {
  CAMERA_FLASH_CYCLE,
  type CameraControllerErrorCode,
  type CameraControllerEvent,
  type CameraControllerEventType,
  type CameraControllerFailure,
  type CameraControllerResult,
  type CameraControllerState,
  type CameraControllerStatus,
  type CameraControllerSuccess,
  type CameraFacing,
  type CameraFlashMode,
  type CameraPermissionState,
} from "@/lib/media/smart-multi-camera-session/camera-controller-types-v1";

export {
  SMART_MULTI_CAMERA_CAPTURE_COORDINATOR_V1,
  SmartMultiCameraCaptureCoordinator,
  createSmartMultiCameraCaptureCoordinator,
  type CaptureCoordinatorDeps,
} from "@/lib/media/smart-multi-camera-session/capture-coordinator-v1";

export type {
  CaptureCoordinatorErrorCode,
  CaptureCoordinatorEvent,
  CaptureCoordinatorEventType,
  CaptureCoordinatorFailure,
  CaptureCoordinatorResult,
  CaptureCoordinatorState,
  CaptureCoordinatorStatus,
  CaptureCoordinatorSuccess,
  CaptureRejectReason,
} from "@/lib/media/smart-multi-camera-session/capture-coordinator-types-v1";

export {
  SMART_MULTI_CAMERA_PHOTO_COLLECTION_ENGINE_V1,
  SmartMultiCameraPhotoCollectionEngine,
  createSmartMultiCameraPhotoCollectionEngine,
} from "@/lib/media/smart-multi-camera-session/photo-collection-engine-v1";

export type {
  AddCollectionPhotoInput,
  CollectionPhoto,
  PhotoCollectionErrorCode,
  PhotoCollectionEvent,
  PhotoCollectionEventType,
  PhotoCollectionFailure,
  PhotoCollectionResult,
  PhotoCollectionState,
  PhotoCollectionSuccess,
  ReplaceCollectionPhotoInput,
} from "@/lib/media/smart-multi-camera-session/photo-collection-types-v1";

export {
  SMART_MULTI_CAMERA_UPLOAD_QUEUE_V1,
  SmartMultiCameraUploadQueue,
  createSmartMultiCameraUploadQueue,
  isUploadQueueTransitionAllowed,
} from "@/lib/media/smart-multi-camera-session/upload-queue-engine-v1";

export type {
  CreateUploadQueueInput,
  CreateUploadQueueItemInput,
  UploadQueueErrorCode,
  UploadQueueEvent,
  UploadQueueEventType,
  UploadQueueFailure,
  UploadQueueItem,
  UploadQueueResult,
  UploadQueueState,
  UploadQueueStatus,
  UploadQueueSuccess,
} from "@/lib/media/smart-multi-camera-session/upload-queue-types-v1";

export {
  SMART_MULTI_CAMERA_RECOVERY_ENGINE_V1,
  SmartMultiCameraRecoveryEngine,
  createSmartMultiCameraRecoveryEngine,
  isRecoveryTransitionAllowed,
  type RecoveryEngineDeps,
} from "@/lib/media/smart-multi-camera-session/recovery-engine-v1";

export type {
  RecoveryErrorCode,
  RecoveryEvent,
  RecoveryEventType,
  RecoveryFailure,
  RecoveryFailureClass,
  RecoveryResult,
  RecoverySource,
  RecoveryState,
  RecoveryStatus,
  RecoverySuccess,
} from "@/lib/media/smart-multi-camera-session/recovery-types-v1";

export { SMART_MULTI_CAMERA_PERFORMANCE_VALIDATION_V1 } from "@/lib/media/smart-multi-camera-session/performance-validation-v1";

export {
  SMART_MULTI_CAMERA_SSOT_CONSOLIDATION_V1,
  SMART_MULTI_CAMERA_SSOT_EVENT_PRODUCERS,
  SMART_MULTI_CAMERA_SSOT_EVENT_TYPE_COLLISIONS,
  SMART_MULTI_CAMERA_SSOT_IMPORT_DAG,
  SMART_MULTI_CAMERA_SSOT_OWNERS,
  assertSsotOwnershipSingularity,
  detectSsotImportCycles,
  validateSsotComposition,
  type SsotCompositionSnapshot,
  type SsotContractIssue,
  type SsotContractResult,
  type SsotOwnerDomain,
} from "@/lib/media/smart-multi-camera-session/ssot-consolidation-v1";

export {
  SMART_MULTI_CAMERA_INTEGRATION_CERTIFICATION_V1,
  assertIntegratedModuleInvariants,
  createIntegratedSmartMultiCameraSession,
  readIntegratedSsotSnapshot,
  type IntegratedSmartMultiCameraSession,
  type IntegrationInvariantResult,
} from "@/lib/media/smart-multi-camera-session/integration-certification-v1";
