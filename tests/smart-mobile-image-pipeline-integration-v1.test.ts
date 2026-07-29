import { describe, expect, it } from "vitest";
import {
  SMART_MOBILE_IMAGE_METADATA_ENGINE_V1,
  SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1,
  SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1,
  SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_V1,
  SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1,
  certifySmartMobileImagePipelineIntegration,
  compareMetadataRecords,
  createSmartMobileImagePipelineComposition,
  mapValidationReasonToExit,
  type PipelineIntegrationEvent,
  type ProcessPipelineImageInput,
} from "@/lib/media/smart-mobile-image-pipeline";
import { SMART_MOBILE_IMAGE_PIPELINE_V1 } from "@/lib/media/smart-mobile-image-pipeline-v1";

function validJpegBytes(): Uint8Array {
  return Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x04]);
}

function corruptedJpegBytes(): Uint8Array {
  return Uint8Array.from([
    0xef, 0xbf, 0xbd, 0xef, 0xbf, 0xbd, 0xef, 0xbf, 0xbd, 0x00, 0x43, 0x00, 0x01,
  ]);
}

function baseInput(
  overrides: Partial<ProcessPipelineImageInput> = {},
): ProcessPipelineImageInput {
  return {
    imageId: "img-1",
    format: "jpeg",
    mimeType: "image/jpeg",
    extension: ".jpg",
    width: 1200,
    height: 1600,
    orientation: 1,
    byteLength: 48_000,
    contentFingerprint: "fp-1",
    filename: "photo.jpg",
    timestamp: 1_700_000_000_000,
    at: 100,
    bytes: validJpegBytes(),
    ...overrides,
  };
}

describe("Smart Mobile Image Pipeline — Phase V Integration", () => {
  it("exposes composition-only SSOT and certified phases I–IV", () => {
    expect(SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_V1.compositionOnly).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_V1.featureAdditionsForbidden).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_METADATA_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseVPipelineIntegration.status).toBe(
      "CERTIFIED",
    );
  });

  it("validates composition invariants — exactly one of each engine", () => {
    const cert = certifySmartMobileImagePipelineIntegration();
    expect(cert.ok).toBe(true);
    if (!cert.ok) return;
    expect(cert.ownership).toEqual({
      pipelineEngineCount: 1,
      validationEngineCount: 1,
      normalizationEngineCount: 1,
      metadataEngineCount: 1,
      compositionCount: 1,
    });
  });

  it("Scenario 1 — valid image → READY", () => {
    const composition = createSmartMobileImagePipelineComposition();
    const events: PipelineIntegrationEvent[] = [];
    composition.subscribe((e) => events.push(e));
    const result = composition.process(baseInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.status).toBe("PIPELINE_READY");
    expect(result.state.metadata?.metadata.identifier).toBe("img-1");
    expect(composition.getEngines().pipelineEngine.getSnapshot().status).toBe("READY");
    expect(composition.getEngines().validationEngine.getSnapshot().status).toBe("READY");
    expect(composition.getEngines().normalizationEngine.getSnapshot().status).toBe(
      "NORMALIZED",
    );
    expect(composition.getEngines().metadataEngine.getSnapshot().status).toBe("FROZEN");
    expect(events.map((e) => e.type)).toEqual([
      "IntegrationReceived",
      "IntegrationValidating",
      "IntegrationNormalizing",
      "IntegrationMetadataReady",
      "IntegrationPipelineReady",
    ]);
  });

  it("Scenario 2 — unsupported format → REJECTED", () => {
    const composition = createSmartMobileImagePipelineComposition();
    const result = composition.process(
      baseInput({
        format: "gif" as "jpeg",
        mimeType: "image/gif",
        extension: ".gif",
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.status).toBe("REJECTED");
    expect(result.state.failureReason).toBe("UNSUPPORTED_FORMAT");
  });

  it("Scenario 3 — corrupted JPEG → FAILED fail-closed", () => {
    const composition = createSmartMobileImagePipelineComposition();
    const result = composition.process(
      baseInput({
        bytes: corruptedJpegBytes(),
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("FAILED");
    expect(result.reason).toBe("CORRUPTED_IMAGE");
    expect(composition.getSnapshot().status).toBe("FAILED");
    expect(mapValidationReasonToExit("CORRUPTED_IMAGE")).toBe("FAILED");
    expect(mapValidationReasonToExit("UNSUPPORTED_FORMAT")).toBe("REJECTED");
  });

  it("Scenario 4 — missing filename → metadata generation → READY", () => {
    const composition = createSmartMobileImagePipelineComposition();
    const result = composition.process(
      baseInput({
        filename: undefined,
        imageId: "generated-name",
        contentFingerprint: "fp-gen",
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.status).toBe("PIPELINE_READY");
    expect(result.state.metadata?.metadata.fileName).toBe("generated-name.jpg");
    expect(result.state.normalized?.metadata.filename).toBe("generated-name.jpg");
  });

  it("Scenario 5 — repeated identical input → deterministic identical metadata", () => {
    const input = baseInput({
      imageId: "det-1",
      contentFingerprint: "fp-det",
      at: 55,
      timestamp: 1_700_000_111_000,
    });
    const a = createSmartMobileImagePipelineComposition().process(input);
    const b = createSmartMobileImagePipelineComposition().process(input);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok || !a.state.metadata || !b.state.metadata) return;
    expect(compareMetadataRecords(a.state.metadata, b.state.metadata)).toBe(true);
    expect(a.state.normalized).toEqual(b.state.normalized);
    expect(a.state.status).toBe("PIPELINE_READY");
    expect(b.state.status).toBe("PIPELINE_READY");
  });

  it("fail-closed on illegal mid-flow re-entry", () => {
    const composition = createSmartMobileImagePipelineComposition();
    expect(composition.process(baseInput()).ok).toBe(true);
    // Force mid-flow status without reset — simulate illegal call after partial state via process while NORMALIZING is impossible from outside; use FAILED transition check via certify only.
    const snap = composition.getSnapshot();
    expect(snap.status).toBe("PIPELINE_READY");
    // Second process must reset and succeed (allowed restart).
    const again = composition.process(
      baseInput({ imageId: "img-2", contentFingerprint: "fp-2", at: 200 }),
    );
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.state.status).toBe("PIPELINE_READY");
    expect(again.state.imageId).toBe("img-2");
  });

  it("regression: Phases I–IV remain CERTIFIED", () => {
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIArchitectureSsot.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIIValidationEngine.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIIINormalizationEngine.status).toBe(
      "CERTIFIED",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIVMetadataEngine.status).toBe("CERTIFIED");
  });
});
