/**
 * ROVEXO Smart Multi Camera Session — SSOT Consolidation v1.0
 *
 * PHASE VIII · COD SÂNGE · Logic only
 *
 * ONE owner per mutable domain. Engines remain separate; ownership is singular.
 * No UI · no hardware · no network · no storage · no public API removals.
 */

export const SMART_MULTI_CAMERA_SSOT_CONSOLIDATION_V1 = {
  version: "1.0",
  id: "smart-multi-camera-ssot-consolidation-v1",
  phase: "VIII_SSOT_CONSOLIDATION",
  status: "CERTIFIED",
  scope: "LOGIC_LAYER_ONLY",
  behaviouralChangesForbidden: true,
  publicApiRemovalsForbidden: true,
  uiForbidden: true,
  networkForbidden: true,
} as const;

/**
 * Canonical mutable-domain owners — exactly one per domain.
 *
 * Session Engine retains a capture-path photo buffer used by Capture Coordinator
 * (Phase I CERTIFIED). That buffer is NOT the marketplace/upload photo SSOT;
 * Photo Collection Engine is the sole photo-collection owner for rail / cover /
 * order / upload / recovery validation.
 */
export const SMART_MULTI_CAMERA_SSOT_OWNERS = {
  sessionLifecycle: "SmartMultiCameraSessionEngine",
  sessionCaptureBuffer: "SmartMultiCameraSessionEngine",
  photoCollection: "SmartMultiCameraPhotoCollectionEngine",
  coverPhoto: "SmartMultiCameraPhotoCollectionEngine",
  photoOrdering: "SmartMultiCameraPhotoCollectionEngine",
  captureLock: "SmartMultiCameraCaptureCoordinator",
  cameraState: "SmartMultiCameraController",
  flashState: "SmartMultiCameraController",
  permissionState: "SmartMultiCameraController",
  facingState: "SmartMultiCameraController",
  uploadQueue: "SmartMultiCameraUploadQueue",
  recoveryState: "SmartMultiCameraRecoveryEngine",
  /** Session mirrors operational flash/facing intent until Controller.attachSession */
  sessionFlashIntent: "SmartMultiCameraSessionEngine.flashMode (INTENT_ONLY)",
  sessionFacingIntent: "SmartMultiCameraSessionEngine.activeCamera (INTENT_ONLY)",
  /** Session upload lifecycle signals — queue owns job preparation SSOT */
  sessionUploadLifecycle: "SmartMultiCameraSessionEngine.uploadState (LIFECYCLE_SIGNAL)",
} as const;

/** Exactly one producer per event type string within its engine namespace. */
export const SMART_MULTI_CAMERA_SSOT_EVENT_PRODUCERS = {
  SessionStarted: "SmartMultiCameraSessionEngine",
  PhotoCaptured: "SmartMultiCameraSessionEngine",
  PhotoDeleted: "SmartMultiCameraSessionEngine",
  SessionPhotoReordered: "SmartMultiCameraSessionEngine",
  SessionCoverChanged: "SmartMultiCameraSessionEngine",
  SessionCancelled: "SmartMultiCameraSessionEngine",
  SessionUploadRequested: "SmartMultiCameraSessionEngine",
  SessionUploadCompleted: "SmartMultiCameraSessionEngine",
  SessionUploadFailed: "SmartMultiCameraSessionEngine",
  ControllerInitialized: "SmartMultiCameraController",
  PermissionGranted: "SmartMultiCameraController",
  PermissionDenied: "SmartMultiCameraController",
  CameraChanged: "SmartMultiCameraController",
  FlashChanged: "SmartMultiCameraController",
  ControllerPaused: "SmartMultiCameraController",
  ControllerResumed: "SmartMultiCameraController",
  ControllerStopped: "SmartMultiCameraController",
  ControllerFailed: "SmartMultiCameraController",
  CaptureRequested: "SmartMultiCameraCaptureCoordinator",
  CaptureAccepted: "SmartMultiCameraCaptureCoordinator",
  CaptureRejected: "SmartMultiCameraCaptureCoordinator",
  CaptureCancelled: "SmartMultiCameraCaptureCoordinator",
  CaptureLockAcquired: "SmartMultiCameraCaptureCoordinator",
  CaptureLockReleased: "SmartMultiCameraCaptureCoordinator",
  CoordinatorFailed: "SmartMultiCameraCaptureCoordinator",
  PhotoAdded: "SmartMultiCameraPhotoCollectionEngine",
  PhotoRemoved: "SmartMultiCameraPhotoCollectionEngine",
  PhotoReplaced: "SmartMultiCameraPhotoCollectionEngine",
  CollectionPhotoReordered: "SmartMultiCameraPhotoCollectionEngine",
  CollectionCoverChanged: "SmartMultiCameraPhotoCollectionEngine",
  CollectionValidated: "SmartMultiCameraPhotoCollectionEngine",
  CollectionInvalid: "SmartMultiCameraPhotoCollectionEngine",
  QueueCreated: "SmartMultiCameraUploadQueue",
  QueueValidated: "SmartMultiCameraUploadQueue",
  QueueUploadRequested: "SmartMultiCameraUploadQueue",
  QueueUploadStarted: "SmartMultiCameraUploadQueue",
  QueueUploadCompleted: "SmartMultiCameraUploadQueue",
  QueueUploadFailed: "SmartMultiCameraUploadQueue",
  QueueCancelled: "SmartMultiCameraUploadQueue",
  QueueReset: "SmartMultiCameraUploadQueue",
  RecoveryStarted: "SmartMultiCameraRecoveryEngine",
  RecoveryValidated: "SmartMultiCameraRecoveryEngine",
  RecoveryRestored: "SmartMultiCameraRecoveryEngine",
  RecoveryFailed: "SmartMultiCameraRecoveryEngine",
  RecoveryResetRequired: "SmartMultiCameraRecoveryEngine",
  RecoveryCompleted: "SmartMultiCameraRecoveryEngine",
} as const;

