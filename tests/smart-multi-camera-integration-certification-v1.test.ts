import { describe, expect, it } from "vitest";
import {
  SMART_MULTI_CAMERA_INTEGRATION_CERTIFICATION_V1,
  SMART_MULTI_CAMERA_PERFORMANCE_VALIDATION_V1,
  SMART_MULTI_CAMERA_SSOT_CONSOLIDATION_V1,
  SMART_MULTI_CAMERA_SSOT_EVENT_TYPE_COLLISIONS,
  assertIntegratedModuleInvariants,
  createIntegratedSmartMultiCameraSession,
  detectSsotImportCycles,
  readIntegratedSsotSnapshot,
  validateSsotComposition,
} from "@/lib/media/smart-multi-camera-session";

function photo(index: number) {
  return {
    photoId: `p${index}`,
    localUri: `blob://p${index}`,
    width: 100 + index,
    height: 120 + index,
  };
}

function bootReady(stack: ReturnType<typeof createIntegratedSmartMultiCameraSession>, sessionId = "ix-1") {
  expect(stack.sessionEngine.startSession({ sessionId }).ok).toBe(true);
  expect(stack.sessionEngine.beginCapturing().ok).toBe(true);
  expect(stack.cameraController.initialize().ok).toBe(true);
  expect(stack.cameraController.setPermission("GRANTED").ok).toBe(true);
  expect(stack.cameraController.attachSession(stack.sessionEngine.getSnapshot()).ok).toBe(
    true,
  );
}

/** Host mirror: Capture Coordinator → Session buffer + Photo Collection rail SSOT. */
function captureOne(
  stack: ReturnType<typeof createIntegratedSmartMultiCameraSession>,
  index: number,
) {
  const input = photo(index);
  expect(stack.captureCoordinator.requestCapture(`req-${index}`).ok).toBe(true);
  expect(stack.captureCoordinator.acceptCapture(input, `req-${index}`).ok).toBe(true);
  expect(stack.photoCollection.addPhoto(input).ok).toBe(true);
}

