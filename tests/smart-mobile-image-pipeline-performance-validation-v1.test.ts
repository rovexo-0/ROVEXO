import { describe, expect, it } from "vitest";
import {
  SMART_MOBILE_IMAGE_METADATA_ENGINE_V1,
  SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1,
  SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1,
  SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_V1,
  SMART_MOBILE_IMAGE_PIPELINE_PERFORMANCE_VALIDATION_V1,
  SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1,
  compareMetadataRecords,
  createMetadataRecord,
  createMetadataSnapshot,
  createSmartMobileImagePipelineComposition,
  normalizeImageInput,
  runSmartMobileImagePipelinePerformanceBenchmarks,
  type NormalizeImageInput,
  type ProcessPipelineImageInput,
} from "@/lib/media/smart-mobile-image-pipeline";
import { SMART_MOBILE_IMAGE_PIPELINE_V1 } from "@/lib/media/smart-mobile-image-pipeline-v1";

describe("Smart Mobile Image Pipeline — Phase VI Performance Validation", () => {
  it("exposes performance-only SSOT with contract freeze flags", () => {
    expect(SMART_MOBILE_IMAGE_PIPELINE_PERFORMANCE_VALIDATION_V1.phase).toBe(
      "VI_PERFORMANCE_VALIDATION",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_PERFORMANCE_VALIDATION_V1.behaviouralChangesForbidden).toBe(
      true,
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_PERFORMANCE_VALIDATION_V1.apiChangesForbidden).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_PERFORMANCE_VALIDATION_V1.publicContractChangesForbidden).toBe(
      true,
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseVIPerformanceValidation.status).toBe(
      "CERTIFIED",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_V1.status).toBe("CERTIFIED");
  });

  it("runs performance benchmarks to completion", () => {
    const results = runSmartMobileImagePipelinePerformanceBenchmarks(50);
    expect(results.length).toBeGreaterThanOrEqual(7);
    for (const result of results) {
      expect(result.iterations).toBeGreaterThan(0);
      expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.elapsedMs)).toBe(true);
    }
  });

  it("preserves deterministic normalization under repeated runs", () => {
    const input: NormalizeImageInput = {
      imageId: "det-perf",
      format: "jpeg",
      mimeType: "image/jpg",
      extension: ".JPEG",
      width: 100,
      height: 200,
      orientation: 6,
      byteLength: 1024,
      contentFingerprint: "fp-det",
      filename: "a/b Photo.JPEG",
      timestamp: 1_700_000_000_000,
      at: 9,
    };
    const first = normalizeImageInput(input);
    for (let i = 0; i < 100; i++) {
      expect(normalizeImageInput(input)).toEqual(first);
    }
  });

  it("preserves immutable snapshots under repeated creation", () => {
    const record = createMetadataRecord({
      identifier: "snap-perf",
      fingerprint: "fp-snap",
      width: 10,
      height: 20,
      orientation: 1,
      mimeType: "image/jpeg",
      extension: ".jpg",
      fileName: "x.jpg",
      fileSize: 100,
      timestamp: 1,
      format: "jpeg",
      at: 1,
    });
    expect(record).not.toBeNull();
    if (!record) return;
    const snap = createMetadataSnapshot(record, 2);
    const leaked = snap.record.metadata as unknown as { fileName: string };
    leaked.fileName = "mutated.jpg";
    expect(record.metadata.fileName).toBe("x.jpg");
    expect(createMetadataSnapshot(record, 3).record.metadata.fileName).toBe("x.jpg");
  });

  it("preserves deterministic composition metadata", () => {
    const input: ProcessPipelineImageInput = {
      imageId: "comp-det",
      format: "jpeg",
      mimeType: "image/jpeg",
      extension: ".jpg",
      width: 1200,
      height: 1600,
      orientation: 1,
      byteLength: 48_000,
      contentFingerprint: "fp-comp-det",
      filename: "photo.jpg",
      timestamp: 1_700_000_000_000,
      at: 42,
      bytes: Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x04]),
    };
    const a = createSmartMobileImagePipelineComposition().process(input);
    const b = createSmartMobileImagePipelineComposition().process(input);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok || !a.state.metadata || !b.state.metadata) return;
    expect(compareMetadataRecords(a.state.metadata, b.state.metadata)).toBe(true);
  });

  it("regression: Phases I–V remain CERTIFIED", () => {
    expect(SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_METADATA_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIArchitectureSsot.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIIValidationEngine.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIIINormalizationEngine.status).toBe(
      "CERTIFIED",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIVMetadataEngine.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseVPipelineIntegration.status).toBe("CERTIFIED");
  });
});