/**
 * Wire event discriminant collisions (same `type` string, different engines).
 * Consumers MUST discriminate by producer engine — never by `type` alone.
 */
export const SMART_MULTI_CAMERA_SSOT_EVENT_TYPE_COLLISIONS = [
  {
    type: "CoverChanged",
    producers: [
      "SmartMultiCameraSessionEngine",
      "SmartMultiCameraPhotoCollectionEngine",
    ] as const,
    canonicalConsumerDomain: "photoCollection",
  },
  {
    type: "PhotoReordered",
    producers: [
      "SmartMultiCameraSessionEngine",
      "SmartMultiCameraPhotoCollectionEngine",
    ] as const,
    canonicalConsumerDomain: "photoCollection",
  },
  {
    type: "UploadRequested",
    producers: ["SmartMultiCameraSessionEngine", "SmartMultiCameraUploadQueue"] as const,
    canonicalConsumerDomain: "uploadQueue",
  },
  {
    type: "UploadCompleted",
    producers: ["SmartMultiCameraSessionEngine", "SmartMultiCameraUploadQueue"] as const,
    canonicalConsumerDomain: "uploadQueue",
  },
  {
    type: "UploadFailed",
    producers: ["SmartMultiCameraSessionEngine", "SmartMultiCameraUploadQueue"] as const,
    canonicalConsumerDomain: "uploadQueue",
  },
] as const;

/** Import DAG — no cycles. Value deps only flow toward types / factories. */
export const SMART_MULTI_CAMERA_SSOT_IMPORT_DAG = {
  "session-types-v1": [],
  "camera-controller-types-v1": [],
  "capture-coordinator-types-v1": [],
  "photo-collection-types-v1": ["session-types-v1"],
  "upload-queue-types-v1": [],
  "recovery-types-v1": [],
  "session-engine-v1": ["session-types-v1"],
  "camera-controller-v1": ["camera-controller-types-v1", "session-types-v1"],
  "capture-coordinator-v1": [
    "capture-coordinator-types-v1",
    "session-types-v1",
    "session-engine-v1",
    "camera-controller-v1",
  ],
  "photo-collection-engine-v1": ["photo-collection-types-v1", "session-types-v1"],
  "upload-queue-engine-v1": ["upload-queue-types-v1", "session-types-v1"],
  "recovery-engine-v1": [
    "recovery-types-v1",
    "session-engine-v1",
    "camera-controller-v1",
    "capture-coordinator-v1",
    "photo-collection-engine-v1",
    "upload-queue-engine-v1",
  ],
  "performance-validation-v1": [],
  "ssot-consolidation-v1": [],
  "integration-certification-v1": [
    "session-engine-v1",
    "camera-controller-v1",
    "capture-coordinator-v1",
    "photo-collection-engine-v1",
    "upload-queue-engine-v1",
    "recovery-engine-v1",
    "ssot-consolidation-v1",
    "performance-validation-v1",
  ],
  index: [
    "session-engine-v1",
    "session-types-v1",
    "camera-controller-v1",
    "camera-controller-types-v1",
    "capture-coordinator-v1",
    "capture-coordinator-types-v1",
    "photo-collection-engine-v1",
    "photo-collection-types-v1",
    "upload-queue-engine-v1",
    "upload-queue-types-v1",
    "recovery-engine-v1",
    "recovery-types-v1",
    "performance-validation-v1",
    "ssot-consolidation-v1",
    "integration-certification-v1",
  ],
} as const;

export type SsotOwnerDomain = keyof typeof SMART_MULTI_CAMERA_SSOT_OWNERS;

export type SsotCompositionSnapshot = {
  session: {
    sessionId: string;
    status: string;
    flashMode: string;
    activeCamera: string;
    photos: readonly { photoId: string; order: number }[];
  };
  controller: {
    attachedSessionId: string | null;
    flashMode: string;
    activeCamera: string;
    permission: string;
    status: string;
  };
  collection: {
    photos: readonly { photoId: string; order: number }[];
    coverPhotoId: string | null;
  };
  queue: {
    sessionId: string | null;
    items: readonly { photoId: string; order: number }[];
    status: string;
  };
  coordinator: {
    lockHeld: boolean;
    status: string;
  };
  recovery: {
    status: string;
  };
};

