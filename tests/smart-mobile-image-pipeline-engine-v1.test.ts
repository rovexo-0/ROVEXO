import { describe, expect, it } from "vitest";
import {
  SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1,
  SMART_MOBILE_IMAGE_PIPELINE_MAX_IMAGES,
  createSmartMobileImagePipelineEngine,
  isPipelineTransitionAllowed,
  type PipelineEvent,
  type ReceivePipelineImageInput,
} from "@/lib/media/smart-mobile-image-pipeline";

function validInput(
  overrides: Partial<ReceivePipelineImageInput> &
    Pick<ReceivePipelineImageInput, "imageId" | "contentFingerprint">,
): ReceivePipelineImageInput {
  return {
    format: "jpeg",
    width: 1200,
    height: 1600,
    orientation: 1,
    byteLength: 48_000,
    ...overrides,
  };
}

describe("Smart Mobile Image Pipeline Engine v1.0 — Phase I", () => {
  it("exposes Phase I logic-only identity", () => {
    expect(SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1.phase).toBe("I_ARCHITECTURE_SSOT_FOUNDATION");
    expect(SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1.uiForbidden).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1.networkForbidden).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1.maxImages).toBe(SMART_MOBILE_IMAGE_PIPELINE_MAX_IMAGES);
  });

  it("accepts a valid image through receive → validate → normalize → READY", () => {
    const engine = createSmartMobileImagePipelineEngine();
    const events: PipelineEvent[] = [];
    engine.subscribe((event) => events.push(event));

    const bytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x04]);
    expect(
      engine.receiveImage(
        validInput({
          imageId: "img-1",
          contentFingerprint: "fp-1",
          bytes,
          localUri: "blob://img-1",
        }),
      ).ok,
    ).toBe(true);
    expect(engine.getSnapshot().status).toBe("RECEIVED");
    expect(engine.getSnapshot().images[0]!.metadata.jpegSoiValid).toBe(true);

    expect(engine.runPipeline().ok).toBe(true);
    const snap = engine.getSnapshot();
    expect(snap.status).toBe("READY");
    expect(snap.images[0]!.metadata.normalized).toBe(true);
    expect(snap.images[0]!.validatedAt).not.toBeNull();
    expect(snap.images[0]!.normalizedAt).not.toBeNull();
    expect(events.some((event) => event.type === "ImageReceived")).toBe(true);
    expect(events.some((event) => event.type === "ImageValidated")).toBe(true);
    expect(events.some((event) => event.type === "ImageNormalized")).toBe(true);
    expect(events.some((event) => event.type === "PipelineReady")).toBe(true);
  });

  it("rejects invalid format, dimensions, and orientation fail-closed", () => {
    const engine = createSmartMobileImagePipelineEngine();
    expect(
      engine.receiveImage(
        validInput({
          imageId: "bad-format",
          contentFingerprint: "fp-bad-format",
          format: "gif" as "jpeg",
        }),
      ).ok,
    ).toBe(false);
    expect(
      engine.receiveImage(
        validInput({
          imageId: "bad-dim",
          contentFingerprint: "fp-bad-dim",
          width: 0,
        }),
      ).ok,
    ).toBe(false);
    expect(
      engine.receiveImage(
        validInput({
          imageId: "bad-orient",
          contentFingerprint: "fp-bad-orient",
          orientation: 45 as 1,
        }),
      ).ok,
    ).toBe(false);
    expect(engine.getSnapshot().status).toBe("EMPTY");
  });

  it("rejects corrupted JPEG bytes", () => {
    const engine = createSmartMobileImagePipelineEngine();
    const corrupt = Uint8Array.from([
      0xef, 0xbf, 0xbd, 0xef, 0xbf, 0xbd, 0xef, 0xbf, 0xbd, 0xef, 0xbf, 0xbd, 0x00, 0x43, 0x00,
      0x04,
    ]);
    const result = engine.receiveImage(
      validInput({
        imageId: "corrupt",
        contentFingerprint: "fp-corrupt",
        bytes: corrupt,
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("CORRUPTED_IMAGE");
  });

  it("rejects duplicate image id and content fingerprint", () => {
    const engine = createSmartMobileImagePipelineEngine();
    expect(
      engine.receiveImage(validInput({ imageId: "a", contentFingerprint: "fp-a" })).ok,
    ).toBe(true);
    expect(
      engine.receiveImage(validInput({ imageId: "a", contentFingerprint: "fp-b" })).ok,
    ).toBe(false);
    expect(
      engine.receiveImage(validInput({ imageId: "b", contentFingerprint: "fp-a" })).ok,
    ).toBe(false);
  });

  it("normalizes orientation by swapping dimensions for EXIF 6", () => {
    const engine = createSmartMobileImagePipelineEngine();
    expect(
      engine.receiveImage(
        validInput({
          imageId: "rot",
          contentFingerprint: "fp-rot",
          width: 100,
          height: 200,
          orientation: 6,
        }),
      ).ok,
    ).toBe(true);
    expect(engine.runPipeline().ok).toBe(true);
    const meta = engine.getSnapshot().images[0]!.metadata;
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(100);
    expect(meta.orientation).toBe(1);
    expect(meta.normalized).toBe(true);
  });

  it("exposes metadata on READY snapshots without aliasing internal state", () => {
    const engine = createSmartMobileImagePipelineEngine();
    expect(
      engine.receiveImage(validInput({ imageId: "meta", contentFingerprint: "fp-meta" })).ok,
    ).toBe(true);
    expect(engine.runPipeline().ok).toBe(true);
    const a = engine.getSnapshot();
    const b = engine.getSnapshot();
    expect(a).not.toBe(b);
    expect(a.images[0]).not.toBe(b.images[0]);
    expect(a.images[0]!.metadata).toEqual(b.images[0]!.metadata);
    (a.images[0]!.metadata as { width: number }).width = 1;
    expect(engine.getSnapshot().images[0]!.metadata.width).toBe(1200);
  });

  it("rejects invalid transitions and supports fail-closed FAILED", () => {
    const engine = createSmartMobileImagePipelineEngine();
    expect(engine.validatePipeline().ok).toBe(false);
    expect(engine.normalizePipeline().ok).toBe(false);
    expect(isPipelineTransitionAllowed("EMPTY", "READY")).toBe(false);
    expect(isPipelineTransitionAllowed("EMPTY", "RECEIVED")).toBe(true);

    expect(
      engine.receiveImage(validInput({ imageId: "x", contentFingerprint: "fp-x" })).ok,
    ).toBe(true);
    expect(engine.failPipeline("UNRECOVERABLE").ok).toBe(true);
    expect(engine.getSnapshot().status).toBe("FAILED");
    expect(engine.getSnapshot().failureClass).toBe("UNRECOVERABLE");
    expect(engine.normalizePipeline().ok).toBe(false);
    expect(engine.resetPipeline().ok).toBe(true);
    expect(engine.getSnapshot().status).toBe("EMPTY");
  });

  it("enforces maximum image count", () => {
    const engine = createSmartMobileImagePipelineEngine();
    for (let index = 0; index < SMART_MOBILE_IMAGE_PIPELINE_MAX_IMAGES; index += 1) {
      expect(
        engine.receiveImage(
          validInput({
            imageId: `cap-${index}`,
            contentFingerprint: `fp-cap-${index}`,
          }),
        ).ok,
      ).toBe(true);
    }
    const overflow = engine.receiveImage(
      validInput({ imageId: "overflow", contentFingerprint: "fp-overflow" }),
    );
    expect(overflow.ok).toBe(false);
    if (overflow.ok) return;
    expect(overflow.code).toBe("CAPACITY_REACHED");
  });
});
