/**
 * ROVEXO Smart Mobile Image Pipeline — Integration Certification v1.0
 *
 * PHASE VIII · COD SÂNGE · Logic only
 *
 * Certifies the complete Smart Mobile Image Pipeline logic layer.
 * Integration verification ONLY — no new features · no optimisation · no UI.
 */

import {
  SMART_MOBILE_IMAGE_METADATA_ENGINE_V1,
  compareMetadataRecords,
} from "@/lib/media/smart-mobile-image-pipeline/metadata-engine-v1";
import { SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1 } from "@/lib/media/smart-mobile-image-pipeline/normalization-engine-v1";
import { SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1 } from "@/lib/media/smart-mobile-image-pipeline/pipeline-engine-v1";
import {
  SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_V1,
  SmartMobileImagePipelineComposition,
  assertPipelineCompositionInvariants,
  createIntegratedSmartMobileImagePipeline,
  createSmartMobileImagePipelineComposition,
  type IntegratedSmartMobileImagePipeline,
} from "@/lib/media/smart-mobile-image-pipeline/pipeline-integration-v1";
import type { ProcessPipelineImageInput } from "@/lib/media/smart-mobile-image-pipeline/pipeline-integration-types-v1";
import { SMART_MOBILE_IMAGE_PIPELINE_PERFORMANCE_VALIDATION_V1 } from "@/lib/media/smart-mobile-image-pipeline/performance-validation-v1";
import {
  SMART_MOBILE_IMAGE_PIPELINE_SSOT_CONSOLIDATION_V1,
  assertSsotOwnershipSingularity,
  certifySmartMobileImagePipelineSsot,
  detectSsotImportCycles,
  generateSmartMobileImagePipelineSsotReport,
} from "@/lib/media/smart-mobile-image-pipeline/ssot-consolidation-v1";
import { SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1 } from "@/lib/media/smart-mobile-image-pipeline/validation-engine-v1";
import { SMART_MOBILE_IMAGE_VALIDATION_MAX_IMAGES } from "@/lib/media/smart-mobile-image-pipeline/validation-types-v1";

export const SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_CERTIFICATION_V1 = {
  version: "1.0",
  id: "smart-mobile-image-pipeline-integration-certification-v1",
  phase: "VIII_INTEGRATION_CERTIFICATION",
  status: "CERTIFIED",
  scope: "LOGIC_LAYER_ONLY",
  behaviouralChangesForbidden: true,
  featureAdditionsForbidden: true,
  optimisationForbidden: true,
  publicApiChangesForbidden: true,
  uiForbidden: true,
  cameraForbidden: true,
  networkForbidden: true,
  storageForbidden: true,
  uploadForbidden: true,
  pixelDecodeForbidden: true,
  compressionForbidden: true,
  productUiStatus: "CERTIFIED",
  logicModuleIntegration: "CERTIFIED",
  scenarios: [
    "VALID_IMAGE_READY",
    "UNSUPPORTED_FORMAT_REJECTED",
    "CORRUPTED_JPEG_FAILED",
    "DUPLICATE_IMAGE_REJECTED",
    "MISSING_FILENAME_METADATA_READY",
    "MAXIMUM_IMAGES_REJECTED",
    "REPEATED_IDENTICAL_INPUT_DETERMINISTIC",
    "ILLEGAL_TRANSITION_FAILED",
  ] as const,
  certifiedPhases: [
    "I_PIPELINE_ENGINE",
    "II_VALIDATION_ENGINE",
    "III_NORMALIZATION_ENGINE",
    "IV_METADATA_ENGINE",
    "V_PIPELINE_INTEGRATION",
    "VI_PERFORMANCE_VALIDATION",
    "VII_SSOT_CONSOLIDATION",
  ] as const,
  invariants: [
    "EXACTLY_ONE_PIPELINE_ENGINE",
    "EXACTLY_ONE_VALIDATION_ENGINE",
    "EXACTLY_ONE_NORMALIZATION_ENGINE",
    "EXACTLY_ONE_METADATA_ENGINE",
    "EXACTLY_ONE_PIPELINE_COMPOSITION",
    "EXACTLY_ONE_SSOT",
  ] as const,
} as const;

export type IntegrationCertificationScenarioId =
  (typeof SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_CERTIFICATION_V1.scenarios)[number];

export type IntegrationCertificationScenarioResult = {
  readonly id: IntegrationCertificationScenarioId;
  readonly ok: boolean;
  readonly detail: string;
};

