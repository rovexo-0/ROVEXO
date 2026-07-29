import { describe, expect, it } from "vitest";
import {
  SMART_MULTI_CAMERA_SSOT_CONSOLIDATION_V1,
  SMART_MULTI_CAMERA_SSOT_EVENT_PRODUCERS,
  SMART_MULTI_CAMERA_SSOT_EVENT_TYPE_COLLISIONS,
  SMART_MULTI_CAMERA_SSOT_IMPORT_DAG,
  SMART_MULTI_CAMERA_SSOT_OWNERS,
  assertSsotOwnershipSingularity,
  createSmartMultiCameraCaptureCoordinator,
  createSmartMultiCameraController,
  createSmartMultiCameraPhotoCollectionEngine,
  createSmartMultiCameraRecoveryEngine,
  createSmartMultiCameraSessionEngine,
  createSmartMultiCameraUploadQueue,
  detectSsotImportCycles,
  validateSsotComposition,
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

describe("Smart Multi Camera SSOT Consolidation v1.0 — Phase VIII", () => {
  it("exposes Phase VIII SSOT consolidation identity", () => {
    expect(SMART_MULTI_CAMERA_SSOT_CONSOLIDATION_V1.phase).toBe("VIII_SSOT_CONSOLIDATION");
    expect(SMART_MULTI_CAMERA_SSOT_CONSOLIDATION_V1.behaviouralChangesForbidden).toBe(true);
    expect(SMART_MULTI_CAMERA_SSOT_OWNERS.photoCollection).toBe(
      "SmartMultiCameraPhotoCollectionEngine",
    );
    expect(SMART_MULTI_CAMERA_SSOT_OWNERS.coverPhoto).toBe(
      "SmartMultiCameraPhotoCollectionEngine",
    );
    expect(SMART_MULTI_CAMERA_SSOT_OWNERS.flashState).toBe("SmartMultiCameraController");
    expect(SMART_MULTI_CAMERA_SSOT_OWNERS.captureLock).toBe(
      "SmartMultiCameraCaptureCoordinator",
    );
    expect(SMART_MULTI_CAMERA_SSOT_OWNERS.uploadQueue).toBe("SmartMultiCameraUploadQueue");
    expect(SMART_MULTI_CAMERA_SSOT_OWNERS.recoveryState).toBe(
      "SmartMultiCameraRecoveryEngine",
    );
  });

  it("enforces single ownership singularity and rejects circular imports", () => {
    expect(() => assertSsotOwnershipSingularity()).not.toThrow();
    const cycles = detectSsotImportCycles();
    expect(cycles.ok).toBe(true);
    expect(Object.keys(SMART_MULTI_CAMERA_SSOT_IMPORT_DAG).length).toBeGreaterThan(10);
  });

  it("maps every event producer uniquely within the namespaced producer table", () => {
    const keys = Object.keys(SMART_MULTI_CAMERA_SSOT_EVENT_PRODUCERS);
    expect(new Set(keys).size).toBe(keys.length);
    expect(SMART_MULTI_CAMERA_SSOT_EVENT_TYPE_COLLISIONS.length).toBe(5);
    for (const collision of SMART_MULTI_CAMERA_SSOT_EVENT_TYPE_COLLISIONS) {
      expect(collision.producers.length).toBe(2);
    }
  });

  it("keeps Session snapshots immutable against caller mutation", () => {
    const engine = createSmartMultiCameraSessionEngine();
    expect(engine.startSession({ sessionId: "ssot-1" }).ok).toBe(true);
    expect(engine.beginCapturing().ok).toBe(true);
    expect(
      engine.capturePhoto({
        photoId: "a",
        localUri: "blob://a",
        width: 1,
        height: 1,
      }).ok,
    ).toBe(true);

    const snap = engine.getSnapshot();
    const photos = snap.photos as { photoId: string; order: number }[];
    photos.push({ photoId: "mutated", order: 99 });
    photos[0]!.photoId = "hacked";
    (snap as { status: string }).status = "COMPLETED";

    const again = engine.getSnapshot();
    expect(again.photos).toHaveLength(1);
    expect(again.photos[0]!.photoId).toBe("a");
    expect(again.status).toBe("CAPTURING");
  });

  it("validates composition contracts for Session ↔ Controller ↔ Collection ↔ Queue", () => {
    const stack = createStack();
    expect(stack.sessionEngine.startSession({ sessionId: "ssot-2" }).ok).toBe(true);
    expect(stack.sessionEngine.beginCapturing().ok).toBe(true);
    expect(stack.cameraController.initialize().ok).toBe(true);
    expect(stack.cameraController.setPermission("GRANTED").ok).toBe(true);
    expect(
      stack.cameraController.attachSession(stack.sessionEngine.getSnapshot()).ok,
    ).toBe(true);
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
        sessionId: "ssot-2",
        items: [{ photoId: "a", localUri: "blob://a", order: 0 }],
      }).ok,
    ).toBe(true);

    const session = stack.sessionEngine.getSnapshot();
    const controller = stack.cameraController.getSnapshot();
    const collection = stack.photoCollection.getSnapshot();
    const queue = stack.uploadQueue.getSnapshot();
    const coordinator = stack.captureCoordinator.getSnapshot();
    const recovery = stack.recovery.getSnapshot();

    const ok = validateSsotComposition({
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
    });
    expect(ok.ok).toBe(true);

    const broken = validateSsotComposition({
      session: {
        sessionId: "ssot-2",
        status: "CAPTURING",
        flashMode: "auto",
        activeCamera: "back",
        photos: [],
      },
      controller: {
        attachedSessionId: "other",
        flashMode: "auto",
        activeCamera: "back",
        permission: "GRANTED",
        status: "READY",
      },
      collection: { photos: [{ photoId: "a", order: 0 }], coverPhotoId: "a" },
      queue: {
        sessionId: "ssot-2",
        items: [{ photoId: "b", order: 0 }],
        status: "CREATED",
      },
      coordinator: { lockHeld: true, status: "IDLE" },
      recovery: { status: "NONE" },
    });
    expect(broken.ok).toBe(false);
    if (broken.ok) return;
    expect(broken.issues.some((issue) => issue.code === "SESSION_CONTROLLER_MISMATCH")).toBe(
      true,
    );
    expect(broken.issues.some((issue) => issue.code === "QUEUE_COLLECTION_MISMATCH")).toBe(
      true,
    );
    expect(broken.issues.some((issue) => issue.code === "CAPTURE_LOCK_INVALID")).toBe(true);
  });

  it("preserves reference integrity across getSnapshot clones", () => {
    const collection = createSmartMultiCameraPhotoCollectionEngine();
    expect(
      collection.addPhoto({
        photoId: "a",
        localUri: "blob://a",
        width: 1,
        height: 1,
      }).ok,
    ).toBe(true);
    const a = collection.getSnapshot();
    const b = collection.getSnapshot();
    expect(a).not.toBe(b);
    expect(a.photos).not.toBe(b.photos);
    expect(a.photos[0]).not.toBe(b.photos[0]);
    expect(a.photos[0]).toEqual(b.photos[0]);
  });

  it("regression — prior engines still compose without circular recovery deps", () => {
    const stack = createStack();
    expect(stack.recovery.getSnapshot().status).toBe("NONE");
    expect(stack.uploadQueue.getSnapshot().status).toBe("EMPTY");
    expect(stack.captureCoordinator.getSnapshot().lockHeld).toBe(false);
  });
});