describe("Smart Multi Camera Integration Certification v1.0 — Phase IX", () => {
  it("exposes integration certification identity and certified phase chain", () => {
    expect(SMART_MULTI_CAMERA_INTEGRATION_CERTIFICATION_V1.phase).toBe(
      "IX_INTEGRATION_CERTIFICATION",
    );
    expect(SMART_MULTI_CAMERA_INTEGRATION_CERTIFICATION_V1.status).toBe("CERTIFIED");
    expect(SMART_MULTI_CAMERA_INTEGRATION_CERTIFICATION_V1.scenarios).toHaveLength(5);
    expect(SMART_MULTI_CAMERA_INTEGRATION_CERTIFICATION_V1.certifiedPhases).toHaveLength(8);
    expect(SMART_MULTI_CAMERA_SSOT_CONSOLIDATION_V1.status).toBe("CERTIFIED");
    expect(SMART_MULTI_CAMERA_PERFORMANCE_VALIDATION_V1.status).toBe("CERTIFIED");
    expect(detectSsotImportCycles().ok).toBe(true);
  });

  it("Scenario 1 — start → capture → delete → reorder → upload → recovery → complete", () => {
    const stack = createIntegratedSmartMultiCameraSession();
    bootReady(stack, "ix-s1");
    captureOne(stack, 0);
    captureOne(stack, 1);
    captureOne(stack, 2);

    expect(stack.sessionEngine.deletePhoto("p1").ok).toBe(true);
    expect(stack.photoCollection.removePhoto("p1").ok).toBe(true);
    expect(stack.sessionEngine.reorderPhotos(0, 1).ok).toBe(true);
    expect(stack.photoCollection.reorderPhotos(0, 1).ok).toBe(true);

    expect(stack.sessionEngine.markReady().ok).toBe(true);
    expect(stack.sessionEngine.requestUpload().ok).toBe(true);

    const collection = stack.photoCollection.getSnapshot();
    expect(
      stack.uploadQueue.createQueue({
        sessionId: "ix-s1",
        items: collection.photos.map((item) => ({
          photoId: item.photoId,
          localUri: item.localUri,
          order: item.order,
        })),
      }).ok,
    ).toBe(true);
    expect(stack.uploadQueue.validateQueue().ok).toBe(true);
    expect(stack.uploadQueue.requestUpload().ok).toBe(true);
    expect(stack.uploadQueue.notifyUploadStarted().ok).toBe(true);

    expect(stack.recovery.runRecovery("UPLOAD_INTERRUPTION").ok).toBe(true);
    expect(stack.recovery.getSnapshot().status).toBe("RESTORED");
    expect(stack.recovery.acknowledge().ok).toBe(true);

    expect(stack.uploadQueue.notifyUploadCompleted().ok).toBe(true);
    expect(stack.sessionEngine.notifyUploadStarted().ok).toBe(true);
    expect(stack.sessionEngine.notifyUploadCompleted().ok).toBe(true);

    expect(assertIntegratedModuleInvariants(stack).ok).toBe(true);
    expect(stack.sessionEngine.getSnapshot().status).toBe("COMPLETED");
    expect(stack.uploadQueue.getSnapshot().status).toBe("COMPLETED");
    expect(stack.captureCoordinator.getSnapshot().lockHeld).toBe(false);
  });

  it("Scenario 2 — permission denied → recovery → retry → capture → cancel", () => {
    const stack = createIntegratedSmartMultiCameraSession();
    expect(stack.sessionEngine.startSession({ sessionId: "ix-s2" }).ok).toBe(true);
    expect(stack.sessionEngine.beginCapturing().ok).toBe(true);
    expect(stack.cameraController.initialize().ok).toBe(true);
    expect(stack.cameraController.setPermission("DENIED").ok).toBe(true);
    expect(stack.cameraController.getSnapshot().status).toBe("PERMISSION_DENIED");

    const recovered = stack.recovery.runRecovery("CONTROLLER_RESTART");
    expect(recovered.ok).toBe(true);
    expect(stack.recovery.acknowledge().ok).toBe(true);

    expect(stack.cameraController.setPermission("GRANTED").ok).toBe(true);
    if (stack.cameraController.getSnapshot().status !== "READY") {
      expect(stack.cameraController.initialize().ok).toBe(true);
      expect(stack.cameraController.setPermission("GRANTED").ok).toBe(true);
    }
    expect(stack.cameraController.attachSession(stack.sessionEngine.getSnapshot()).ok).toBe(
      true,
    );

    captureOne(stack, 0);
    expect(stack.sessionEngine.getSnapshot().photos).toHaveLength(1);
    expect(stack.sessionEngine.cancelSession().ok).toBe(true);
    expect(stack.sessionEngine.getSnapshot().status).toBe("IDLE");

    const lost = stack.recovery.runRecovery("SESSION_LOST");
    expect(lost.ok).toBe(true);
    expect(stack.cameraController.getSnapshot().status).toBe("STOPPED");
    expect(assertIntegratedModuleInvariants(stack).ok).toBe(true);
  });

  it("Scenario 3 — max photos → delete cover → cover reassignment → queue → recovery", () => {
    const stack = createIntegratedSmartMultiCameraSession();
    bootReady(stack, "ix-s3");
    for (let index = 0; index < 8; index += 1) {
      captureOne(stack, index);
    }
    expect(stack.photoCollection.getSnapshot().photos).toHaveLength(8);
    expect(stack.photoCollection.getSnapshot().coverPhotoId).toBe("p0");

    expect(stack.sessionEngine.deletePhoto("p0").ok).toBe(true);
    expect(stack.photoCollection.removePhoto("p0").ok).toBe(true);
    expect(stack.photoCollection.getSnapshot().coverPhotoId).toBe("p1");
    expect(stack.photoCollection.getSnapshot().photos[0]!.isCover).toBe(true);

    const collection = stack.photoCollection.getSnapshot();
    expect(
      stack.uploadQueue.createQueue({
        sessionId: "ix-s3",
        items: collection.photos.map((item) => ({
          photoId: item.photoId,
          localUri: item.localUri,
          order: item.order,
        })),
      }).ok,
    ).toBe(true);
    expect(stack.uploadQueue.validateQueue().ok).toBe(true);

    expect(stack.recovery.runRecovery("APPLICATION_PAUSE").ok).toBe(true);
    expect(stack.recovery.acknowledge().ok).toBe(true);
    expect(stack.recovery.runRecovery("APPLICATION_RESUME").ok).toBe(true);
    expect(stack.recovery.acknowledge().ok).toBe(true);

    expect(validateSsotComposition(readIntegratedSsotSnapshot(stack)).ok).toBe(true);
    expect(assertIntegratedModuleInvariants(stack).ok).toBe(true);
  });

  it("Scenario 4 — repeated controller restart → session/queue restore → recovery complete", () => {
    const stack = createIntegratedSmartMultiCameraSession();
    bootReady(stack, "ix-s4");
    captureOne(stack, 0);
    const collection = stack.photoCollection.getSnapshot();
    expect(
      stack.uploadQueue.createQueue({
        sessionId: "ix-s4",
        items: collection.photos.map((item) => ({
          photoId: item.photoId,
          localUri: item.localUri,
          order: item.order,
        })),
      }).ok,
    ).toBe(true);

    for (let round = 0; round < 5; round += 1) {
      expect(stack.cameraController.notifyInterruption().ok).toBe(true);
      const restart = stack.recovery.runRecovery("CONTROLLER_RESTART");
      expect(restart.ok).toBe(true);
      expect(stack.recovery.getSnapshot().status).toBe("RESTORED");
      expect(stack.recovery.acknowledge().ok).toBe(true);
      expect(stack.cameraController.getSnapshot().status).toBe("READY");
    }

    expect(stack.sessionEngine.getSnapshot().sessionId).toBe("ix-s4");
    expect(stack.uploadQueue.getSnapshot().items).toHaveLength(1);
    expect(stack.uploadQueue.getSnapshot().status).toBe("CREATED");
    expect(assertIntegratedModuleInvariants(stack).ok).toBe(true);
  });

  it("Scenario 5 — invalid contracts → RESET_REQUIRED → fail closed", () => {
    const stack = createIntegratedSmartMultiCameraSession();
    bootReady(stack, "ix-s5");
    captureOne(stack, 0);
    expect(
      stack.uploadQueue.createQueue({
        sessionId: "ix-s5",
        items: [{ photoId: "ghost", localUri: "blob://ghost", order: 0 }],
      }).ok,
    ).toBe(true);

    const result = stack.recovery.runRecovery("INVALID_STATE");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.status).toBe("RESET_REQUIRED");
    expect(result.events.some((event) => event.type === "RecoveryResetRequired")).toBe(true);

    const contracts = validateSsotComposition(readIntegratedSsotSnapshot(stack));
    expect(contracts.ok).toBe(false);
    if (contracts.ok) return;
    expect(contracts.issues.some((issue) => issue.code === "QUEUE_COLLECTION_MISMATCH")).toBe(
      true,
    );

    expect(stack.recovery.applyRecovery().ok).toBe(false);
    expect(SMART_MULTI_CAMERA_SSOT_EVENT_TYPE_COLLISIONS.length).toBeGreaterThan(0);
  });

  it("enforces singularity invariants on fresh integrated stack", () => {
    const stack = createIntegratedSmartMultiCameraSession();
    const invariants = assertIntegratedModuleInvariants(stack);
    expect(invariants.ok).toBe(true);
    expect(stack.captureCoordinator.getSnapshot().lockHeld).toBe(false);
    expect(stack.recovery.getSnapshot().status).toBe("NONE");
  });
});