export type IntegrationCertificationSuiteResult =
  | {
      ok: true;
      scenarios: readonly IntegrationCertificationScenarioResult[];
      ownership: true;
      dependency: true;
      state: true;
      event: true;
      invariant: true;
      immutability: true;
    }
  | {
      ok: false;
      scenarios: readonly IntegrationCertificationScenarioResult[];
      failures: readonly string[];
      ownership: boolean;
      dependency: boolean;
      state: boolean;
      event: boolean;
      invariant: boolean;
      immutability: boolean;
    };

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
    imageId: "cert-1",
    format: "jpeg",
    mimeType: "image/jpeg",
    extension: ".jpg",
    width: 1200,
    height: 1600,
    orientation: 1,
    byteLength: 48_000,
    contentFingerprint: "fp-cert-1",
    filename: "photo.jpg",
    timestamp: 1_700_000_000_000,
    at: 100,
    bytes: validJpegBytes(),
    ...overrides,
  };
}

function scenario(
  id: IntegrationCertificationScenarioId,
  ok: boolean,
  detail: string,
): IntegrationCertificationScenarioResult {
  return { id, ok, detail };
}

function runScenario1(
  composition: SmartMobileImagePipelineComposition,
): IntegrationCertificationScenarioResult {
  const result = composition.process(baseInput({ imageId: "s1", contentFingerprint: "fp-s1" }));
  const engines = composition.getEngines();
  const ok =
    result.ok &&
    result.state.status === "PIPELINE_READY" &&
    engines.pipelineEngine.getSnapshot().status === "READY" &&
    engines.validationEngine.getSnapshot().status === "READY" &&
    engines.normalizationEngine.getSnapshot().status === "NORMALIZED" &&
    engines.metadataEngine.getSnapshot().status === "FROZEN";
  return scenario(
    "VALID_IMAGE_READY",
    Boolean(ok),
    ok ? "Pipeline READY through Validation→Normalization→Metadata" : "Valid path failed",
  );
}

function runScenario2(
  composition: SmartMobileImagePipelineComposition,
): IntegrationCertificationScenarioResult {
  composition.reset(1);
  const result = composition.process(
    baseInput({
      imageId: "s2",
      contentFingerprint: "fp-s2",
      format: "gif" as "jpeg",
      mimeType: "image/gif",
      extension: ".gif",
      at: 2,
    }),
  );
  const ok = result.ok && result.state.status === "REJECTED" && result.state.failureReason === "UNSUPPORTED_FORMAT";
  return scenario(
    "UNSUPPORTED_FORMAT_REJECTED",
    Boolean(ok),
    ok ? "Unsupported format REJECTED" : "Unsupported format path failed",
  );
}

function runScenario3(
  composition: SmartMobileImagePipelineComposition,
): IntegrationCertificationScenarioResult {
  composition.reset(3);
  const result = composition.process(
    baseInput({
      imageId: "s3",
      contentFingerprint: "fp-s3",
      bytes: corruptedJpegBytes(),
      at: 3,
    }),
  );
  const ok =
    !result.ok &&
    result.code === "FAILED" &&
    result.reason === "CORRUPTED_IMAGE" &&
    composition.getSnapshot().status === "FAILED";
  return scenario(
    "CORRUPTED_JPEG_FAILED",
    Boolean(ok),
    ok ? "Corrupted JPEG FAILED fail-closed" : "Corrupted JPEG path failed",
  );
}

function runScenario4(
  pipelineModule: IntegratedSmartMobileImagePipeline,
): IntegrationCertificationScenarioResult {
  pipelineModule.validationEngine.reset(4);
  const first = pipelineModule.validationEngine.receiveImage({
    imageId: "dup-1",
    format: "jpeg",
    mimeType: "image/jpeg",
    extension: ".jpg",
    width: 1200,
    height: 1600,
    orientation: 1,
    byteLength: 48_000,
    contentFingerprint: "fp-dup",
    bytes: validJpegBytes(),
    at: 4,
  });
  const second = pipelineModule.validationEngine.receiveImage({
    imageId: "dup-2",
    format: "jpeg",
    mimeType: "image/jpeg",
    extension: ".jpg",
    width: 1200,
    height: 1600,
    orientation: 1,
    byteLength: 48_000,
    contentFingerprint: "fp-dup",
    bytes: validJpegBytes(),
    at: 5,
  });
  const ok =
    first.ok &&
    !second.ok &&
    second.reason === "DUPLICATE_IMAGE";
  return scenario(
    "DUPLICATE_IMAGE_REJECTED",
    Boolean(ok),
    ok ? "Duplicate fingerprint rejected by Validation Engine" : "Duplicate path failed",
  );
}

function runScenario5(
  composition: SmartMobileImagePipelineComposition,
): IntegrationCertificationScenarioResult {
  composition.reset(6);
  const result = composition.process(
    baseInput({
      imageId: "missing-name",
      contentFingerprint: "fp-missing-name",
      filename: undefined,
      at: 6,
    }),
  );
  const ok =
    result.ok &&
    result.state.status === "PIPELINE_READY" &&
    result.state.metadata?.metadata.fileName === "missing-name.jpg";
  return scenario(
    "MISSING_FILENAME_METADATA_READY",
    Boolean(ok),
    ok ? "Missing filename generated via Normalization→Metadata" : "Missing metadata path failed",
  );
}

