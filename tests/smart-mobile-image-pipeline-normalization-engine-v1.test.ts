import { describe, expect, it } from "vitest";
import {
  SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1,
  createSmartMobileImageNormalizationEngine,
  formatCanonicalTimestamp,
  isNormalizationTransitionAllowed,
  normalizeImageInput,
} from "@/lib/media/smart-mobile-image-pipeline/normalization-engine-v1";
import { SMART_MOBILE_IMAGE_PIPELINE_V1 } from "@/lib/media/smart-mobile-image-pipeline-v1";
import { SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1 } from "@/lib/media/smart-mobile-image-pipeline/pipeline-engine-v1";
import { SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1 } from "@/lib/media/smart-mobile-image-pipeline/validation-engine-v1";
import type { NormalizeImageInput } from "@/lib/media/smart-mobile-image-pipeline/normalization-types-v1";

function baseInput(overrides: Partial<NormalizeImageInput> = {}): NormalizeImageInput {
  return {
    imageId: " img-1 ",
    format: "jpeg",
    mimeType: "image/jpg",
    extension: "JPEG",
    width: 100,
    height: 200,
    orientation: 1,
    byteLength: 1024,
    contentFingerprint: " abc ",
    filename: "folder/My Photo.JPEG",
    timestamp: 1_700_000_000_000,
    at: 42,
    ...overrides,
  };
}

