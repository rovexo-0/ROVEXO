import { describe, expect, it } from "vitest";
import {
  createSmartMultiCameraSessionEngine,
  isSessionTransitionAllowed,
  SMART_MULTI_CAMERA_SESSION_ENGINE_V1,
  SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS,
} from "@/lib/media/smart-multi-camera-session";
import type { SessionEvent } from "@/lib/media/smart-multi-camera-session";

function startCapturingEngine() {
  const engine = createSmartMultiCameraSessionEngine();
  const started = engine.startSession({ sessionId: "sess-1", createdAt: 1_000 });
  expect(started.ok).toBe(true);
  const capturing = engine.beginCapturing();
  expect(capturing.ok).toBe(true);
  return engine;
}

function capture(
  engine: ReturnType<typeof createSmartMultiCameraSessionEngine>,
  id: string,
  uri = `blob://${id}`,
) {
  return engine.capturePhoto({
    photoId: id,
    localUri: uri,
    width: 100,
    height: 100,
    timestamp: 2_000,
  });
}

describe("Smart Multi Camera Session Engine v1.0 — Phase I", () => {
  it("exposes one canonical engine identity", () => {
    expect(SMART_MULTI_CAMERA_SESSION_ENGINE_V1.phase).toBe("I_SESSION_ENGINE");
    expect(SMART_MULTI_CAMERA_SESSION_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MULTI_CAMERA_SESSION_ENGINE_V1.maxPhotos).toBe(8);
    expect(SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS).toBe(8);
  });

  it("creates a session IDLE → STARTING → CAPTURING", () => {
    const engine = createSmartMultiCameraSessionEngine();
    expect(engine.getSnapshot().status).toBe("IDLE");

    const started = engine.startSession({ sessionId: "abc", createdAt: 10 });
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.session.status).toBe("STARTING");
    expect(started.session.sessionId).toBe("abc");
    expect(started.events.map((event) => event.type)).toEqual(["SessionStarted"]);

    const capturing = engine.beginCapturing();
    expect(capturing.ok).toBe(true);
    if (!capturing.ok) return;
    expect(capturing.session.status).toBe("CAPTURING");
  });

  it("rejects invalid transitions fail-closed", () => {
    const engine = createSmartMultiCameraSessionEngine();
    expect(engine.beginCapturing().ok).toBe(false);
    expect(engine.capturePhoto({ localUri: "x", width: 1, height: 1 }).ok).toBe(false);
    expect(engine.requestUpload().ok).toBe(false);

    expect(engine.startSession({ sessionId: "s1" }).ok).toBe(true);
    expect(engine.startSession({ sessionId: "s2" }).ok).toBe(false);
    expect(engine.requestUpload().ok).toBe(false);
    expect(isSessionTransitionAllowed("IDLE", "UPLOADING")).toBe(false);
    expect(isSessionTransitionAllowed("READY", "UPLOAD_REQUESTED")).toBe(true);
  });

  it("captures photos and assigns first as cover", () => {
    const engine = startCapturingEngine();
    const events: SessionEvent[] = [];
    engine.subscribe((event) => events.push(event));

    const first = capture(engine, "p1");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.session.photos).toHaveLength(1);
    expect(first.session.coverPhotoId).toBe("p1");
    expect(first.session.photos[0]?.isCover).toBe(true);
    expect(first.session.photos[0]?.order).toBe(0);

    const second = capture(engine, "p2");
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.session.photos).toHaveLength(2);
    expect(second.session.coverPhotoId).toBe("p1");
    expect(second.session.photos[1]?.isCover).toBe(false);
    expect(second.session.photos[1]?.order).toBe(1);
    expect(events.some((event) => event.type === "PhotoCaptured")).toBe(true);
    expect(events.some((event) => event.type === "CoverChanged")).toBe(true);
  });

  it("never exceeds max 8 photos", () => {
    const engine = startCapturingEngine();
    for (let index = 0; index < 8; index += 1) {
      expect(capture(engine, `p${index}`).ok).toBe(true);
    }
    const overflow = capture(engine, "p8");
    expect(overflow.ok).toBe(false);
    if (overflow.ok) return;
    expect(overflow.code).toBe("SESSION_CAPACITY");
    expect(engine.getSnapshot().photos).toHaveLength(8);
  });

  it("deletes photo, reindexes without gaps, reassigns cover", () => {
    const engine = startCapturingEngine();
    capture(engine, "a");
    capture(engine, "b");
    capture(engine, "c");

    const deleted = engine.deletePhoto("a");
    expect(deleted.ok).toBe(true);
    if (!deleted.ok) return;
    expect(deleted.session.photos.map((photo) => photo.photoId)).toEqual(["b", "c"]);
    expect(deleted.session.photos.map((photo) => photo.order)).toEqual([0, 1]);
    expect(deleted.session.coverPhotoId).toBe("b");
    expect(deleted.session.photos[0]?.isCover).toBe(true);
    expect(deleted.events.map((event) => event.type)).toEqual([
      "PhotoDeleted",
      "CoverChanged",
    ]);
  });

  it("reorders photos and sets first as cover", () => {
    const engine = startCapturingEngine();
    capture(engine, "a");
    capture(engine, "b");
    capture(engine, "c");

    const reordered = engine.reorderPhotos(2, 0);
    expect(reordered.ok).toBe(true);
    if (!reordered.ok) return;
    expect(reordered.session.photos.map((photo) => photo.photoId)).toEqual(["c", "a", "b"]);
    expect(reordered.session.coverPhotoId).toBe("c");
    expect(reordered.session.photos.every((photo, index) => photo.order === index)).toBe(true);
    expect(reordered.events.some((event) => event.type === "PhotoReordered")).toBe(true);
    expect(reordered.events.some((event) => event.type === "CoverChanged")).toBe(true);
  });

  it("cancels session and returns to IDLE", () => {
    const engine = startCapturingEngine();
    capture(engine, "a");
    const cancelled = engine.cancelSession();
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.session.status).toBe("IDLE");
    expect(cancelled.session.photos).toHaveLength(0);
    expect(cancelled.session.sessionId).toBe("");
    expect(cancelled.events.map((event) => event.type)).toEqual(["SessionCancelled"]);
  });

  it("Next only transitions READY → UPLOAD_REQUESTED (no upload side effects)", () => {
    const engine = startCapturingEngine();
    capture(engine, "a");
    expect(engine.requestUpload().ok).toBe(false);

    expect(engine.markReady().ok).toBe(true);
    const requested = engine.requestUpload();
    expect(requested.ok).toBe(true);
    if (!requested.ok) return;
    expect(requested.session.status).toBe("UPLOAD_REQUESTED");
    expect(requested.session.uploadState).toBe("requested");
    expect(requested.events.map((event) => event.type)).toEqual(["UploadRequested"]);
  });

  it("host upload signals COMPLETED and FAILED fail-closed", () => {
    const engine = startCapturingEngine();
    capture(engine, "a");
    expect(engine.markReady().ok).toBe(true);
    expect(engine.requestUpload().ok).toBe(true);

    expect(engine.notifyUploadCompleted().ok).toBe(false);
    expect(engine.notifyUploadStarted().ok).toBe(true);
    expect(engine.getSnapshot().status).toBe("UPLOADING");

    const failed = engine.notifyUploadFailed();
    expect(failed.ok).toBe(true);
    if (!failed.ok) return;
    expect(failed.session.status).toBe("FAILED");
    expect(failed.events.map((event) => event.type)).toEqual(["UploadFailed"]);

    expect(engine.markReady().ok).toBe(true);
    expect(engine.requestUpload().ok).toBe(true);
    expect(engine.notifyUploadStarted().ok).toBe(true);
    const completed = engine.notifyUploadCompleted();
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;
    expect(completed.session.status).toBe("COMPLETED");
    expect(completed.events.map((event) => event.type)).toEqual(["UploadCompleted"]);
    expect(engine.cancelSession().ok).toBe(false);
  });

  it("rejects invalid photo payloads and unknown deletes", () => {
    const engine = startCapturingEngine();
    expect(engine.capturePhoto({ localUri: "", width: 1, height: 1 }).ok).toBe(false);
    expect(engine.capturePhoto({ localUri: "x", width: 0, height: 1 }).ok).toBe(false);
    expect(engine.deletePhoto("missing").ok).toBe(false);
    expect(engine.reorderPhotos(0, 1).ok).toBe(false);
  });
});
