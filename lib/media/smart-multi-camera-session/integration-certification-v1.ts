/**
 * ROVEXO Smart Multi Camera Session — Integration Certification v1.0
 *
 * PHASE IX · COD SÂNGE · Logic only
 *
 * Proves certified engines I–VIII compose as ONE canonical logic module.
 * No UI · no camera · no network · no storage · no behavioural changes.
 */

import {
  SmartMultiCameraCaptureCoordinator,
  createSmartMultiCameraCaptureCoordinator,
} from "@/lib/media/smart-multi-camera-session/capture-coordinator-v1";
import {
  SmartMultiCameraController,
  createSmartMultiCameraController,
} from "@/lib/media/smart-multi-camera-session/camera-controller-v1";
import {
  SmartMultiCameraPhotoCollectionEngine,
  createSmartMultiCameraPhotoCollectionEngine,
} from "@/lib/media/smart-multi-camera-session/photo-collection-engine-v1";
import {
  SmartMultiCameraRecoveryEngine,
  createSmartMultiCameraRecoveryEngine,
} from "@/lib/media/smart-multi-camera-session/recovery-engine-v1";
import {
  SmartMultiCameraSessionEngine,
  createSmartMultiCameraSessionEngine,
} from "@/lib/media/smart-multi-camera-session/session-engine-v1";
import {
  SmartMultiCameraUploadQueue,
  createSmartMultiCameraUploadQueue,
} from "@/lib/media/smart-multi-camera-session/upload-queue-engine-v1";
import {
  assertSsotOwnershipSingularity,
  detectSsotImportCycles,
  validateSsotComposition,
  type SsotCompositionSnapshot,
} from "@/lib/media/smart-multi-camera-session/ssot-consolidation-v1";
import { SMART_MULTI_CAMERA_PERFORMANCE_VALIDATION_V1 } from "@/lib/media/smart-multi-camera-session/performance-validation-v1";

export const SMART_MULTI_CAMERA_INTEGRATION_CERTIFICATION_V1 = {
  version: "1.0",
  id: "smart-multi-camera-integration-certification-v1",
  phase: "IX_INTEGRATION_CERTIFICATION",
  status: "CERTIFIED",
  scope: "LOGIC_LAYER_ONLY",
  behaviouralChangesForbidden: true,
  featureAdditionsForbidden: true,
  uiForbidden: true,
  cameraForbidden: true,
  networkForbidden: true,
  storageForbidden: true,
  imagePipelineForbidden: true,
  scenarios: [
    "START_CAPTURE_DELETE_REORDER_UPLOAD_RECOVERY_COMPLETE",
    "PERMISSION_DENIED_RECOVERY_RETRY_CAPTURE_CANCEL",
    "MAX_PHOTOS_DELETE_COVER_QUEUE_RECOVERY",
    "CONTROLLER_RESTART_SESSION_QUEUE_RECOVERY",
    "INVALID_CONTRACTS_RESET_REQUIRED_FAIL_CLOSED",
  ] as const,
  invariants: [
    "EXACTLY_ONE_SESSION",
    "EXACTLY_ONE_CONTROLLER",
    "EXACTLY_ONE_COLLECTION",
    "EXACTLY_ONE_QUEUE",
    "EXACTLY_ONE_RECOVERY_FSM",
    "EXACTLY_ONE_CAPTURE_LOCK",
    "EXACTLY_ONE_EVENT_PRODUCER_PER_SOURCE",
  ] as const,
  certifiedPhases: [
    "I_SESSION_ENGINE",
    "II_CAMERA_CONTROLLER",
    "III_CAPTURE_COORDINATOR",
    "IV_PHOTO_COLLECTION_ENGINE",
    "V_UPLOAD_QUEUE",
    "VI_RECOVERY_ENGINE",
    "VII_PERFORMANCE_VALIDATION",
    "VIII_SSOT_CONSOLIDATION",
  ] as const,
} as const;

export type IntegratedSmartMultiCameraSession = {
  sessionEngine: SmartMultiCameraSessionEngine;
  cameraController: SmartMultiCameraController;
  captureCoordinator: SmartMultiCameraCaptureCoordinator;
  photoCollection: SmartMultiCameraPhotoCollectionEngine;
  uploadQueue: SmartMultiCameraUploadQueue;
  recovery: SmartMultiCameraRecoveryEngine;
};

