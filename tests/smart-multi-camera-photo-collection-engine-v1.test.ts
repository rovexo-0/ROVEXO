import { describe, expect, it } from "vitest";
import {
  createSmartMultiCameraPhotoCollectionEngine,
  SMART_MULTI_CAMERA_PHOTO_COLLECTION_ENGINE_V1,
  type PhotoCollectionEvent,
} from "@/lib/media/smart-multi-camera-session";

describe("Smart Multi Camera Photo Collection Engine v1.0 — Phase IV", () => {
  it("exposes one logic-only collection engine identity", () => {
    expect(SMART_MULTI_CAMERA_PHOTO_COLLECTION_ENGINE_V1.phase).toBe(
      "IV_PHOTO_COLLECTION_ENGINE",
    );
    expect(SMART_MULTI_CAMERA_PHOTO_COLLECTION_ENGINE_V1.maxPhotos).toBe(8);
    expect(SMART_MULTI_CAMERA_PHOTO_COLLECTION_ENGINE_V1.uploadForbidden).toBe(true);
  });

  it("adds photos and assigns first as cover", () => {
    const engine = createSmartMultiCameraPhotoCollectionEngine();
    const events: PhotoCollectionEvent[] = [];
    engine.subscribe((event) => events.push(event));

    const first = engine.addPhoto({ photoId: "a", localUri: "blob://a", width: 1, height: 1 });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.state.coverPhotoId).toBe("a");
    expect(first.state.photos[0]?.isCover).toBe(true);

    const second = engine.addPhoto({ photoId: "b", localUri: "blob://b", width: 1, height: 1 });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.state.photos.map((photo) => photo.order)).toEqual([0, 1]);
    expect(second.state.coverPhotoId).toBe("a");
    expect(events.some((event) => event.type === "PhotoAdded")).toBe(true);
  });

  it("removes photo, reindexes, and reassigns cover", () => {
    const engine = createSmartMultiCameraPhotoCollectionEngine();
    engine.addPhoto({ photoId: "a", localUri: "blob://a", width: 1, height: 1 });
    engine.addPhoto({ photoId: "b", localUri: "blob://b", width: 1, height: 1 });
    engine.addPhoto({ photoId: "c", localUri: "blob://c", width: 1, height: 1 });

    const removed = engine.removePhoto("a");
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.state.photos.map((photo) => photo.photoId)).toEqual(["b", "c"]);
    expect(removed.state.photos.map((photo) => photo.order)).toEqual([0, 1]);
    expect(removed.state.coverPhotoId).toBe("b");
    expect(removed.events.map((event) => event.type)).toEqual([
      "PhotoRemoved",
      "CoverChanged",
    ]);
  });

  it("sets cover null when collection becomes empty", () => {
    const engine = createSmartMultiCameraPhotoCollectionEngine();
    engine.addPhoto({ photoId: "a", localUri: "blob://a", width: 1, height: 1 });
    const removed = engine.removePhoto("a");
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.state.photos).toHaveLength(0);
    expect(removed.state.coverPhotoId).toBeNull();
  });

  it("replaces a photo reference", () => {
    const engine = createSmartMultiCameraPhotoCollectionEngine();
    engine.addPhoto({ photoId: "a", localUri: "blob://a", width: 1, height: 1 });
    engine.addPhoto({ photoId: "b", localUri: "blob://b", width: 1, height: 1 });

    const replaced = engine.replacePhoto("b", {
      photoId: "b2",
      localUri: "blob://b2",
      width: 20,
      height: 20,
    });
    expect(replaced.ok).toBe(true);
    if (!replaced.ok) return;
    expect(replaced.state.photos.map((photo) => photo.photoId)).toEqual(["a", "b2"]);
    expect(replaced.state.photos[1]?.localUri).toBe("blob://b2");
    expect(replaced.events.some((event) => event.type === "PhotoReplaced")).toBe(true);
  });

  it("reorders photos and updates cover to first", () => {
    const engine = createSmartMultiCameraPhotoCollectionEngine();
    engine.addPhoto({ photoId: "a", localUri: "blob://a", width: 1, height: 1 });
    engine.addPhoto({ photoId: "b", localUri: "blob://b", width: 1, height: 1 });
    engine.addPhoto({ photoId: "c", localUri: "blob://c", width: 1, height: 1 });

    const reordered = engine.reorderPhotos(2, 0);
    expect(reordered.ok).toBe(true);
    if (!reordered.ok) return;
    expect(reordered.state.photos.map((photo) => photo.photoId)).toEqual(["c", "a", "b"]);
    expect(reordered.state.coverPhotoId).toBe("c");
    expect(reordered.events.some((event) => event.type === "PhotoReordered")).toBe(true);
  });

  it("enforces capacity and duplicate rejection fail-closed", () => {
    const engine = createSmartMultiCameraPhotoCollectionEngine();
    for (let index = 0; index < 8; index += 1) {
      expect(
        engine.addPhoto({
          photoId: `p${index}`,
          localUri: `blob://p${index}`,
          width: 1,
          height: 1,
        }).ok,
      ).toBe(true);
    }
    const overflow = engine.addPhoto({
      photoId: "p8",
      localUri: "blob://p8",
      width: 1,
      height: 1,
    });
    expect(overflow.ok).toBe(false);
    if (overflow.ok) return;
    expect(overflow.code).toBe("CAPACITY_REACHED");

    const engine2 = createSmartMultiCameraPhotoCollectionEngine();
    expect(engine2.addPhoto({ photoId: "x", localUri: "blob://x", width: 1, height: 1 }).ok).toBe(
      true,
    );
    const duplicate = engine2.addPhoto({ photoId: "x", localUri: "blob://x2", width: 1, height: 1 });
    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) return;
    expect(duplicate.code).toBe("DUPLICATE_PHOTO_ID");
  });

  it("validates collection and rejects invalid indexes", () => {
    const engine = createSmartMultiCameraPhotoCollectionEngine();
    expect(engine.validate().ok).toBe(true);
    engine.addPhoto({ photoId: "a", localUri: "blob://a", width: 1, height: 1 });
    engine.addPhoto({ photoId: "b", localUri: "blob://b", width: 1, height: 1 });
    expect(engine.validate().ok).toBe(true);
    expect(engine.getSnapshot().isValid).toBe(true);

    expect(engine.reorderPhotos(-1, 0).ok).toBe(false);
    expect(engine.reorderPhotos(0, 9).ok).toBe(false);
    expect(engine.removePhoto("missing").ok).toBe(false);
    expect(engine.addPhoto({ localUri: "", width: 1, height: 1 }).ok).toBe(false);
  });

  it("setCover moves photo to first position", () => {
    const engine = createSmartMultiCameraPhotoCollectionEngine();
    engine.addPhoto({ photoId: "a", localUri: "blob://a", width: 1, height: 1 });
    engine.addPhoto({ photoId: "b", localUri: "blob://b", width: 1, height: 1 });
    const cover = engine.setCover("b");
    expect(cover.ok).toBe(true);
    if (!cover.ok) return;
    expect(cover.state.photos.map((photo) => photo.photoId)).toEqual(["b", "a"]);
    expect(cover.state.coverPhotoId).toBe("b");
  });
});
