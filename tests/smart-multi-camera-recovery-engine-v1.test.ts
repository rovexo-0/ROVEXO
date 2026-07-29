import { describe, expect, it } from "vitest";
import {
  createSmartMultiCameraCaptureCoordinator,
  createSmartMultiCameraController,
  createSmartMultiCameraPhotoCollectionEngine,
  createSmartMultiCameraRecoveryEngine,
  createSmartMultiCameraSessionEngine,
  createSmartMultiCameraUploadQueue,
  isRecoveryTransitionAllowed,
  SMART_MULTI_CAMERA_RECOVERY_ENGINE_V1,
  type RecoveryEvent,
} from "@/lib/media/smart-multi-camera-session";

function createStack() {
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
    photoCollection,
    uploadQueue,
    captureCoordinator,
    recovery,
  };
}

function bootCaptureReady(stack: ReturnType<typeof createStack>) {
  expect(stack.sessionEngine.startSession({ sessionId: "sess-1" }).ok).toBe(true);
  expect(stack.sessionEngine.beginCapturing().ok).toBe(true);
  expect(stack.cameraController.initialize().ok).toBe(true);
  expect(stack.cameraController.setPermission("GRANTED").ok).toBe(true);
  expect(stack.cameraController.attachSession(stack.sessionEngine.getSnapshot()).ok).toBe(
    true,
  );
}

describe("Smart Multi Camera Recovery Engine v1.0 — Phase VI", () => {
  it("exposes one logic-only recovery identity", () => {
    expect(SMART_MULTI_CAMERA_RECOVERY_ENGINE_V1.phase).toBe("VI_RECOVERY_ENGINE");
    expect(SMART_MULTI_CAMERA_RECOVERY_ENGINE_V1.inventsDataForbidden).toBe(true);
    expect(SMART_MULTI_CAMERA_RECOVERY_ENGINE_V1.recreatesPhotosForbidden).toBe(true);
    expect(SMART_MULTI_CAMERA_RECOVERY_ENGINE_V1.uploadForbidden).toBe(true);
  });

  it("recovers application pause and resume", () => {
    const stack = createStack();
    bootCaptureReady(stack);
    const events: RecoveryEvent[] = [];
    stack.recovery.subscribe((event) => events.push(event));

    const paused = stack.recovery.runRecovery("APPLICATION_PAUSE");
    expect(paused.ok).toBe(true);
    if (!paused.ok) return;
    expect(paused.state.status).toBe("RESTORED");
    expect(stack.cameraController.getSnapshot().status).toBe("PAUSED");

    expect(stack.recovery.acknowledge().ok).toBe(true);
    const resumed = stack.recovery.runRecovery("APPLICATION_RESUME");
    expect(resumed.ok).toBe(true);
    if (!resumed.ok) return;
    expect(stack.cameraController.getSnapshot().status).toBe("READY");
    expect(events.some((event) => event.type === "RecoveryCompleted")).toBe(true);
  });

  it("recovers session lost without inventing photos", () => {
    const stack = createStack();
    bootCaptureReady(stack);
    expect(
      stack.photoCollection.addPhoto({
        photoId: "a",
        localUri: "blob://a",
        width: 1,
        height: 1,
      }).ok,
    ).toBe(true);

    expect(stack.sessionEngine.cancelSession().ok).toBe(true);
    const recovered = stack.recovery.runRecovery("SESSION_LOST");
    expect(recovered.ok).toBe(true);
    if (!recovered.ok) return;
    expect(recovered.state.status).toBe("RESTORED");
    expect(stack.cameraController.getSnapshot().status).toBe("STOPPED");
    expect(stack.photoCollection.getSnapshot().photos).toHaveLength(1);
  });

  it("recovers capture lock interruption", () => {
    const stack = createStack();
    bootCaptureReady(stack);
    expect(stack.captureCoordinator.requestCapture("req-1").ok).toBe(true);
    expect(stack.captureCoordinator.getSnapshot().lockHeld).toBe(true);

    const recovered = stack.recovery.runRecovery("CAPTURE_INTERRUPTION");
    expect(recovered.ok).toBe(true);
    if (!recovered.ok) return;
    expect(stack.captureCoordinator.getSnapshot().lockHeld).toBe(false);
    expect(stack.captureCoordinator.getSnapshot().status).toBe("IDLE");
  });

  it("validates queue recovery and leaves upload state untouched", () => {
    const stack = createStack();
    bootCaptureReady(stack);
    expect(
      stack.photoCollection.addPhoto({
        photoId: "a",
        localUri: "blob://a",
        width: 1,
        height: 1,
      }).ok,
    ).toBe(true);
    expect(
      stack.uploadQueue.createQueue({
        sessionId: "sess-1",
        items: [{ photoId: "a", localUri: "blob://a", order: 0 }],
      }).ok,
    ).toBe(true);
    expect(stack.uploadQueue.validateQueue().ok).toBe(true);
    expect(stack.uploadQueue.requestUpload().ok).toBe(true);
    expect(stack.uploadQueue.notifyUploadStarted().ok).toBe(true);

    const recovered = stack.recovery.runRecovery("UPLOAD_INTERRUPTION");
    expect(recovered.ok).toBe(true);
    if (!recovered.ok) return;
    expect(stack.uploadQueue.getSnapshot().status).toBe("UPLOADING");
    expect(stack.uploadQueue.getSnapshot().items).toHaveLength(1);
  });

  it("requires reset when queue order mismatches collection", () => {
    const stack = createStack();
    bootCaptureReady(stack);
    expect(
      stack.photoCollection.addPhoto({
        photoId: "a",
        localUri: "blob://a",
        width: 1,
        height: 1,
      }).ok,
    ).toBe(true);
    expect(
      stack.uploadQueue.createQueue({
        sessionId: "sess-1",
        items: [{ photoId: "b", localUri: "blob://b", order: 0 }],
      }).ok,
    ).toBe(true);

    const result = stack.recovery.runRecovery("INVALID_STATE");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.status).toBe("RESET_REQUIRED");
    expect(result.events.some((event) => event.type === "RecoveryResetRequired")).toBe(
      true,
    );
  });

  it("classifies controller recovery and invalid transitions fail-closed", () => {
    const stack = createStack();
    bootCaptureReady(stack);
    expect(stack.cameraController.notifyInterruption().ok).toBe(true);

    const recovered = stack.recovery.runRecovery("CONTROLLER_RESTART");
    expect(recovered.ok).toBe(true);
    if (!recovered.ok) return;
    expect(stack.cameraController.getSnapshot().status).toBe("READY");

    expect(stack.recovery.applyRecovery().ok).toBe(false);
    expect(isRecoveryTransitionAllowed("NONE", "RESTORED")).toBe(false);
    expect(isRecoveryTransitionAllowed("NONE", "CHECKING")).toBe(true);
  });
});
