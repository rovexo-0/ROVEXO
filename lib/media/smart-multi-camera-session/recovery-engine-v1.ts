/**
 * ROVEXO Smart Multi Camera Session — Recovery Engine v1.0
 *
 * PHASE VI · COD SÂNGE · ONE implementation · Logic only
 *
 * Restores deterministic state after interruptions.
 * NEVER captures · NEVER uploads · NEVER invents photo data · NEVER renders UI.
 */

import type { SmartMultiCameraCaptureCoordinator } from "@/lib/media/smart-multi-camera-session/capture-coordinator-v1";
import type { SmartMultiCameraController } from "@/lib/media/smart-multi-camera-session/camera-controller-v1";
import type { SmartMultiCameraPhotoCollectionEngine } from "@/lib/media/smart-multi-camera-session/photo-collection-engine-v1";
import type { SmartMultiCameraSessionEngine } from "@/lib/media/smart-multi-camera-session/session-engine-v1";
import type { SmartMultiCameraUploadQueue } from "@/lib/media/smart-multi-camera-session/upload-queue-engine-v1";
import type {
  RecoveryErrorCode,
  RecoveryEvent,
  RecoveryFailureClass,
  RecoveryResult,
  RecoverySource,
  RecoveryState,
  RecoveryStatus,
} from "@/lib/media/smart-multi-camera-session/recovery-types-v1";

export const SMART_MULTI_CAMERA_RECOVERY_ENGINE_V1 = {
  version: "1.0",
  id: "smart-multi-camera-recovery-engine-v1",
  phase: "VI_RECOVERY_ENGINE",
  status: "CERTIFIED",
  inventsDataForbidden: true,
  recreatesPhotosForbidden: true,
  uploadForbidden: true,
  networkForbidden: true,
  uiForbidden: true,
} as const;

export type RecoveryEngineDeps = {
  sessionEngine: SmartMultiCameraSessionEngine;
  cameraController: SmartMultiCameraController;
  captureCoordinator: SmartMultiCameraCaptureCoordinator;
  photoCollection: SmartMultiCameraPhotoCollectionEngine;
  uploadQueue: SmartMultiCameraUploadQueue;
};

type RecoveryListener = (event: RecoveryEvent) => void;

const ERROR_MESSAGE: Record<RecoveryErrorCode, string> = {
  INVALID_TRANSITION: "Invalid recovery state transition.",
  RECOVERY_FAILED: "Recovery failed.",
  RESET_REQUIRED: "Recovery requires a full reset.",
  NO_RECOVERY: "No recovery is in progress.",
  VALIDATION_FAILED: "Recovery validation failed.",
};

const ALLOWED_TRANSITIONS: Readonly<
  Record<RecoveryStatus, readonly RecoveryStatus[]>
> = {
  NONE: ["CHECKING"],
  CHECKING: ["RECOVERING", "FAILED", "RESET_REQUIRED", "NONE"],
  RECOVERING: ["RESTORED", "FAILED", "RESET_REQUIRED"],
  RESTORED: ["NONE"],
  FAILED: ["NONE", "CHECKING"],
  RESET_REQUIRED: ["NONE", "CHECKING"],
};

function fail(
  code: RecoveryErrorCode,
  failureClass?: RecoveryFailureClass,
): RecoveryResult {
  return { ok: false, code, message: ERROR_MESSAGE[code], failureClass };
}

function succeed(
  state: RecoveryState,
  events: readonly RecoveryEvent[],
): RecoveryResult {
  return { ok: true, state, events };
}

function now(): number {
  return Date.now();
}