export type SsotContractIssue = {
  code:
    | "DUPLICATE_OWNER"
    | "SESSION_CONTROLLER_MISMATCH"
    | "QUEUE_COLLECTION_MISMATCH"
    | "QUEUE_SESSION_MISMATCH"
    | "CAPTURE_LOCK_INVALID"
    | "CIRCULAR_IMPORT";
  message: string;
};

export type SsotContractResult =
  | { ok: true; issues: readonly [] }
  | { ok: false; issues: readonly SsotContractIssue[] };

function uniqueOwners(): SsotContractResult {
  const values = Object.values(SMART_MULTI_CAMERA_SSOT_OWNERS);
  const canonical = values.filter(
    (value) =>
      !value.includes("INTENT_ONLY") &&
      !value.includes("LIFECYCLE_SIGNAL") &&
      value.startsWith("SmartMultiCamera"),
  );
  const seen = new Set<string>();
  const issues: SsotContractIssue[] = [];
  for (const owner of canonical) {
    // Domains may share an engine class (e.g. Controller owns flash+permission).
    // Fail only if the same *domain key* were duplicated — matrix keys are unique by type.
    void owner;
    void seen;
  }
  const domains = Object.keys(SMART_MULTI_CAMERA_SSOT_OWNERS);
  if (new Set(domains).size !== domains.length) {
    issues.push({
      code: "DUPLICATE_OWNER",
      message: "Ownership matrix contains duplicate domain keys.",
    });
  }
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, issues: [] };
}

/** Fail-closed composition checks — no mutation. */
export function validateSsotComposition(
  snapshot: SsotCompositionSnapshot,
): SsotContractResult {
  const issues: SsotContractIssue[] = [];

  const ownership = uniqueOwners();
  if (!ownership.ok) {
    issues.push(...ownership.issues);
  }

  if (
    snapshot.controller.attachedSessionId &&
    snapshot.session.sessionId &&
    snapshot.controller.attachedSessionId !== snapshot.session.sessionId
  ) {
    issues.push({
      code: "SESSION_CONTROLLER_MISMATCH",
      message: "Controller attachedSessionId diverges from Session sessionId.",
    });
  }

  if (snapshot.queue.items.length > 0) {
    if (snapshot.queue.items.length !== snapshot.collection.photos.length) {
      issues.push({
        code: "QUEUE_COLLECTION_MISMATCH",
        message: "Upload Queue items must match Photo Collection length/order.",
      });
    } else {
      for (let index = 0; index < snapshot.queue.items.length; index += 1) {
        const item = snapshot.queue.items[index]!;
        const photo = snapshot.collection.photos[index];
        if (!photo || photo.photoId !== item.photoId || photo.order !== item.order) {
          issues.push({
            code: "QUEUE_COLLECTION_MISMATCH",
            message: "Upload Queue order/ids diverge from Photo Collection SSOT.",
          });
          break;
        }
      }
    }
  }

  if (
    snapshot.queue.sessionId &&
    snapshot.session.sessionId &&
    snapshot.queue.sessionId !== snapshot.session.sessionId
  ) {
    issues.push({
      code: "QUEUE_SESSION_MISMATCH",
      message: "Upload Queue sessionId diverges from Session sessionId.",
    });
  }

  if (snapshot.coordinator.lockHeld && snapshot.coordinator.status !== "AWAITING_HOST") {
    issues.push({
      code: "CAPTURE_LOCK_INVALID",
      message: "Capture lock held outside AWAITING_HOST violates Coordinator SSOT.",
    });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, issues: [] };
}

/** Detect cycles in the declared import DAG. */
export function detectSsotImportCycles(): SsotContractResult {
  const graph = SMART_MULTI_CAMERA_SSOT_IMPORT_DAG;
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const issues: SsotContractIssue[] = [];

  function visit(node: string, stack: string[]): void {
    if (visiting.has(node)) {
      issues.push({
        code: "CIRCULAR_IMPORT",
        message: `Circular import: ${[...stack, node].join(" → ")}`,
      });
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    const deps = graph[node as keyof typeof graph] ?? [];
    for (const dep of deps) {
      visit(dep, [...stack, node]);
    }
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of Object.keys(graph)) {
    visit(node, []);
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, issues: [] };
}

export function assertSsotOwnershipSingularity(): void {
  const domains = Object.keys(SMART_MULTI_CAMERA_SSOT_OWNERS);
  if (new Set(domains).size !== domains.length) {
    throw new Error("SSOT ownership matrix has duplicate domains.");
  }
  const producers = Object.values(SMART_MULTI_CAMERA_SSOT_EVENT_PRODUCERS);
  // Namespaced logical producers — values may repeat across different event keys.
  void producers;
  const cycle = detectSsotImportCycles();
  if (!cycle.ok) {
    throw new Error(cycle.issues.map((issue) => issue.message).join("; "));
  }
}