describe("Smart Mobile Image Pipeline — Phase III Normalization Engine", () => {
  it("exposes normalization-only SSOT flags", () => {
    expect(SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1.ownsNormalizationOnly).toBe(true);
    expect(SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1.validationForbidden).toBe(true);
    expect(SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1.pixelDecodeForbidden).toBe(true);
    expect(SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1.compressionForbidden).toBe(true);
    expect(SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1.imageByteModificationForbidden).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIIINormalizationEngine.status).toBe(
      "CERTIFIED",
    );
  });

  it("canonicalizes MIME by format", () => {
    const jpeg = normalizeImageInput(baseInput({ format: "jpeg", mimeType: "image/jpg" }));
    const png = normalizeImageInput(
      baseInput({ format: "png", mimeType: "image/x-png", extension: ".PNG" }),
    );
    const webp = normalizeImageInput(
      baseInput({ format: "webp", mimeType: "IMAGE/WEBP", extension: "webp" }),
    );
    expect(jpeg.ok && jpeg.image.metadata.mimeType).toBe("image/jpeg");
    expect(png.ok && png.image.metadata.mimeType).toBe("image/png");
    expect(webp.ok && webp.image.metadata.mimeType).toBe("image/webp");
  });

  it("canonicalizes extensions by format", () => {
    const jpeg = normalizeImageInput(baseInput({ format: "jpeg", extension: ".JPEG" }));
    const png = normalizeImageInput(baseInput({ format: "png", extension: "png" }));
    const webp = normalizeImageInput(baseInput({ format: "webp", extension: ".WEBP" }));
    expect(jpeg.ok && jpeg.image.metadata.extension).toBe(".jpg");
    expect(png.ok && png.image.metadata.extension).toBe(".png");
    expect(webp.ok && webp.image.metadata.extension).toBe(".webp");
  });

  it("normalizes orientation and swaps dimensions when required", () => {
    const upright = normalizeImageInput(baseInput({ orientation: 1, width: 100, height: 200 }));
    const rotated = normalizeImageInput(baseInput({ orientation: 6, width: 100, height: 200 }));
    expect(upright.ok && upright.image.metadata.orientation).toBe(1);
    expect(upright.ok && upright.image.metadata.width).toBe(100);
    expect(upright.ok && upright.image.metadata.height).toBe(200);
    expect(rotated.ok && rotated.image.metadata.orientation).toBe(1);
    expect(rotated.ok && rotated.image.metadata.width).toBe(200);
    expect(rotated.ok && rotated.image.metadata.height).toBe(100);
    expect(rotated.ok && rotated.image.metadata.originalOrientation).toBe(6);
    expect(rotated.ok && rotated.image.metadata.originalWidth).toBe(100);
    expect(rotated.ok && rotated.image.metadata.originalHeight).toBe(200);
  });

  it("normalizes metadata without losing originals", () => {
    const result = normalizeImageInput(baseInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.image.metadata.originalMimeType).toBe("image/jpg");
    expect(result.image.metadata.originalExtension).toBe("JPEG");
    expect(result.image.metadata.originalFilename).toBe("folder/My Photo.JPEG");
    expect(result.image.metadata.originalImageId).toBe(" img-1 ");
    expect(result.image.metadata.byteLength).toBe(1024);
  });

  it("normalizes filename to stem + canonical extension", () => {
    const result = normalizeImageInput(baseInput());
    expect(result.ok && result.image.metadata.filename).toBe("My_Photo.jpg");
  });

  it("normalizes identifier by trim", () => {
    const result = normalizeImageInput(baseInput({ imageId: "  id-42  " }));
    expect(result.ok && result.image.imageId).toBe("id-42");
    expect(result.ok && result.image.metadata.imageId).toBe("id-42");
    expect(result.ok && result.image.metadata.originalImageId).toBe("  id-42  ");
  });

  it("normalizes timestamp to deterministic ISO-8601", () => {
    const ts = 1_700_000_000_000;
    expect(formatCanonicalTimestamp(ts)).toBe(new Date(ts).toISOString());
    const result = normalizeImageInput(baseInput({ timestamp: ts }));
    expect(result.ok && result.image.metadata.timestamp).toBe(formatCanonicalTimestamp(ts));
    expect(result.ok && result.image.metadata.originalTimestamp).toBe(ts);
  });

  it("returns immutable output copies from the engine", () => {
    const engine = createSmartMobileImageNormalizationEngine();
    expect(engine.load(baseInput()).ok).toBe(true);
    const normalized = engine.normalize(99);
    expect(normalized.ok).toBe(true);
    if (!normalized.ok || !normalized.image) return;

    normalized.image.metadata.filename = "mutated.jpg";
    normalized.state.image!.metadata.filename = "mutated-state.jpg";

    const snap = engine.getSnapshot();
    expect(snap.image?.metadata.filename).toBe("My_Photo.jpg");
  });

  it("repeated normalization is deterministic", () => {
    const input = baseInput({ orientation: 6 });
    const a = normalizeImageInput(input);
    const b = normalizeImageInput(input);
    expect(a).toEqual(b);
  });

  it("illegal transition fail-closes", () => {
    const engine = createSmartMobileImageNormalizationEngine();
    expect(engine.load(baseInput()).ok).toBe(true);
    expect(engine.normalize(1).ok).toBe(true);
    const again = engine.normalize(2);
    expect(again.ok).toBe(false);
    if (again.ok) return;
    expect(again.code).toBe("INVALID_TRANSITION");
    expect(engine.getSnapshot().status).toBe("FAILED");
  });

  it("fail closed on invalid input during normalize", () => {
    const engine = createSmartMobileImageNormalizationEngine();
    expect(
      engine.load(baseInput({ width: 0 })).ok,
    ).toBe(true);
    const result = engine.normalize(5);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.status).toBe("FAILED");
    expect(result.state.failureReason).toBe("INVALID_INPUT");
  });

  it("emits NormalizationStarted / Completed / Failed", () => {
    const engine = createSmartMobileImageNormalizationEngine();
    const events: string[] = [];
    engine.subscribe((e) => events.push(e.type));
    engine.load(baseInput());
    engine.normalize(1);
    expect(events).toEqual(["NormalizationStarted", "NormalizationCompleted"]);

    const engine2 = createSmartMobileImageNormalizationEngine();
    const events2: string[] = [];
    engine2.subscribe((e) => events2.push(e.type));
    engine2.load(baseInput({ width: -1 }));
    engine2.normalize(1);
    expect(events2).toEqual(["NormalizationStarted", "NormalizationFailed"]);
  });

  it("documents legal transitions", () => {
    expect(isNormalizationTransitionAllowed("NOT_NORMALIZED", "NORMALIZING")).toBe(true);
    expect(isNormalizationTransitionAllowed("NORMALIZING", "NORMALIZED")).toBe(true);
    expect(isNormalizationTransitionAllowed("NORMALIZING", "FAILED")).toBe(true);
    expect(isNormalizationTransitionAllowed("NORMALIZED", "NORMALIZING")).toBe(false);
  });

  it("regression: Phase I remains CERTIFIED", () => {
    expect(SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIArchitectureSsot.status).toBe("CERTIFIED");
  });

  it("regression: Phase II remains CERTIFIED", () => {
    expect(SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIIValidationEngine.status).toBe("CERTIFIED");
  });
});
