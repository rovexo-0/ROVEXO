import { describe, expect, it } from "vitest";
import {
  SMART_MOBILE_IMAGE_METADATA_ENGINE_V1,
  cloneMetadataRecord,
  compareMetadataRecords,
  createMetadataRecord,
  createSmartMobileImageMetadataEngine,
  isMetadataTransitionAllowed,
  mergeMetadataRecord,
} from "@/lib/media/smart-mobile-image-pipeline/metadata-engine-v1";
import { SMART_MOBILE_IMAGE_PIPELINE_V1 } from "@/lib/media/smart-mobile-image-pipeline-v1";
import { SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1 } from "@/lib/media/smart-mobile-image-pipeline/pipeline-engine-v1";
import { SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1 } from "@/lib/media/smart-mobile-image-pipeline/validation-engine-v1";
import { SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1 } from "@/lib/media/smart-mobile-image-pipeline/normalization-engine-v1";
import type { CreateMetadataInput } from "@/lib/media/smart-mobile-image-pipeline/metadata-types-v1";

function baseInput(overrides: Partial<CreateMetadataInput> = {}): CreateMetadataInput {
  return {
    identifier: " meta-1 ",
    fingerprint: " fp-abc ",
    width: 800,
    height: 600,
    orientation: 1,
    mimeType: "image/jpeg",
    extension: ".jpg",
    fileName: "photo.jpg",
    fileSize: 2048,
    timestamp: 1_700_000_000_000,
    format: "jpeg",
    at: 10,
    ...overrides,
  };
}