/** ONE composition factory — one instance of each certified engine. */
export function createIntegratedSmartMultiCameraSession(): IntegratedSmartMultiCameraSession {
  const sessionEngine = createSmartMultiCameraSessionEngine();
  const cameraController = createSmartMultiCameraController();
  const photoCollection = createSmartMultiCameraPhotoCollectionEngine();
  const uploadQueue = createSmartMultiCameraUploadQueue();
  const captureCoordinator = createSmartMultiCameraCaptureCoordinator({
    sessionEngine,
    cameraController,
  });
  const recovery = createSmartMultiCameraRecoveryEngine({
    sessionEngine,
    cameraController,
    captureCoordinator,
    photoCollection,
    uploadQueue,
  });
  return {
    sessionEngine,
    cameraController,
    captureCoordinator,
    photoCollection,
    uploadQueue,
    recovery,
  };
}

export function readIntegratedSsotSnapshot(
  module: IntegratedSmartMultiCameraSession,
): SsotCompositionSnapshot {
  const session = module.sessionEngine.getSnapshot();
  const controller = module.cameraController.getSnapshot();
  const collection = module.photoCollection.getSnapshot();
  const queue = module.uploadQueue.getSnapshot();
  const coordinator = module.captureCoordinator.getSnapshot();
  const recovery = module.recovery.getSnapshot();
  return {
    session: {
      sessionId: session.sessionId,
      status: session.status,
      flashMode: session.flashMode,
      activeCamera: session.activeCamera,
      photos: session.photos,
    },
    controller: {
      attachedSessionId: controller.attachedSessionId,
      flashMode: controller.flashMode,
      activeCamera: controller.activeCamera,
      permission: controller.permission,
      status: controller.status,
    },
    collection: {
      photos: collection.photos,
      coverPhotoId: collection.coverPhotoId,
    },
    queue: {
      sessionId: queue.sessionId,
      items: queue.items,
      status: queue.status,
    },
    coordinator: {
      lockHeld: coordinator.lockHeld,
      status: coordinator.status,
    },
    recovery: { status: recovery.status },
  };
}

export type IntegrationInvariantResult =
  | { ok: true }
  | { ok: false; violations: readonly string[] };

/** Fail-closed singularity + SSOT + import DAG checks. */
export function assertIntegratedModuleInvariants(
  module: IntegratedSmartMultiCameraSession,
): IntegrationInvariantResult {
  const violations: string[] = [];

  if (!(module.sessionEngine instanceof SmartMultiCameraSessionEngine)) {
    violations.push("Missing Session Engine");
  }
  if (!(module.cameraController instanceof SmartMultiCameraController)) {
    violations.push("Missing Camera Controller");
  }
  if (!(module.captureCoordinator instanceof SmartMultiCameraCaptureCoordinator)) {
    violations.push("Missing Capture Coordinator");
  }
  if (!(module.photoCollection instanceof SmartMultiCameraPhotoCollectionEngine)) {
    violations.push("Missing Photo Collection");
  }
  if (!(module.uploadQueue instanceof SmartMultiCameraUploadQueue)) {
    violations.push("Missing Upload Queue");
  }
  if (!(module.recovery instanceof SmartMultiCameraRecoveryEngine)) {
    violations.push("Missing Recovery Engine");
  }

  try {
    assertSsotOwnershipSingularity();
  } catch (error) {
    violations.push(
      error instanceof Error ? error.message : "SSOT ownership singularity failed",
    );
  }

  const cycles = detectSsotImportCycles();
  if (!cycles.ok) {
    for (const issue of cycles.issues) {
      violations.push(issue.message);
    }
  }

  if (SMART_MULTI_CAMERA_PERFORMANCE_VALIDATION_V1.status !== "CERTIFIED") {
    violations.push("Performance Validation is not CERTIFIED");
  }

  const composition = validateSsotComposition(readIntegratedSsotSnapshot(module));
  if (!composition.ok) {
    for (const issue of composition.issues) {
      violations.push(`${issue.code}: ${issue.message}`);
    }
  }

  if (violations.length > 0) {
    return { ok: false, violations };
  }
  return { ok: true };
}
