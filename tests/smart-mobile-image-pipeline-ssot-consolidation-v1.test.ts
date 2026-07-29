import { describe, expect, it } from "vitest";
import {
  SMART_MOBILE_IMAGE_METADATA_ENGINE_V1,
  SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1,
  SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1,
  SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_V1,
  SMART_MOBILE_IMAGE_PIPELINE_PERFORMANCE_VALIDATION_V1,
  SMART_MOBILE_IMAGE_PIPELINE_SSOT_COMPOSITION_CONTRACTS,
  SMART_MOBILE_IMAGE_PIPELINE_SSOT_CONSOLIDATION_V1,
  SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS,
  SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1,
  assertSsotDependencyDirection,
  assertSsotInvariants,
  assertSsotOwnershipMatrix,
  assertSsotOwnershipSingularity,
  certifySmartMobileImagePipelineSsot,
  cloneMetadataRecord,
  createMetadataRecord,
  createMetadataSnapshot,
  createSmartMobileImageMetadataEngine,
  createSmartMobileImagePipelineComposition,
  detectSsotImportCycles,
  generateSmartMobileImagePipelineSsotReport,
  normalizeImageInput,
} from "@/lib/media/smart-mobile-image-pipeline";
import { SMART_MOBILE_IMAGE_PIPELINE_V1 } from "@/lib/media/smart-mobile-image-pipeline-v1";

describe("Smart Mobile Image Pipeline — Phase VII SSOT Consolidation", () => {
  it("exposes architecture-verification-only SSOT flags", () => {
    expect(SMART_MOBILE_IMAGE_PIPELINE_SSOT_CONSOLIDATION_V1.phase).toBe(
      "VII_SSOT_CONSOLIDATION",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_SSOT_CONSOLIDATION_V1.behaviouralChangesForbidden).toBe(
      true,
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_SSOT_CONSOLIDATION_V1.optimisationForbidden).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_SSOT_CONSOLIDATION_V1.featureAdditionsForbidden).toBe(
      true,
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseVIISsotConsolidation.status).toBe(
      "CERTIFIED",
    );
  });

  it("verifies ownership matrix singularity", () => {
    const result = assertSsotOwnershipMatrix();
    expect(result.ok).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS.validation).toBe(
      "SmartMobileImageValidationEngine",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS.normalization).toBe(
      "SmartMobileImageNormalizationEngine",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS.metadata).toBe(
      "SmartMobileImageMetadataEngine",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS.pipelineLifecycle).toBe(
      "SmartMobileImagePipelineEngine",
    );
  });

  it("verifies dependency DAG has no cycles and no reverse ownership", () => {
    expect(detectSsotImportCycles().ok).toBe(true);
    expect(assertSsotDependencyDirection().ok).toBe(true);
  });

  it("verifies singularity invariants", () => {
    expect(assertSsotInvariants().ok).toBe(true);
  });

  it("certifies full SSOT and generates report matrices", () => {
    const certified = certifySmartMobileImagePipelineSsot();
    expect(certified.ok).toBe(true);
    expect(() => assertSsotOwnershipSingularity()).not.toThrow();
    const report = generateSmartMobileImagePipelineSsotReport();
    expect(report.compositionMatrix).toEqual(SMART_MOBILE_IMAGE_PIPELINE_SSOT_COMPOSITION_CONTRACTS);
    expect(report.ownershipMatrix.metadataIdentifiers).toBe(
      "SmartMobileImageMetadataEngine",
    );
    expect(report.eventMatrix.collisions.length).toBe(3);
    expect(report.stateMatrix.SmartMobileImagePipelineComposition).toContain(
      "PIPELINE_READY",
    );
    expect(report.invariants).toHaveLength(5);
  });

  it("verifies immutable metadata snapshots and canonical clone owner", () => {
    const record = createMetadataRecord({
      identifier: "ssot-1",
      fingerprint: "fp-ssot",
      width: 10,
      height: 20,
      orientation: 1,
      mimeType: "image/jpeg",
      extension: ".jpg",
      fileName: "a.jpg",
      fileSize: 100,
      timestamp: 1,
      format: "jpeg",
      at: 1,
    });
    expect(record).not.toBeNull();
    if (!record) return;
    const cloned = cloneMetadataRecord(record);
    expect(cloned).toEqual(record);
    expect(cloned).not.toBe(record);
    expect(cloned.metadata).not.toBe(record.metadata);
    const snap = createMetadataSnapshot(record, 2);
    const leaked = snap.record.metadata as unknown as { fileName: string };
    leaked.fileName = "mutated.jpg";
    expect(record.metadata.fileName).toBe("a.jpg");

    const engine = createSmartMobileImageMetadataEngine();
    expect(engine.create({
      identifier: "ssot-2",
      fingerprint: "fp-2",
      width: 10,
      height: 20,
      orientation: 1,
      mimeType: "image/jpeg",
      extension: ".jpg",
      fileName: "b.jpg",
      fileSize: 100,
      timestamp: 1,
      format: "jpeg",
      at: 3,
    }).ok).toBe(true);
    expect(engine.freeze(4).ok).toBe(true);
    expect(engine.getSnapshot().status).toBe("FROZEN");
    expect(engine.merge({ width: 11 }, 5).ok).toBe(false);
  });

  it("verifies composition still produces immutable pipeline outputs", () => {
    const composition = createSmartMobileImagePipelineComposition();
    const result = composition.process({
      imageId: "ssot-comp",
      format: "jpeg",
      mimeType: "image/jpeg",
      extension: ".jpg",
      width: 1200,
      height: 1600,
      orientation: 1,
      byteLength: 48_000,
      contentFingerprint: "fp-ssot-comp",
      filename: "photo.jpg",
      timestamp: 1_700_000_000_000,
      at: 10,
      bytes: Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x04]),
    });
    expect(result.ok).toBe(true);
    if (!result.ok || !result.state.metadata) return;
    const leaked = result.state.metadata.metadata as unknown as { fileName: string };
    leaked.fileName = "leaked.jpg";
    expect(composition.getSnapshot().metadata?.metadata.fileName).toBe("photo.jpg");
  });

  it("verifies normalization remains deterministic under SSOT freeze", () => {
    const input = {
      imageId: "n1",
      format: "jpeg" as const,
      mimeType: "image/jpg",
      extension: ".JPEG",
      width: 100,
      height: 200,
      orientation: 6 as const,
      byteLength: 1024,
      contentFingerprint: "fp",
      filename: "x.JPEG",
      timestamp: 1,
      at: 1,
    };
    expect(normalizeImageInput(input)).toEqual(normalizeImageInput(input));
  });

  it("regression: Phases I–VI remain CERTIFIED", () => {
    expect(SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_METADATA_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_PERFORMANCE_VALIDATION_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIArchitectureSsot.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIIValidationEngine.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIIINormalizationEngine.status).toBe(
      "CERTIFIED",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIVMetadataEngine.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseVPipelineIntegration.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseVIPerformanceValidation.status).toBe(
      "CERTIFIED",
    );
  });
});