describe("Smart Mobile Image Pipeline — Phase IV Metadata Engine", () => {
  it("exposes metadata-only SSOT flags", () => {
    expect(SMART_MOBILE_IMAGE_METADATA_ENGINE_V1.ownsMetadataOnly).toBe(true);
    expect(SMART_MOBILE_IMAGE_METADATA_ENGINE_V1.validationForbidden).toBe(true);
    expect(SMART_MOBILE_IMAGE_METADATA_ENGINE_V1.normalizationForbidden).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIVMetadataEngine.status).toBe("CERTIFIED");
  });

  it("creates metadata with trimmed identifier and fingerprint", () => {
    const record = createMetadataRecord(baseInput());
    expect(record).not.toBeNull();
    expect(record?.version).toBe(1);
    expect(record?.metadata.identifier).toBe("meta-1");
    expect(record?.metadata.fingerprint).toBe("fp-abc");
    expect(record?.metadata.pipelineMetadata.contentFingerprint).toBe("fp-abc");
  });

  it("deep clones without shared references", () => {
    const record = createMetadataRecord(baseInput());
    expect(record).not.toBeNull();
    if (!record) return;
    const cloned = cloneMetadataRecord(record);
    expect(cloned).toEqual(record);
    expect(cloned).not.toBe(record);
    expect(cloned.metadata).not.toBe(record.metadata);
    expect(cloned.metadata.processingFlags).not.toBe(record.metadata.processingFlags);
    expect(cloned.metadata.pipelineMetadata).not.toBe(record.metadata.pipelineMetadata);
  });

  it("merges metadata and increments version", () => {
    const record = createMetadataRecord(baseInput());
    expect(record).not.toBeNull();
    if (!record) return;
    const merged = mergeMetadataRecord(record, { width: 1024, height: 768, fileName: "next.jpg" }, 20);
    expect(merged).not.toBeNull();
    expect(merged?.version).toBe(2);
    expect(merged?.metadata.width).toBe(1024);
    expect(merged?.metadata.height).toBe(768);
    expect(merged?.metadata.fileName).toBe("next.jpg");
    expect(merged?.metadata.identifier).toBe("meta-1");
    expect(record.version).toBe(1);
  });

  it("freezes metadata via engine", () => {
    const engine = createSmartMobileImageMetadataEngine();
    expect(engine.create(baseInput()).ok).toBe(true);
    const frozen = engine.freeze(30);
    expect(frozen.ok).toBe(true);
    if (!frozen.ok) return;
    expect(frozen.state.status).toBe("FROZEN");
    expect(frozen.record?.frozenAt).toBe(30);
    expect(engine.merge({ width: 1 }, 31).ok).toBe(false);
  });

  it("compares metadata records", () => {
    const a = createMetadataRecord(baseInput());
    const b = createMetadataRecord(baseInput());
    expect(a && b && compareMetadataRecords(a, b)).toBe(true);
    const c = mergeMetadataRecord(a!, { width: 999 }, 11);
    expect(c && compareMetadataRecords(a!, c)).toBe(false);
  });

  it("creates immutable snapshots", () => {
    const engine = createSmartMobileImageMetadataEngine();
    engine.create(baseInput());
    const snap = engine.snapshot(40);
    expect(snap.ok).toBe(true);
    if (!snap.ok || !snap.snapshot) return;
    expect(snap.snapshot.version).toBe(1);
    expect(snap.snapshot.capturedAt).toBe(40);
    const leaked = snap.snapshot.record.metadata as unknown as { fileName: string };
    leaked.fileName = "mutated.jpg";
    const read = engine.read();
    expect(read.ok && read.record?.metadata.fileName).toBe("photo.jpg");
  });

  it("increments version on update path", () => {
    const engine = createSmartMobileImageMetadataEngine();
    engine.create(baseInput());
    const updated = engine.merge({ fingerprint: "fp-2" }, 50);
    expect(updated.ok && updated.record?.version).toBe(2);
    const again = engine.merge({ fingerprint: "fp-3" }, 51);
    expect(again.ok && again.record?.version).toBe(3);
  });

  it("keeps identifier consistency across merge", () => {
    const engine = createSmartMobileImageMetadataEngine();
    engine.create(baseInput({ identifier: "id-fixed" }));
    const merged = engine.merge({ fileName: "x.png", format: "png" }, 60);
    expect(merged.ok && merged.record?.metadata.identifier).toBe("id-fixed");
  });

  it("keeps fingerprint consistency unless patched", () => {
    const engine = createSmartMobileImageMetadataEngine();
    engine.create(baseInput({ fingerprint: "same-fp" }));
    const merged = engine.merge({ width: 900 }, 70);
    expect(merged.ok && merged.record?.metadata.fingerprint).toBe("same-fp");
    expect(merged.ok && merged.record?.metadata.pipelineMetadata.contentFingerprint).toBe(
      "same-fp",
    );
  });

  it("returns immutable engine outputs", () => {
    const engine = createSmartMobileImageMetadataEngine();
    const created = engine.create(baseInput());
    expect(created.ok).toBe(true);
    if (!created.ok || !created.record) return;
    const leakedRecord = created.record.metadata as unknown as { fileName: string };
    leakedRecord.fileName = "leaked.jpg";
    const leakedState = created.state.record!.metadata as unknown as { fileName: string };
    leakedState.fileName = "leaked-state.jpg";
    const snap = engine.getSnapshot();
    expect(snap.record?.metadata.fileName).toBe("photo.jpg");
  });

  it("illegal transition fail-closes", () => {
    const engine = createSmartMobileImageMetadataEngine();
    const again = engine.create(baseInput());
    expect(again.ok).toBe(true);
    const duplicate = engine.create(baseInput({ at: 2 }));
    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) return;
    expect(duplicate.code).toBe("INVALID_TRANSITION");
    expect(engine.getSnapshot().status).toBe("FAILED");
  });

  it("fail closed on invalid create input", () => {
    const engine = createSmartMobileImageMetadataEngine();
    const bad = engine.create(baseInput({ width: 0 }));
    expect(bad.ok).toBe(false);
    expect(engine.getSnapshot().status).toBe("FAILED");
  });

  it("documents legal transitions", () => {
    expect(isMetadataTransitionAllowed("EMPTY", "CREATED")).toBe(true);
    expect(isMetadataTransitionAllowed("CREATED", "ACTIVE")).toBe(true);
    expect(isMetadataTransitionAllowed("ACTIVE", "FROZEN")).toBe(true);
    expect(isMetadataTransitionAllowed("FROZEN", "ACTIVE")).toBe(false);
  });

  it("regression: Phase I remains CERTIFIED", () => {
    expect(SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIArchitectureSsot.status).toBe("CERTIFIED");
  });

  it("regression: Phase II remains CERTIFIED", () => {
    expect(SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIIValidationEngine.status).toBe("CERTIFIED");
  });

  it("regression: Phase III remains CERTIFIED", () => {
    expect(SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIIINormalizationEngine.status).toBe("CERTIFIED");
  });
});
