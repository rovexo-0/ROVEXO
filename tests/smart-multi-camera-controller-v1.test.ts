import { describe, expect, it } from "vitest";
import {
  CAMERA_FLASH_CYCLE,
  createSmartMultiCameraController,
  createSmartMultiCameraSessionEngine,
  isCameraControllerTransitionAllowed,
  SMART_MULTI_CAMERA_CONTROLLER_V1,
  type CameraControllerEvent,
} from "@/lib/media/smart-multi-camera-session";

function readyController() {
  const controller = createSmartMultiCameraController();
  expect(controller.initialize().ok).toBe(true);
  expect(controller.setPermission("CHECKING").ok).toBe(true);
  const granted = controller.setPermission("GRANTED");
  expect(granted.ok).toBe(true);
  if (!granted.ok) return controller;
  expect(granted.state.status).toBe("READY");
  expect(granted.events.map((event) => event.type)).toEqual([
    "PermissionGranted",
    "ControllerInitialized",
  ]);
  return controller;
}

describe("Smart Multi Camera Controller v1.0 — Phase II", () => {
  it("exposes one platform-agnostic controller identity", () => {
    expect(SMART_MULTI_CAMERA_CONTROLLER_V1.phase).toBe("II_CAMERA_CONTROLLER");
    expect(SMART_MULTI_CAMERA_CONTROLLER_V1.platformAgnostic).toBe(true);
    expect(SMART_MULTI_CAMERA_CONTROLLER_V1.hardwareAccessForbidden).toBe(true);
    expect(SMART_MULTI_CAMERA_CONTROLLER_V1.uiForbidden).toBe(true);
    expect(CAMERA_FLASH_CYCLE).toEqual(["off", "auto", "on"]);
  });

  it("initializes UNINITIALIZED → INITIALIZING → READY", () => {
    const controller = createSmartMultiCameraController();
    expect(controller.getSnapshot().status).toBe("UNINITIALIZED");
    expect(controller.initialize().ok).toBe(true);
    expect(controller.getSnapshot().status).toBe("INITIALIZING");
    expect(controller.setPermission("GRANTED").ok).toBe(true);
    expect(controller.getSnapshot().status).toBe("READY");
    expect(controller.getSnapshot().permission).toBe("GRANTED");
  });

  it("handles permission denied and blocked fail-closed", () => {
    const denied = createSmartMultiCameraController();
    expect(denied.initialize().ok).toBe(true);
    const result = denied.setPermission("DENIED");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.status).toBe("PERMISSION_DENIED");
    expect(result.events.some((event) => event.type === "PermissionDenied")).toBe(true);
    expect(denied.switchCamera().ok).toBe(false);

    const blocked = createSmartMultiCameraController();
    expect(blocked.initialize().ok).toBe(true);
    expect(blocked.setPermission("BLOCKED").ok).toBe(true);
    expect(blocked.getSnapshot().status).toBe("PERMISSION_DENIED");
    expect(blocked.setFlashMode("on").ok).toBe(false);
  });

  it("rejects operations when permission is not GRANTED", () => {
    const controller = createSmartMultiCameraController();
    expect(controller.initialize().ok).toBe(true);
    expect(controller.pause().ok).toBe(false);
    expect(controller.switchCamera().ok).toBe(false);
    expect(controller.cycleFlashMode().ok).toBe(false);
  });

  it("cycles flash OFF → AUTO → ON → OFF", () => {
    const controller = readyController();
    expect(controller.setFlashMode("off").ok).toBe(true);
    expect(controller.cycleFlashMode().ok).toBe(true);
    expect(controller.getSnapshot().flashMode).toBe("auto");
    expect(controller.cycleFlashMode().ok).toBe(true);
    expect(controller.getSnapshot().flashMode).toBe("on");
    expect(controller.cycleFlashMode().ok).toBe(true);
    expect(controller.getSnapshot().flashMode).toBe("off");
  });

  it("switches camera with only one active facing", () => {
    const controller = readyController();
    const events: CameraControllerEvent[] = [];
    controller.subscribe((event) => events.push(event));
    expect(controller.getSnapshot().activeCamera).toBe("back");
    expect(controller.switchCamera().ok).toBe(true);
    expect(controller.getSnapshot().activeCamera).toBe("front");
    expect(controller.setActiveCamera("back").ok).toBe(true);
    expect(events.filter((event) => event.type === "CameraChanged")).toHaveLength(2);
  });

  it("pauses and resumes", () => {
    const controller = readyController();
    const paused = controller.pause();
    expect(paused.ok).toBe(true);
    if (!paused.ok) return;
    expect(paused.state.status).toBe("PAUSED");
    expect(paused.events.map((event) => event.type)).toEqual(["ControllerPaused"]);

    const resumed = controller.resume();
    expect(resumed.ok).toBe(true);
    if (!resumed.ok) return;
    expect(resumed.state.status).toBe("READY");
    expect(resumed.events.map((event) => event.type)).toEqual(["ControllerResumed"]);
  });

  it("attaches exactly one session and detaches", () => {
    const controller = readyController();
    const engine = createSmartMultiCameraSessionEngine();
    expect(engine.startSession({ sessionId: "sess-a" }).ok).toBe(true);
    const session = engine.getSnapshot();

    expect(controller.attachSession(session).ok).toBe(true);
    expect(controller.getSnapshot().attachedSessionId).toBe("sess-a");
    expect(
      controller.attachSession({
        sessionId: "sess-b",
        flashMode: "auto",
        activeCamera: "back",
      }).ok,
    ).toBe(false);

    expect(controller.detachSession().ok).toBe(true);
    expect(controller.getSnapshot().attachedSessionId).toBeNull();
    expect(controller.detachSession().ok).toBe(false);
  });

  it("stops and recovers from session loss without corrupting Session Engine", () => {
    const controller = readyController();
    const engine = createSmartMultiCameraSessionEngine();
    expect(engine.startSession({ sessionId: "sess-x" }).ok).toBe(true);
    expect(engine.beginCapturing().ok).toBe(true);
    expect(controller.attachSession(engine.getSnapshot()).ok).toBe(true);

    const lost = controller.notifySessionLost("sess-x");
    expect(lost.ok).toBe(true);
    if (!lost.ok) return;
    expect(lost.state.status).toBe("STOPPED");
    expect(lost.state.attachedSessionId).toBeNull();
    expect(lost.events.map((event) => event.type)).toEqual(["ControllerStopped"]);

    // Session Engine untouched / still valid
    expect(engine.getSnapshot().sessionId).toBe("sess-x");
    expect(engine.getSnapshot().status).toBe("CAPTURING");

    expect(controller.recover().ok).toBe(true);
    expect(controller.getSnapshot().status).toBe("INITIALIZING");
  });

  it("handles interruption recovery and invalid transitions fail-closed", () => {
    const controller = readyController();
    expect(controller.notifyInterruption().ok).toBe(true);
    expect(controller.getSnapshot().status).toBe("PAUSED");
    expect(controller.recover().ok).toBe(true);
    expect(controller.getSnapshot().status).toBe("READY");

    expect(controller.initialize().ok).toBe(false);
    expect(isCameraControllerTransitionAllowed("UNINITIALIZED", "READY")).toBe(false);
    expect(isCameraControllerTransitionAllowed("READY", "PAUSED")).toBe(true);

    expect(controller.stop().ok).toBe(true);
    expect(controller.getSnapshot().status).toBe("STOPPED");
    expect(controller.switchCamera().ok).toBe(false);
    expect(controller.pause().ok).toBe(false);
  });
});