function runScenario6(
  pipelineModule: IntegratedSmartMobileImagePipeline,
): IntegrationCertificationScenarioResult {
  pipelineModule.validationEngine.reset(7);
  let intakeOk = true;
  for (let i = 0; i < SMART_MOBILE_IMAGE_VALIDATION_MAX_IMAGES; i++) {
    const received = pipelineModule.validationEngine.receiveImage({
      imageId: `max-${i}`,
      format: "jpeg",
      mimeType: "image/jpeg",
      extension: ".jpg",
      width: 1200,
      height: 1600,
      orientation: 1,
      byteLength: 48_000,
      contentFingerprint: `fp-max-${i}`,
      bytes: validJpegBytes(),
      at: 7 + i,
    });
    if (!received.ok) {
      intakeOk = false;
      break;
    }
  }
  const overflow = pipelineModule.validationEngine.receiveImage({
    imageId: "max-overflow",
    format: "jpeg",
    mimeType: "image/jpeg",
    extension: ".jpg",
    width: 1200,
    height: 1600,
    orientation: 1,
    byteLength: 48_000,
    contentFingerprint: "fp-max-overflow",
    bytes: validJpegBytes(),
    at: 20,
  });
  const ok = intakeOk && !overflow.ok && overflow.reason === "MAXIMUM_IMAGES_EXCEEDED";
  return scenario(
    "MAXIMUM_IMAGES_REJECTED",
    Boolean(ok),
    ok ? "Maximum image count rejected by Validation Engine" : "Max images path failed",
  );
}

function runScenario7(): IntegrationCertificationScenarioResult {
  const input = baseInput({
    imageId: "det-cert",
    contentFingerprint: "fp-det-cert",
    at: 55,
    timestamp: 1_700_000_111_000,
  });
  const a = createSmartMobileImagePipelineComposition().process(input);
  const b = createSmartMobileImagePipelineComposition().process(input);
  const ok =
    a.ok &&
    b.ok &&
    a.state.status === "PIPELINE_READY" &&
    b.state.status === "PIPELINE_READY" &&
    a.state.metadata !== null &&
    b.state.metadata !== null &&
    compareMetadataRecords(a.state.metadata, b.state.metadata) &&
    JSON.stringify(a.state.normalized) === JSON.stringify(b.state.normalized);
  return scenario(
    "REPEATED_IDENTICAL_INPUT_DETERMINISTIC",
    Boolean(ok),
    ok ? "Repeated input yields identical metadata snapshot" : "Determinism path failed",
  );
}

function runScenario8(
  pipelineModule: IntegratedSmartMobileImagePipeline,
): IntegrationCertificationScenarioResult {
  pipelineModule.validationEngine.reset(30);
  const received = pipelineModule.validationEngine.receiveImage({
    imageId: "illegal-1",
    format: "jpeg",
    mimeType: "image/jpeg",
    extension: ".jpg",
    width: 1200,
    height: 1600,
    orientation: 1,
    byteLength: 48_000,
    contentFingerprint: "fp-illegal",
    bytes: validJpegBytes(),
    at: 30,
  });
  const first = pipelineModule.validationEngine.validate(31);
  const second = pipelineModule.validationEngine.validate(32);
  const ok =
    received.ok &&
    first.ok &&
    first.state.status === "READY" &&
    !second.ok &&
    second.code === "INVALID_TRANSITION" &&
    pipelineModule.validationEngine.getSnapshot().status === "FAILED";
  return scenario(
    "ILLEGAL_TRANSITION_FAILED",
    Boolean(ok),
    ok ? "Illegal validation re-entry FAILED fail-closed" : "Illegal transition path failed",
  );
}

function runImmutabilityCheck(
  composition: SmartMobileImagePipelineComposition,
): { ok: boolean; detail: string } {
  composition.reset(40);
  const result = composition.process(
    baseInput({
      imageId: "immut",
      contentFingerprint: "fp-immut",
      at: 40,
    }),
  );
  if (!result.ok || !result.state.metadata) {
    return { ok: false, detail: "Immutability setup failed" };
  }
  const leaked = result.state.metadata.metadata as unknown as { fileName: string };
  leaked.fileName = "leaked.jpg";
  const snap = composition.getSnapshot();
  const ok = snap.metadata?.metadata.fileName === "photo.jpg";
  return {
    ok: Boolean(ok),
    detail: ok ? "Snapshot isolation preserved" : "Mutable leak detected",
  };
}

