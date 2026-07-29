import { describe, expect, it } from "vitest";
import {
  createSmartMultiCameraUploadQueue,
  isUploadQueueTransitionAllowed,
  SMART_MULTI_CAMERA_UPLOAD_QUEUE_V1,
  type UploadQueueEvent,
} from "@/lib/media/smart-multi-camera-session";

function sampleItems(count: number) {
  return Array.from({ length: count }, (_, order) => ({
    photoId: `p${order}`,
    localUri: `blob://p${order}`,
    order,
  }));
}

function readyQueue(count = 2) {
  const queue = createSmartMultiCameraUploadQueue();
  expect(queue.createQueue({ sessionId: "sess-1", items: sampleItems(count) }).ok).toBe(true);
  expect(queue.validateQueue().ok).toBe(true);
  return queue;
}

describe("Smart Multi Camera Upload Queue v1.0 — Phase V", () => {
  it("exposes one network-free upload queue identity", () => {
    expect(SMART_MULTI_CAMERA_UPLOAD_QUEUE_V1.phase).toBe("V_UPLOAD_QUEUE");
    expect(SMART_MULTI_CAMERA_UPLOAD_QUEUE_V1.maxPhotos).toBe(8);
    expect(SMART_MULTI_CAMERA_UPLOAD_QUEUE_V1.networkForbidden).toBe(true);
    expect(SMART_MULTI_CAMERA_UPLOAD_QUEUE_V1.httpForbidden).toBe(true);
    expect(SMART_MULTI_CAMERA_UPLOAD_QUEUE_V1.oneQueuePerSession).toBe(true);
  });

  it("creates and validates a queue matching contiguous collection order", () => {
    const queue = createSmartMultiCameraUploadQueue();
    const events: UploadQueueEvent[] = [];
    queue.subscribe((event) => events.push(event));

    const created = queue.createQueue({
      sessionId: "sess-1",
      items: sampleItems(3),
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.state.status).toBe("CREATED");
    expect(created.state.items.map((item) => item.order)).toEqual([0, 1, 2]);

    const validated = queue.validateQueue();
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    expect(validated.state.status).toBe("READY");
    expect(events.map((event) => event.type)).toEqual(["QueueCreated", "QueueValidated"]);
  });

  it("rejects empty, duplicate, capacity, and invalid order fail-closed", () => {
    const queue = createSmartMultiCameraUploadQueue();
    expect(queue.createQueue({ sessionId: "s", items: [] }).ok).toBe(false);

    expect(
      queue.createQueue({
        sessionId: "s",
        items: [
          { photoId: "a", localUri: "blob://a", order: 0 },
          { photoId: "a", localUri: "blob://a2", order: 1 },
        ],
      }).ok,
    ).toBe(false);

    expect(
      queue.createQueue({
        sessionId: "s",
        items: sampleItems(9),
      }).ok,
    ).toBe(false);

    expect(
      queue.createQueue({
        sessionId: "s",
        items: [
          { photoId: "a", localUri: "blob://a", order: 0 },
          { photoId: "b", localUri: "blob://b", order: 2 },
        ],
      }).ok,
    ).toBe(false);
  });

  it("requests upload without performing network I/O", () => {
    const queue = readyQueue();
    const requested = queue.requestUpload();
    expect(requested.ok).toBe(true);
    if (!requested.ok) return;
    expect(requested.state.status).toBe("UPLOAD_REQUESTED");
    expect(requested.events.map((event) => event.type)).toEqual(["UploadRequested"]);
  });

  it("completes host upload signals", () => {
    const queue = readyQueue();
    expect(queue.requestUpload().ok).toBe(true);
    expect(queue.notifyUploadStarted().ok).toBe(true);
    expect(queue.getSnapshot().status).toBe("UPLOADING");
    const completed = queue.notifyUploadCompleted();
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;
    expect(completed.state.status).toBe("COMPLETED");
    expect(completed.events.map((event) => event.type)).toEqual(["UploadCompleted"]);
    expect(queue.cancelQueue().ok).toBe(false);
  });

  it("handles failure, cancel, and reset transitions", () => {
    const queue = readyQueue();
    expect(queue.requestUpload().ok).toBe(true);
    expect(queue.notifyUploadStarted().ok).toBe(true);
    const failed = queue.notifyUploadFailed();
    expect(failed.ok).toBe(true);
    if (!failed.ok) return;
    expect(failed.state.status).toBe("FAILED");

    expect(queue.requestUpload().ok).toBe(true);
    expect(queue.cancelQueue().ok).toBe(true);
    expect(queue.getSnapshot().status).toBe("CANCELLED");

    const reset = queue.resetQueue();
    expect(reset.ok).toBe(true);
    if (!reset.ok) return;
    expect(reset.state.status).toBe("EMPTY");
    expect(reset.state.items).toHaveLength(0);
    expect(reset.state.sessionId).toBeNull();
  });

  it("enforces one queue and invalid transitions fail-closed", () => {
    const queue = readyQueue();
    expect(
      queue.createQueue({ sessionId: "sess-2", items: sampleItems(1) }).ok,
    ).toBe(false);
    expect(queue.notifyUploadCompleted().ok).toBe(false);
    expect(isUploadQueueTransitionAllowed("EMPTY", "UPLOADING")).toBe(false);
    expect(isUploadQueueTransitionAllowed("READY", "UPLOAD_REQUESTED")).toBe(true);
  });
});
