import { describe, expect, it } from "vitest";
import {
  SMART_MULTI_CAMERA_PERFORMANCE_VALIDATION_V1,
  createSmartMultiCameraCaptureCoordinator,
  createSmartMultiCameraController,
  createSmartMultiCameraPhotoCollectionEngine,
  createSmartMultiCameraRecoveryEngine,
  createSmartMultiCameraSessionEngine,
  createSmartMultiCameraUploadQueue,
} from "@/lib/media/smart-multi-camera-session";

const MAX_PHOTOS = 8;
/** Soft ceiling — logic-only ops on n≤8 must stay well under this on CI. */
const BUDGET_MS = 250;

function photoInput(index: number) {
  return {
    photoId: `p${index}`,
    localUri: `blob://p${index}`,
    width: 100 + index,
    height: 100 + index,
  };
}

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
  expect(stack.sessionEngine.startSession({ sessionId: "perf-sess" }).ok).toBe(true);
  expect(stack.sessionEngine.beginCapturing().ok).toBe(true);
  expect(stack.cameraController.initialize().ok).toBe(true);
  expect(stack.cameraController.setPermission("GRANTED").ok).toBe(true);
  expect(stack.cameraController.attachSession(stack.sessionEngine.getSnapshot()).ok).toBe(
    true,
  );
}

describe("Smart Multi Camera Performance Validation v1.0 — Phase VII", () => {
  it("exposes performance validation identity without new runtime features", () => {
    expect(SMART_MULTI_CAMERA_PERFORMANCE_VALIDATION_V1.phase).toBe(
      "VII_PERFORMANCE_VALIDATION",
    );
    expect(SMART_MULTI_CAMERA_PERFORMANCE_VALIDATION_V1.behaviouralChangesForbidden).toBe(
      true,
    );
    expect(SMART_MULTI_CAMERA_PERFORMANCE_VALIDATION_V1.engines).toHaveLength(6);
  });

  it("fills maximum photos (8) within budget", () => {
    const stack = createStack();
    bootCaptureReady(stack);
    const started = performance.now();
    for (let index = 0; index < MAX_PHOTOS; index += 1) {
      expect(stack.photoCollection.addPhoto(photoInput(index)).ok).toBe(true);
      expect(
        stack.sessionEngine.capturePhoto({
          ...photoInput(index),
          photoId: `s${index}`,
        }).ok,
      ).toBe(true);
    }
    expect(stack.photoCollection.getSnapshot().photos).toHaveLength(MAX_PHOTOS);
    expect(performance.now() - started).toBeLessThan(BUDGET_MS);
  });

  it("repeated add/remove stays within budget", () => {
    const stack = createStack();
    bootCaptureReady(stack);
    const started = performance.now();
    for (let round = 0; round < 40; round += 1) {
      expect(stack.photoCollection.addPhoto(photoInput(round % MAX_PHOTOS)).ok).toBe(true);
      expect(stack.photoCollection.removePhoto(`p${round % MAX_PHOTOS}`).ok).toBe(true);
    }
    expect(performance.now() - started).toBeLessThan(BUDGET_MS);
  });

  it("repeated reorder stays within budget", () => {
    const stack = createStack();
    bootCaptureReady(stack);
    for (let index = 0; index < MAX_PHOTOS; index += 1) {
      expect(stack.photoCollection.addPhoto(photoInput(index)).ok).toBe(true);
    }
    const started = performance.now();
    for (let round = 0; round < 80; round += 1) {
      expect(stack.photoCollection.reorderPhotos(0, MAX_PHOTOS - 1).ok).toBe(true);
      expect(stack.photoCollection.reorderPhotos(MAX_PHOTOS - 1, 0).ok).toBe(true);
    }
    expect(performance.now() - started).toBeLessThan(BUDGET_MS);
  });

  it("repeated queue creation and validation stays within budget", () => {
    const stack = createStack();
    bootCaptureReady(stack);
    for (let index = 0; index < MAX_PHOTOS; index += 1) {
      expect(stack.photoCollection.addPhoto(photoInput(index)).ok).toBe(true);
    }
    const items = stack.photoCollection.getSnapshot().photos.map((photo) => ({
      photoId: photo.photoId,
      localUri: photo.localUri,
      order: photo.order,
    }));
    const started = performance.now();
    for (let round = 0; round < 40; round += 1) {
      expect(stack.uploadQueue.resetQueue().ok).toBe(true);
      expect(
        stack.uploadQueue.createQueue({ sessionId: "perf-sess", items }).ok,
      ).toBe(true);
      expect(stack.uploadQueue.validateQueue().ok).toBe(true);
    }
    expect(performance.now() - started).toBeLessThan(BUDGET_MS);
  });

  it("repeated controller transitions and recovery stay within budget", () => {
    const stack = createStack();
    bootCaptureReady(stack);
    const started = performance.now();
    for (let round = 0; round < 40; round += 1) {
      expect(stack.cameraController.notifyInterruption().ok).toBe(true);
      expect(stack.cameraController.recover().ok).toBe(true);
      const pause = stack.recovery.runRecovery("APPLICATION_PAUSE");
      expect(pause.ok).toBe(true);
      expect(stack.recovery.acknowledge().ok).toBe(true);
      const resume = stack.recovery.runRecovery("APPLICATION_RESUME");
      expect(resume.ok).toBe(true);
      expect(stack.recovery.acknowledge().ok).toBe(true);
    }
    expect(performance.now() - started).toBeLessThan(BUDGET_MS * 2);
  });

  it("repeated collection validation stays within budget", () => {
    const stack = createStack();
    for (let index = 0; index < MAX_PHOTOS; index += 1) {
      expect(stack.photoCollection.addPhoto(photoInput(index)).ok).toBe(true);
    }
    const started = performance.now();
    for (let round = 0; round < 200; round += 1) {
      expect(stack.photoCollection.validate().ok).toBe(true);
    }
    expect(performance.now() - started).toBeLessThan(BUDGET_MS);
  });
});