function canTransition(from: RecoveryStatus, to: RecoveryStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

function createInitialState(): RecoveryState {
  return {
    status: "NONE",
    source: null,
    failureClass: null,
    updatedAt: 0,
  };
}

type ValidationOutcome =
  | { ok: true }
  | { ok: false; failureClass: RecoveryFailureClass; resetRequired: boolean };

/**
 * Canonical Recovery Engine — single owner of multi-engine recovery orchestration.
 */
export class SmartMultiCameraRecoveryEngine {
  private state: RecoveryState = createInitialState();
  private readonly listeners = new Set<RecoveryListener>();
  private readonly sessionEngine: SmartMultiCameraSessionEngine;
  private readonly cameraController: SmartMultiCameraController;
  private readonly captureCoordinator: SmartMultiCameraCaptureCoordinator;
  private readonly photoCollection: SmartMultiCameraPhotoCollectionEngine;
  private readonly uploadQueue: SmartMultiCameraUploadQueue;

  constructor(deps: RecoveryEngineDeps) {
    this.sessionEngine = deps.sessionEngine;
    this.cameraController = deps.cameraController;
    this.captureCoordinator = deps.captureCoordinator;
    this.photoCollection = deps.photoCollection;
    this.uploadQueue = deps.uploadQueue;
  }

  getSnapshot(): RecoveryState {
    return { ...this.state };
  }

  subscribe(listener: RecoveryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** NONE | FAILED | RESET_REQUIRED → CHECKING */
  startRecovery(source: RecoverySource): RecoveryResult {
    if (!canTransition(this.state.status, "CHECKING")) {
      return fail("INVALID_TRANSITION");
    }
    const at = now();
    return this.commit(
      {
        status: "CHECKING",
        source,
        failureClass: null,
        updatedAt: at,
      },
      [{ type: "RecoveryStarted", source, at }],
    );
  }

  /**
   * Validate all dependencies. Does not invent or mutate photo data.
   * On hard inconsistency → RESET_REQUIRED.
   */
  validateRecovery(): RecoveryResult {
    if (this.state.status !== "CHECKING" || !this.state.source) {
      return fail("NO_RECOVERY");
    }

    const outcome = this.validateDependencies(this.state.source);
    const at = now();
    const source = this.state.source;

    if (!outcome.ok) {
      if (outcome.resetRequired) {
        if (!canTransition("CHECKING", "RESET_REQUIRED")) {
          return fail("INVALID_TRANSITION");
        }
        return this.commit(
          {
            status: "RESET_REQUIRED",
            source,
            failureClass: outcome.failureClass,
            updatedAt: at,
          },
          [
            {
              type: "RecoveryResetRequired",
              source,
              failureClass: outcome.failureClass,
              at,
            },
          ],
        );
      }

      if (!canTransition("CHECKING", "FAILED")) {
        return fail("INVALID_TRANSITION");
      }
      return this.commit(
        {
          status: "FAILED",
          source,
          failureClass: outcome.failureClass,
          updatedAt: at,
        },
        [
          {
            type: "RecoveryFailed",
            source,
            failureClass: outcome.failureClass,
            at,
          },
        ],
      );
    }

    if (!canTransition("CHECKING", "RECOVERING")) {
      return fail("INVALID_TRANSITION");
    }

    return this.commit(
      {
        status: "RECOVERING",
        source,
        failureClass: null,
        updatedAt: at,
      },
      [{ type: "RecoveryValidated", source, at }],
    );
  }

  /**
   * Apply source-specific recovery using existing engine APIs only.
   * Never recreates photos · never uploads · never changes ordering.
   */
  applyRecovery(): RecoveryResult {
    if (this.state.status !== "RECOVERING" || !this.state.source) {
      return fail("NO_RECOVERY");
    }

    const source = this.state.source;
    const applied = this.applySourceRecovery(source);
    const at = now();

    if (!applied.ok) {
      if (applied.resetRequired) {
        return this.commit(
          {
            status: "RESET_REQUIRED",
            source,
            failureClass: applied.failureClass,
            updatedAt: at,
          },
          [
            {
              type: "RecoveryResetRequired",
              source,
              failureClass: applied.failureClass,
              at,
            },
          ],
        );
      }
      return this.commit(
        {
          status: "FAILED",
          source,
          failureClass: applied.failureClass,
          updatedAt: at,
        },
        [
          {
            type: "RecoveryFailed",
            source,
            failureClass: applied.failureClass,
            at,
          },
        ],
      );
    }

    return this.commit(
      {
        status: "RESTORED",
        source,
        failureClass: null,
        updatedAt: at,
      },
      [
        { type: "RecoveryRestored", source, at },
        { type: "RecoveryCompleted", source, at },
      ],
    );
  }

  /** Full recovery pipeline: start → validate → apply */
  runRecovery(source: RecoverySource): RecoveryResult {
    const started = this.startRecovery(source);
    if (!started.ok) return started;

    const validated = this.validateRecovery();
    if (!validated.ok) return validated;
    if (validated.state.status !== "RECOVERING") {
      return validated;
    }

    return this.applyRecovery();
  }

  /** Clear recovery status back to NONE after RESTORED / FAILED / RESET_REQUIRED */
  acknowledge(): RecoveryResult {
    if (
      this.state.status !== "RESTORED" &&
      this.state.status !== "FAILED" &&
      this.state.status !== "RESET_REQUIRED"
    ) {
      return fail("INVALID_TRANSITION");
    }
    if (!canTransition(this.state.status, "NONE")) {
      return fail("INVALID_TRANSITION");
    }
    return this.commit(createInitialState(), []);
  }

  private validateDependencies(source: RecoverySource): ValidationOutcome {
    // Validate collection first (may emit) — avoid cloning photos before mutation path.
    const collectionValidation = this.photoCollection.validate();
    if (!collectionValidation.ok) {
      return {
        ok: false,
        failureClass: "INVALID_COLLECTION",
        resetRequired: true,
      };
    }

    const session = this.sessionEngine.getSnapshot();
    const controller = this.cameraController.getSnapshot();
    const coordinator = this.captureCoordinator.getSnapshot();
    const collection = this.photoCollection.getSnapshot();
    const queue = this.uploadQueue.getSnapshot();

    // Queue ↔ collection order/id consistency when queue has items
    if (queue.items.length > 0) {
      if (queue.items.length !== collection.photos.length) {
        return { ok: false, failureClass: "ORDER_MISMATCH", resetRequired: true };
      }
      for (let index = 0; index < queue.items.length; index += 1) {
        const queueItem = queue.items[index]!;
        const photo = collection.photos[index];
        if (!photo || photo.photoId !== queueItem.photoId || photo.order !== queueItem.order) {
          return { ok: false, failureClass: "ORDER_MISMATCH", resetRequired: true };
        }
      }
    }

    if (queue.sessionId && session.sessionId && queue.sessionId !== session.sessionId) {
      return { ok: false, failureClass: "DUPLICATE_SESSION", resetRequired: true };
    }

    if (
      controller.attachedSessionId &&
      session.sessionId &&
      controller.attachedSessionId !== session.sessionId
    ) {
      return { ok: false, failureClass: "DUPLICATE_SESSION", resetRequired: true };
    }

    if (source === "SESSION_LOST") {
      if (session.status !== "IDLE" && session.sessionId) {
        return { ok: false, failureClass: "INVALID_TRANSITION", resetRequired: false };
      }
    }

    if (source === "APPLICATION_RESUME" || source === "CONTROLLER_RESTART") {
      if (
        controller.status === "FAILED" ||
        controller.status === "PERMISSION_DENIED"
      ) {
        return { ok: true };
      }
    }

    if (coordinator.lockHeld && coordinator.status !== "AWAITING_HOST") {
      return {
        ok: false,
        failureClass: "CAPTURE_LOCK_INVALID",
        resetRequired: true,
      };
    }

    return { ok: true };
  }

  private applySourceRecovery(
    source: RecoverySource,
  ):
    | { ok: true }
    | { ok: false; failureClass: RecoveryFailureClass; resetRequired: boolean } {
    switch (source) {
      case "APPLICATION_PAUSE": {
        const controller = this.cameraController.getSnapshot();
        if (controller.status === "READY") {
          const paused = this.cameraController.notifyInterruption();
          if (!paused.ok) {
            return {
              ok: false,
              failureClass: "INVALID_CONTROLLER",
              resetRequired: false,
            };
          }
        }
        return { ok: true };
      }
      case "APPLICATION_RESUME": {
        const resumed = this.cameraController.recover();
        if (!resumed.ok) {
          const status = this.cameraController.getSnapshot().status;
          if (status === "PAUSED") {
            return {
              ok: false,
              failureClass: "INVALID_CONTROLLER",
              resetRequired: false,
            };
          }
        }
        return { ok: true };
      }
      case "SESSION_LOST": {
        const attached = this.cameraController.getSnapshot().attachedSessionId;
        if (attached) {
          const lost = this.cameraController.notifySessionLost(attached);
          if (!lost.ok) {
            return {
              ok: false,
              failureClass: "MISSING_SESSION",
              resetRequired: true,
            };
          }
        }
        if (this.captureCoordinator.getSnapshot().lockHeld) {
          const unlocked = this.captureCoordinator.recover();
          if (!unlocked.ok) {
            return {
              ok: false,
              failureClass: "CAPTURE_LOCK_INVALID",
              resetRequired: true,
            };
          }
        }
        return { ok: true };
      }
      case "CONTROLLER_RESTART": {
        const restarted = this.cameraController.recover();
        if (!restarted.ok) {
          const status = this.cameraController.getSnapshot().status;
          if (
            status !== "READY" &&
            status !== "INITIALIZING" &&
            status !== "UNINITIALIZED"
          ) {
            return {
              ok: false,
              failureClass: "INVALID_CONTROLLER",
              resetRequired: false,
            };
          }
        }
        return { ok: true };
      }
      case "CAPTURE_INTERRUPTION": {
        if (this.captureCoordinator.getSnapshot().status === "AWAITING_HOST") {
          const recovered = this.captureCoordinator.recover();
          if (!recovered.ok) {
            return {
              ok: false,
              failureClass: "CAPTURE_LOCK_INVALID",
              resetRequired: false,
            };
          }
        }
        return { ok: true };
      }
      case "UPLOAD_INTERRUPTION": {
        // Never upload. Leave queue state intact after validation.
        return { ok: true };
      }
      case "UNEXPECTED_RESET":
      case "HOST_RESTART":
      case "INVALID_STATE": {
        if (this.captureCoordinator.getSnapshot().lockHeld) {
          const recovered = this.captureCoordinator.recover();
          if (!recovered.ok) {
            return {
              ok: false,
              failureClass: "UNRECOVERABLE",
              resetRequired: true,
            };
          }
        }
        return { ok: true };
      }
      default: {
        return {
          ok: false,
          failureClass: "UNRECOVERABLE",
          resetRequired: true,
        };
      }
    }
  }

  private commit(
    state: RecoveryState,
    events: readonly RecoveryEvent[],
  ): RecoveryResult {
    this.state = { ...state };
    for (const event of events) {
      for (const listener of this.listeners) {
        listener(event);
      }
    }
    return succeed({ ...this.state }, events);
  }
}

export function createSmartMultiCameraRecoveryEngine(
  deps: RecoveryEngineDeps,
): SmartMultiCameraRecoveryEngine {
  return new SmartMultiCameraRecoveryEngine(deps);
}

export function isRecoveryTransitionAllowed(
  from: RecoveryStatus,
  to: RecoveryStatus,
): boolean {
  return canTransition(from, to);
}
