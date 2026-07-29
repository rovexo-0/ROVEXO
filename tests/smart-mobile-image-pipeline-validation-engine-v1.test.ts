import { describe, expect, it } from "vitest";
import {
  SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1,
  SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1,
  SMART_MOBILE_IMAGE_VALIDATION_MAX_BYTES,
  SMART_MOBILE_IMAGE_VALIDATION_MAX_IMAGES,
  SMART_MOBILE_IMAGE_VALIDATION_MIN_DIMENSION,
  createSmartMobileImagePipelineEngine,
  createSmartMobileImageValidationEngine,
  evaluateImageValidation,
  isValidationTransitionAllowed,
  type ReceiveValidationImageInput,
  type ValidationEngineEvent,
} from "@/lib/media/smart-mobile-image-pipeline";

function validInput(
  overrides: Partial<ReceiveValidationImageInput> &
    Pick<ReceiveValidationImageInput, "imageId" | "contentFingerprint">,
): ReceiveValidationImageInput {
  return {
    format: "jpeg",
    mimeType: "image/jpeg",
    extension: ".jpg",
    width: 1200,
    height: 1600,
    orientation: 1,
    byteLength: 48_000,
    at: 1,
    ...overrides,
  };
}

describe("Smart Mobile Image Validation Engine v1.0 — Phase II", () => {
  it("exposes Phase II validation-only identity and Phase I remains CERTIFIED", () => {
    expect(SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1.phase).toBe("II_VALIDATION_ENGINE");
    expect(SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1.ownsValidationOnly).toBe(true);
    expect(SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1.normalizationForbidden).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1.status).toBe("CERTIFIED");
  });

  it("passes a valid image RECEIVED → VALIDATING → VALID → READY", () => {
    const engine = createSmartMobileImageValidationEngine();
    const events: ValidationEngineEvent[] = [];
    engine.subscribe((event) => events.push(event));

    const bytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x04]);
    expect(
      engine.receiveImage(
        validInput({ imageId: "v1", contentFingerprint: "fp-v1", bytes }),
      ).ok,
    ).toBe(true);
    expect(engine.getSnapshot().status).toBe("RECEIVED");

    const result = engine.validate(2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toEqual({ status: "VALID" });
    expect(engine.getSnapshot().status).toBe("READY");
    expect(events.some((event) => event.type === "ValidationStarted")).toBe(true);
    expect(events.some((event) => event.type === "ValidationPassed")).toBe(true);
    expect(events.some((event) => event.type === "PipelineReady")).toBe(true);
  });

  it("rejects unsupported format, invalid MIME, and invalid extension", () => {
    expect(
      evaluateImageValidation(
        validInput({
          imageId: "f",
          contentFingerprint: "fp-f",
          format: "gif" as "jpeg",
        }),
        { existingImageIds: [], existingFingerprints: [], currentCount: 0 },
      ),
    ).toEqual({ status: "INVALID", reason: "UNSUPPORTED_FORMAT" });

    expect(
      evaluateImageValidation(
        validInput({
          imageId: "m",
          contentFingerprint: "fp-m",
          mimeType: "image/gif",
        }),
        { existingImageIds: [], existingFingerprints: [], currentCount: 0 },
      ),
    ).toEqual({ status: "INVALID", reason: "INVALID_MIME" });

    expect(
      evaluateImageValidation(
        validInput({
          imageId: "e",
          contentFingerprint: "fp-e",
          extension: ".gif",
        }),
        { existingImageIds: [], existingFingerprints: [], currentCount: 0 },
      ),
    ).toEqual({ status: "INVALID", reason: "INVALID_EXTENSION" });
  });

  it("rejects too small, too large, and oversized file", () => {
    expect(
      evaluateImageValidation(
        validInput({
          imageId: "s",
          contentFingerprint: "fp-s",
          width: SMART_MOBILE_IMAGE_VALIDATION_MIN_DIMENSION - 1,
          height: 100,
        }),
        { existingImageIds: [], existingFingerprints: [], currentCount: 0 },
      ),
    ).toEqual({ status: "INVALID", reason: "IMAGE_TOO_SMALL" });

    expect(
      evaluateImageValidation(
        validInput({
          imageId: "l",
          contentFingerprint: "fp-l",
          width: 20_000,
          height: 100,
        }),
        { existingImageIds: [], existingFingerprints: [], currentCount: 0 },
      ),
    ).toEqual({ status: "INVALID", reason: "IMAGE_TOO_LARGE" });

    expect(
      evaluateImageValidation(
        validInput({
          imageId: "big",
          contentFingerprint: "fp-big",
          byteLength: SMART_MOBILE_IMAGE_VALIDATION_MAX_BYTES + 1,
        }),
        { existingImageIds: [], existingFingerprints: [], currentCount: 0 },
      ),
    ).toEqual({ status: "INVALID", reason: "FILE_TOO_LARGE" });
  });

  it("rejects missing metadata and invalid orientation", () => {
    expect(
      evaluateImageValidation(
        validInput({
          imageId: " ",
          contentFingerprint: "fp-miss",
        }),
        { existingImageIds: [], existingFingerprints: [], currentCount: 0 },
      ),
    ).toEqual({ status: "INVALID", reason: "MISSING_METADATA" });

    expect(
      evaluateImageValidation(
        validInput({
          imageId: "o",
          contentFingerprint: "fp-o",
          orientation: 45 as 1,
        }),
        { existingImageIds: [], existingFingerprints: [], currentCount: 0 },
      ),
    ).toEqual({ status: "INVALID", reason: "INVALID_ORIENTATION" });
  });

  it("rejects corrupted JPEG and duplicates and max capacity", () => {
    const corrupt = Uint8Array.from([
      0xef, 0xbf, 0xbd, 0xef, 0xbf, 0xbd, 0xef, 0xbf, 0xbd, 0xef, 0xbf, 0xbd, 0x00, 0x43, 0x00,
      0x04,
    ]);
    expect(
      evaluateImageValidation(
        validInput({ imageId: "c", contentFingerprint: "fp-c", bytes: corrupt }),
        { existingImageIds: [], existingFingerprints: [], currentCount: 0 },
      ),
    ).toEqual({ status: "INVALID", reason: "CORRUPTED_IMAGE" });

    expect(
      evaluateImageValidation(validInput({ imageId: "a", contentFingerprint: "fp-a" }), {
        existingImageIds: ["a"],
        existingFingerprints: [],
        currentCount: 1,
      }),
    ).toEqual({ status: "INVALID", reason: "DUPLICATE_IMAGE" });

    expect(
      evaluateImageValidation(validInput({ imageId: "n", contentFingerprint: "fp-n" }), {
        existingImageIds: [],
        existingFingerprints: [],
        currentCount: SMART_MOBILE_IMAGE_VALIDATION_MAX_IMAGES,
      }),
    ).toEqual({ status: "INVALID", reason: "MAXIMUM_IMAGES_EXCEEDED" });
  });

  it("rejects through engine validate path with ImageRejected and REJECTED status", () => {
    const engine = createSmartMobileImageValidationEngine();
    const events: ValidationEngineEvent[] = [];
    engine.subscribe((event) => events.push(event));

    expect(
      engine.receiveImage(
        validInput({
          imageId: "bad-mime",
          contentFingerprint: "fp-bad-mime",
          mimeType: "image/gif",
        }),
      ).ok,
    ).toBe(true);
    expect(engine.getSnapshot().status).toBe("RECEIVED");

    const validated = engine.validate(3);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    expect(validated.result).toEqual({ status: "INVALID", reason: "INVALID_MIME" });
    expect(engine.getSnapshot().status).toBe("REJECTED");
    expect(events.some((event) => event.type === "ValidationFailed")).toBe(true);
    expect(events.some((event) => event.type === "ImageRejected")).toBe(true);

    expect(isValidationTransitionAllowed("RECEIVED", "READY")).toBe(false);
    expect(isValidationTransitionAllowed("RECEIVED", "VALIDATING")).toBe(true);
  });

  it("fail-closes illegal transitions to FAILED", () => {
    const engine = createSmartMobileImageValidationEngine();
    expect(
      engine.receiveImage(validInput({ imageId: "z", contentFingerprint: "fp-z" })).ok,
    ).toBe(true);
    expect(engine.validate(5).ok).toBe(true);
    expect(engine.getSnapshot().status).toBe("READY");
    // validate again from READY is illegal → FAILED
    const illegal = engine.validate(6);
    expect(illegal.ok).toBe(false);
    expect(engine.getSnapshot().status).toBe("FAILED");
  });

  it("regression — Phase I pipeline engine still receives/validates/normalizes", () => {
    const pipeline = createSmartMobileImagePipelineEngine();
    expect(
      pipeline.receiveImage({
        imageId: "p1",
        format: "jpeg",
        width: 100,
        height: 100,
        orientation: 1,
        byteLength: 1000,
        contentFingerprint: "fp-p1",
      }).ok,
    ).toBe(true);
    expect(pipeline.runPipeline().ok).toBe(true);
    expect(pipeline.getSnapshot().status).toBe("READY");
  });
});