/** Fail-closed singularity + SSOT + certified-phase gates. */
export function assertIntegratedPipelineModuleInvariants(
  pipelineModule: IntegratedSmartMobileImagePipeline,
): { ok: true } | { ok: false; violations: readonly string[] } {
  const violations: string[] = [];
  const compositionCheck = assertPipelineCompositionInvariants(pipelineModule);
  if (!compositionCheck.ok) {
    violations.push(...compositionCheck.violations);
  }

  try {
    assertSsotOwnershipSingularity();
  } catch (error) {
    violations.push(
      error instanceof Error ? error.message : "SSOT ownership singularity failed",
    );
  }

  const cycles = detectSsotImportCycles();
  if (!cycles.ok) {
    for (const issue of cycles.issues) {
      violations.push(issue.message);
    }
  }

  const ssot = certifySmartMobileImagePipelineSsot();
  if (!ssot.ok) {
    for (const issue of ssot.issues) {
      violations.push(`${issue.code}: ${issue.message}`);
    }
  }

  if (SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1.status !== "CERTIFIED") {
    violations.push("Pipeline Engine is not CERTIFIED");
  }
  if (SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1.status !== "CERTIFIED") {
    violations.push("Validation Engine is not CERTIFIED");
  }
  if (SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1.status !== "CERTIFIED") {
    violations.push("Normalization Engine is not CERTIFIED");
  }
  if (SMART_MOBILE_IMAGE_METADATA_ENGINE_V1.status !== "CERTIFIED") {
    violations.push("Metadata Engine is not CERTIFIED");
  }
  if (SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_V1.status !== "CERTIFIED") {
    violations.push("Pipeline Integration is not CERTIFIED");
  }
  if (SMART_MOBILE_IMAGE_PIPELINE_PERFORMANCE_VALIDATION_V1.status !== "CERTIFIED") {
    violations.push("Performance Validation is not CERTIFIED");
  }
  if (SMART_MOBILE_IMAGE_PIPELINE_SSOT_CONSOLIDATION_V1.status !== "CERTIFIED") {
    violations.push("SSOT Consolidation is not CERTIFIED");
  }

  if (violations.length > 0) {
    return { ok: false, violations };
  }
  return { ok: true };
}

/**
 * Full logic-layer integration certification — Scenarios 1–8 + matrices.
 */
export function certifySmartMobileImagePipelineLogicModule(): IntegrationCertificationSuiteResult {
  const pipelineModule = createIntegratedSmartMobileImagePipeline();
  const composition = createSmartMobileImagePipelineComposition(pipelineModule);
  const failures: string[] = [];

  const invariants = assertIntegratedPipelineModuleInvariants(pipelineModule);
  const invariantOk = invariants.ok;
  if (!invariants.ok) {
    failures.push(...invariants.violations);
  }

  const ssotReport = generateSmartMobileImagePipelineSsotReport();
  const ownershipOk =
    ssotReport.ownershipMatrix.validation === "SmartMobileImageValidationEngine" &&
    ssotReport.ownershipMatrix.normalization === "SmartMobileImageNormalizationEngine" &&
    ssotReport.ownershipMatrix.metadata === "SmartMobileImageMetadataEngine";
  if (!ownershipOk) {
    failures.push("Ownership matrix singularity failed");
  }

  const dependencyOk = detectSsotImportCycles().ok;
  if (!dependencyOk) {
    failures.push("Dependency cycle detected");
  }

  const stateOk =
    ssotReport.stateMatrix.SmartMobileImagePipelineComposition.includes("PIPELINE_READY") &&
    ssotReport.stateMatrix.SmartMobileImageValidationEngine.includes("REJECTED") &&
    ssotReport.stateMatrix.SmartMobileImageMetadataEngine.includes("FROZEN");
  if (!stateOk) {
    failures.push("State matrix incomplete");
  }

  const eventOk = ssotReport.eventMatrix.collisions.length === 3;
  if (!eventOk) {
    failures.push("Event collision matrix incomplete");
  }

  const scenarios = [
    runScenario1(composition),
    runScenario2(composition),
    runScenario3(composition),
    runScenario4(pipelineModule),
    runScenario5(composition),
    runScenario6(pipelineModule),
    runScenario7(),
    runScenario8(pipelineModule),
  ];
  for (const entry of scenarios) {
    if (!entry.ok) {
      failures.push(`${entry.id}: ${entry.detail}`);
    }
  }

  const immutability = runImmutabilityCheck(composition);
  if (!immutability.ok) {
    failures.push(immutability.detail);
  }

  if (failures.length > 0) {
    return {
      ok: false,
      scenarios,
      failures,
      ownership: ownershipOk,
      dependency: dependencyOk,
      state: stateOk,
      event: eventOk,
      invariant: invariantOk,
      immutability: immutability.ok,
    };
  }

  return {
    ok: true,
    scenarios,
    ownership: true,
    dependency: true,
    state: true,
    event: true,
    invariant: true,
    immutability: true,
  };
}
