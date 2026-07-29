import { describe, expect, it } from "vitest";
import {
  createSmartMultiCameraCaptureCoordinator,
  createSmartMultiCameraController,
  createSmartMultiCameraSessionEngine,
  SMART_MULTI_CAMERA_CAPTURE_COORDINATOR_V1,
  type CaptureCoordinatorEvent,
} from "@/lib/media/smart-multi-camera-session";

function readyPair() {
  const sessionEngine = createSmartMultiCameraSessionEngine();
  const cameraController = createSmartMultiCameraController();

  expect(sessionEngine.startSession({ sessionId: "sess-1" }).ok).toBe(true);
  expect(sessionEngine.beginCapturing().ok).toBe(true);

  expect(cameraController.initialize().ok).toBe(true);
  expect(cameraController.setPermission("GRANTED").ok).toBe(true);
  expect(cameraController.attachSession(sessionEngine.getSnapshot()).ok).toBe(true);

  const coordinator = createSmartMultiCameraCaptureCoordinator({
    sessionEngine,
    cameraController,
  });

  return { sessionEngine, cameraController, coordinator };
}

describe("Smart Multi Camera Capture Coordinator v1.0 — Phase III", () => {
  it("exposes one logic-only coordinator identity", () => {
    expect(SMART_MULTI_CAMERA_CAPTURE_COORDINATOR_V1.phase).toBe("III_CAPTURE_COORDINATOR");
    expect(SMART_MULTI_CAMERA_CAPTURE_COORDINATOR_V1.maxPhotos).toBe(8);
    expect(SMART_MULTI_CAMERA_CAPTURE_COORDINATOR_V1.hardwareAccessForbidden).toBe(true);
    expect(SMART_MULTI_CAMERA_CAPTURE_COORDINATOR_V1.singleCaptureLock).toBe(true);
  });

  it("rejects when session is not capture-ready", () => {
    const sessionEngine = createSmartMultiCameraSessionEngine();
    const cameraController = createSmartMultiCameraController();
    expect(cameraController.initialize().ok).toBe(true);
    expect(cameraController.setPermission("GRANTED").ok).toBe(true);

    const coordinator = createSmartMultiCameraCaptureCoordinator({
      sessionEngine,
      cameraController,
    });
    const events: CaptureCoordinatorEvent[] = [];
    coordinator.subscribe((event) => events.push(event));

    const result = coordinator.requestCapture();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("SESSION_NOT_READY");
    expect(events.some((event) => event.type === "CaptureRejected")).toBe(true);
  });

  it("rejects when controller is not READY", () => {
    const sessionEngine = createSmartMultiCameraSessionEngine();
    expect(sessionEngine.startSession({ sessionId: "s" }).ok).toBe(true);
    expect(sessionEngine.beginCapturing().ok).toBe(true);
    const cameraController = createSmartMultiCameraController();
    expect(cameraController.initialize().ok).toBe(true);

    const coordinator = createSmartMultiCameraCaptureCoordinator({
      sessionEngine,
      cameraController,
    });
    const result = coordinator.requestCapture();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("CONTROLLER_NOT_READY");
  });

  it("rejects when permission is not GRANTED", () => {
    const sessionEngine = createSmartMultiCameraSessionEngine();
    expect(sessionEngine.startSession({ sessionId: "s" }).ok).toBe(true);
    expect(sessionEngine.beginCapturing().ok).toBe(true);
    const cameraController = createSmartMultiCameraController();
    expect(cameraController.initialize().ok).toBe(true);
    expect(cameraController.setPermission("DENIED").ok).toBe(true);

    const coordinator = createSmartMultiCameraCaptureCoordinator({
      sessionEngine,
      cameraController,
    });
    const result = coordinator.requestCapture();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(["PERMISSION_REQUIRED", "CONTROLLER_NOT_READY"]).toContain(result.code);
  });

  it("acquires lock, accepts host capture into session, releases lock", () => {
    const { sessionEngine, coordinator } = readyPair();
    const events: CaptureCoordinatorEvent[] = [];
    coordinator.subscribe((event) => events.push(event));

    const requested = coordinator.requestCapture("req-1");
    expect(requested.ok).toBe(true);
    if (!requested.ok) return;
    expect(requested.state.status).toBe("AWAITING_HOST");
    expect(requested.state.lockHeld).toBe(true);
    expect(requested.events.map((event) => event.type)).toEqual([
      "CaptureLockAcquired",
      "CaptureRequested",
    ]);

    const accepted = coordinator.acceptCapture({
      photoId: "p1",
      localUri: "blob://p1",
      width: 100,
      height: 100,
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.state.lockHeld).toBe(false);
    expect(accepted.state.status).toBe("IDLE");
    expect(sessionEngine.getSnapshot().photos).toHaveLength(1);
    expect(accepted.events.map((event) => event.type)).toEqual([
      "CaptureAccepted",
      "CaptureLockReleased",
    ]);
    expect(events.some((event) => event.type === "CaptureAccepted")).toBe(true);
  });

  it("rejects duplicate capture requests while lock is held", () => {
    const { coordinator } = readyPair();
    expect(coordinator.requestCapture("req-a").ok).toBe(true);
    const duplicate = coordinator.requestCapture("req-b");
    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) return;
    expect(duplicate.code).toBe("CAPTURE_LOCK_HELD");
  });

  it("enforces max capacity of 8", () => {
    const { sessionEngine, coordinator } = readyPair();
    for (let index = 0; index < 8; index += 1) {
      expect(coordinator.requestCapture(`r${index}`).ok).toBe(true);
      expect(
        coordinator.acceptCapture({
          photoId: `p${index}`,
          localUri: `blob://p${index}`,
          width: 10,
          height: 10,
        }).ok,
      ).toBe(true);
    }
    expect(sessionEngine.getSnapshot().photos).toHaveLength(8);
    const overflow = coordinator.requestCapture("r8");
    expect(overflow.ok).toBe(false);
    if (overflow.ok) return;
    expect(overflow.code).toBe("CAPACITY_REACHED");
  });

  it("cancels pending capture and releases lock", () => {
    const { coordinator } = readyPair();
    expect(coordinator.requestCapture("req-c").ok).toBe(true);
    const cancelled = coordinator.cancelCapture();
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.state.lockHeld).toBe(false);
    expect(cancelled.events.map((event) => event.type)).toEqual([
      "CaptureCancelled",
      "CaptureLockReleased",
    ]);
  });

  it("rejects host failure and recovers from awaiting state", () => {
    const { coordinator } = readyPair();
    expect(coordinator.requestCapture("req-d").ok).toBe(true);
    const rejected = coordinator.rejectCapture("HOST_REJECTED");
    expect(rejected.ok).toBe(true);
    if (!rejected.ok) return;
    expect(rejected.state.status).toBe("IDLE");
    expect(rejected.events.some((event) => event.type === "CaptureRejected")).toBe(true);

    expect(coordinator.requestCapture("req-e").ok).toBe(true);
    expect(coordinator.recover().ok).toBe(true);
    expect(coordinator.getSnapshot().lockHeld).toBe(false);
    expect(coordinator.getSnapshot().status).toBe("IDLE");
  });

  it("fail-closed on accept/cancel without pending request", () => {
    const { coordinator } = readyPair();
    expect(coordinator.acceptCapture({ localUri: "x", width: 1, height: 1 }).ok).toBe(false);
    expect(coordinator.cancelCapture().ok).toBe(false);
    expect(coordinator.rejectCapture().ok).toBe(false);
  });
});
