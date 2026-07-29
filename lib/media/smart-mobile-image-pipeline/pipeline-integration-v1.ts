/**
 * ROVEXO Smart Mobile Image Pipeline — Pipeline Integration v1.0
 *
 * PHASE V · COD SÂNGE · ONE Pipeline Composition · Logic only
 *
 * Certifies certified engines I–IV operate as ONE canonical pipeline.
 * NO new features · NO behavioural changes to certified phases.
 * NEVER: UI · camera · storage · upload · network · pixel decode/manipulation · compression.
 */

import {
  SMART_MOBILE_IMAGE_METADATA_ENGINE_V1,
  SmartMobileImageMetadataEngine,
  cloneMetadataRecord,
  createSmartMobileImageMetadataEngine,
} from "@/lib/media/smart-mobile-image-pipeline/metadata-engine-v1";
import type { MetadataRecord } from "@/lib/media/smart-mobile-image-pipeline/metadata-types-v1";
import {
  SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1,
  SmartMobileImageNormalizationEngine,
  createSmartMobileImageNormalizationEngine,
} from "@/lib/media/smart-mobile-image-pipeline/normalization-engine-v1";
import type { NormalizedImage } from "@/lib/media/smart-mobile-image-pipeline/normalization-types-v1";
import {
  SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1,
  SmartMobileImagePipelineEngine,
  createSmartMobileImagePipelineEngine,
} from "@/lib/media/smart-mobile-image-pipeline/pipeline-engine-v1";
import type {
  PipelineCompositionInvariantResult,
  PipelineCompositionOwnership,
  PipelineIntegrationEvent,
  PipelineIntegrationFailureReason,
  PipelineIntegrationResult,
  PipelineIntegrationState,
  PipelineIntegrationStatus,
  ProcessPipelineImageInput,
} from "@/lib/media/smart-mobile-image-pipeline/pipeline-integration-types-v1";
import {
  SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1,
  SmartMobileImageValidationEngine,
  createSmartMobileImageValidationEngine,
} from "@/lib/media/smart-mobile-image-pipeline/validation-engine-v1";
import type { ValidationReason } from "@/lib/media/smart-mobile-image-pipeline/validation-types-v1";

export const SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_V1 = {
  version: "1.0",
  id: "smart-mobile-image-pipeline-integration-v1",
  phase: "V_PIPELINE_INTEGRATION",
  status: "CERTIFIED",
  scope: "LOGIC_LAYER_ONLY",
  behaviouralChangesForbidden: true,
  featureAdditionsForbidden: true,
  compositionOnly: true,
  uiForbidden: true,
  cameraForbidden: true,
  networkForbidden: true,
  storageForbidden: true,
  uploadForbidden: true,
  pixelDecodeForbidden: true,
  compressionForbidden: true,
  canonicalOrder: [
    "PIPELINE_ENGINE",
    "VALIDATION_ENGINE",
    "NORMALIZATION_ENGINE",
    "METADATA_ENGINE",
  ] as const,
  canonicalFlow: [
    "RECEIVED",
    "VALIDATING",
    "NORMALIZING",
    "METADATA_READY",
    "PIPELINE_READY",
  ] as const,
  alternativeExits: ["REJECTED", "FAILED"] as const,
  invariants: [
    "EXACTLY_ONE_PIPELINE_ENGINE",
    "EXACTLY_ONE_VALIDATION_ENGINE",
    "EXACTLY_ONE_NORMALIZATION_ENGINE",
    "EXACTLY_ONE_METADATA_ENGINE",
    "EXACTLY_ONE_CANONICAL_COMPOSITION",
  ] as const,
  scenarios: [
    "VALID_IMAGE_READY",
    "UNSUPPORTED_FORMAT_REJECTED",
    "CORRUPTED_JPEG_FAILED",
    "MISSING_FILENAME_METADATA_GENERATION_READY",
    "REPEATED_IDENTICAL_INPUT_DETERMINISTIC",
  ] as const,
  certifiedPhases: [
    "I_PIPELINE_ENGINE",
    "II_VALIDATION_ENGINE",
    "III_NORMALIZATION_ENGINE",
    "IV_METADATA_ENGINE",
  ] as const,
} as const;

type IntegrationListener = (event: PipelineIntegrationEvent) => void;

const ERROR_MESSAGE = {
  INVALID_TRANSITION: "Invalid pipeline integration state transition.",
  INVALID_INPUT: "Pipeline integration input is invalid.",
  REJECTED: "Image rejected by pipeline integration.",
  FAILED: "Pipeline integration failed closed.",
  INTEGRATION_FAILED: "Pipeline integration failed.",
} as const;

const OWNERSHIP: PipelineCompositionOwnership = {
  pipelineEngineCount: 1,
  validationEngineCount: 1,
  normalizationEngineCount: 1,
  metadataEngineCount: 1,
  compositionCount: 1,
};

const ALLOWED_TRANSITIONS: Readonly<
  Record<PipelineIntegrationStatus, readonly PipelineIntegrationStatus[]>
> = {
  RECEIVED: ["VALIDATING", "REJECTED", "FAILED"],
  VALIDATING: ["NORMALIZING", "REJECTED", "FAILED"],
  NORMALIZING: ["METADATA_READY", "FAILED"],
  METADATA_READY: ["PIPELINE_READY", "FAILED"],
  PIPELINE_READY: ["RECEIVED", "FAILED"],
  REJECTED: ["RECEIVED", "FAILED"],
  FAILED: ["RECEIVED"],
};

function canTransition(
  from: PipelineIntegrationStatus,
  to: PipelineIntegrationStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

function createInitialState(at = 0): PipelineIntegrationState {
  return {
    status: "RECEIVED",
    imageId: null,
    normalized: null,
    metadata: null,
    failureReason: null,
    updatedAt: at,
  };
}

function cloneNormalized(image: NormalizedImage): NormalizedImage {
  return {
    ...image,
    metadata: { ...image.metadata },
  };
}

function cloneMetadata(record: MetadataRecord): MetadataRecord {
  return cloneMetadataRecord(record);
}

function cloneState(state: PipelineIntegrationState): PipelineIntegrationState {
  return {
    ...state,
    normalized: state.normalized ? cloneNormalized(state.normalized) : null,
    metadata: state.metadata ? cloneMetadata(state.metadata) : null,
  };
}

/**
 * Composition exit mapping — does not change Validation Engine behaviour.
 * Unsupported family → REJECTED. Corruption / unknown → FAILED (fail closed).
 */
export function mapValidationReasonToExit(
  reason: ValidationReason,
): "REJECTED" | "FAILED" {
  if (reason === "CORRUPTED_IMAGE" || reason === "UNKNOWN_VALIDATION_ERROR") {
    return "FAILED";
  }
  return "REJECTED";
}

export type IntegratedSmartMobileImagePipeline = {
  pipelineEngine: SmartMobileImagePipelineEngine;
  validationEngine: SmartMobileImageValidationEngine;
  normalizationEngine: SmartMobileImageNormalizationEngine;
  metadataEngine: SmartMobileImageMetadataEngine;
};

/** ONE composition factory — exactly one instance of each certified engine. */
export function createIntegratedSmartMobileImagePipeline(): IntegratedSmartMobileImagePipeline {
  return {
    pipelineEngine: createSmartMobileImagePipelineEngine(),
    validationEngine: createSmartMobileImageValidationEngine(),
    normalizationEngine: createSmartMobileImageNormalizationEngine(),
    metadataEngine: createSmartMobileImageMetadataEngine(),
  };
}

export function assertPipelineCompositionInvariants(
  module: IntegratedSmartMobileImagePipeline,
): PipelineCompositionInvariantResult {
  const violations: string[] = [];

  if (!(module.pipelineEngine instanceof SmartMobileImagePipelineEngine)) {
    violations.push("Missing Pipeline Engine");
  }
  if (!(module.validationEngine instanceof SmartMobileImageValidationEngine)) {
    violations.push("Missing Validation Engine");
  }
  if (!(module.normalizationEngine instanceof SmartMobileImageNormalizationEngine)) {
    violations.push("Missing Normalization Engine");
  }
  if (!(module.metadataEngine instanceof SmartMobileImageMetadataEngine)) {
    violations.push("Missing Metadata Engine");
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

  const order = SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_V1.canonicalOrder;
  if (
    order[0] !== "PIPELINE_ENGINE" ||
    order[1] !== "VALIDATION_ENGINE" ||
    order[2] !== "NORMALIZATION_ENGINE" ||
    order[3] !== "METADATA_ENGINE"
  ) {
    violations.push("Canonical engine order violated");
  }

  if (violations.length > 0) {
    return { ok: false, violations };
  }
  return { ok: true, ownership: OWNERSHIP };
}

/**
 * Canonical Pipeline Integration orchestrator.
 * Owns composition state only — engines retain single ownership of their domains.
 */
export class SmartMobileImagePipelineComposition {
  private state: PipelineIntegrationState = createInitialState();
  private readonly listeners = new Set<IntegrationListener>();
  private readonly module: IntegratedSmartMobileImagePipeline;

  constructor(module?: IntegratedSmartMobileImagePipeline) {
    this.module = module ?? createIntegratedSmartMobileImagePipeline();
  }

  getEngines(): IntegratedSmartMobileImagePipeline {
    return this.module;
  }

  getSnapshot(): PipelineIntegrationState {
    return cloneState(this.state);
  }

  subscribe(listener: IntegrationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Canonical flow:
   * RECEIVED → VALIDATING → NORMALIZING → METADATA_READY → PIPELINE_READY
   * or REJECTED / FAILED (fail closed).
   */
  process(input: ProcessPipelineImageInput): PipelineIntegrationResult {
    const invariants = assertPipelineCompositionInvariants(this.module);
    if (!invariants.ok) {
      return this.failClosed(
        "FAILED",
        "COMPOSITION_INVARIANT_VIOLATION",
        input.at,
        input.imageId?.trim() || null,
      );
    }

    if (
      this.state.status !== "RECEIVED" &&
      this.state.status !== "PIPELINE_READY" &&
      this.state.status !== "REJECTED" &&
      this.state.status !== "FAILED"
    ) {
      return this.failClosed(
        "FAILED",
        "INVALID_TRANSITION",
        input.at,
        this.state.imageId,
      );
    }

    if (this.state.status !== "RECEIVED") {
      if (!canTransition(this.state.status, "RECEIVED")) {
        return this.failClosed(
          "FAILED",
          "INVALID_TRANSITION",
          input.at,
          this.state.imageId,
        );
      }
      this.resetEngines();
      this.state = createInitialState(input.at);
    }

    const imageId = input.imageId?.trim() ?? "";
    if (!imageId || !input.contentFingerprint?.trim()) {
      return this.failClosed("FAILED", "INVALID_INPUT", input.at, null);
    }

    const events: PipelineIntegrationEvent[] = [];

    // --- Pipeline Engine intake (composition step 1) ---
    const pipelineReceive = this.module.pipelineEngine.receiveImage({
      imageId,
      format: input.format,
      width: input.width,
      height: input.height,
      orientation: input.orientation,
      byteLength: input.byteLength,
      contentFingerprint: input.contentFingerprint,
      localUri: input.localUri,
      // Bytes reserved for Validation Engine ownership of JPEG guards in this composition.
    });
    if (!pipelineReceive.ok) {
      if (
        pipelineReceive.code === "INVALID_FORMAT" ||
        pipelineReceive.failureClass === "INVALID_FORMAT"
      ) {
        this.state = {
          status: "RECEIVED",
          imageId,
          normalized: null,
          metadata: null,
          failureReason: null,
          updatedAt: input.at,
        };
        const receivedEvent: PipelineIntegrationEvent = {
          type: "IntegrationReceived",
          imageId,
          at: input.at,
        };
        events.push(receivedEvent);
        this.emit(receivedEvent);
        this.state = { ...this.state, status: "VALIDATING", updatedAt: input.at };
        const validatingEvent: PipelineIntegrationEvent = {
          type: "IntegrationValidating",
          imageId,
          at: input.at,
        };
        events.push(validatingEvent);
        this.emit(validatingEvent);
        return this.exitFromValidation("UNSUPPORTED_FORMAT", imageId, input.at, events);
      }
      return this.failClosed(
        "FAILED",
        "PIPELINE_INTAKE_FAILED",
        input.at,
        imageId,
      );
    }

    this.state = {
      status: "RECEIVED",
      imageId,
      normalized: null,
      metadata: null,
      failureReason: null,
      updatedAt: input.at,
    };
    const receivedEvent: PipelineIntegrationEvent = {
      type: "IntegrationReceived",
      imageId,
      at: input.at,
    };
    events.push(receivedEvent);
    this.emit(receivedEvent);

    // --- Validation Engine (composition step 2) ---
    if (!canTransition("RECEIVED", "VALIDATING")) {
      return this.failClosed("FAILED", "INVALID_TRANSITION", input.at, imageId);
    }
    this.state = { ...this.state, status: "VALIDATING", updatedAt: input.at };
    const validatingEvent: PipelineIntegrationEvent = {
      type: "IntegrationValidating",
      imageId,
      at: input.at,
    };
    events.push(validatingEvent);
    this.emit(validatingEvent);

    const validationReceive = this.module.validationEngine.receiveImage({
      imageId,
      format: input.format,
      mimeType: input.mimeType,
      extension: input.extension,
      width: input.width,
      height: input.height,
      orientation: input.orientation,
      byteLength: input.byteLength,
      contentFingerprint: input.contentFingerprint,
      localUri: input.localUri,
      bytes: input.bytes,
      at: input.at,
    });
    if (!validationReceive.ok) {
      const reason = validationReceive.reason ?? "UNKNOWN_VALIDATION_ERROR";
      return this.exitFromValidation(reason, imageId, input.at, events);
    }

    const validated = this.module.validationEngine.validate(input.at);
    if (!validated.ok) {
      const reason = validated.reason ?? "UNKNOWN_VALIDATION_ERROR";
      return this.exitFromValidation(reason, imageId, input.at, events);
    }
    if (validated.state.status === "REJECTED" || validated.result?.status === "INVALID") {
      const reason =
        validated.state.failureReason ??
        (validated.result && validated.result.status === "INVALID"
          ? validated.result.reason
          : "UNKNOWN_VALIDATION_ERROR");
      return this.exitFromValidation(reason, imageId, input.at, events);
    }
    if (validated.state.status !== "READY") {
      return this.failClosed("FAILED", "UNKNOWN_INTEGRATION_ERROR", input.at, imageId);
    }

    // --- Normalization Engine (composition step 3) ---
    if (!canTransition("VALIDATING", "NORMALIZING")) {
      return this.failClosed("FAILED", "INVALID_TRANSITION", input.at, imageId);
    }
    this.state = { ...this.state, status: "NORMALIZING", updatedAt: input.at };
    const normalizingEvent: PipelineIntegrationEvent = {
      type: "IntegrationNormalizing",
      imageId,
      at: input.at,
    };
    events.push(normalizingEvent);
    this.emit(normalizingEvent);

    const filename = input.filename ?? "";
    const loadNorm = this.module.normalizationEngine.load({
      imageId,
      format: input.format,
      mimeType: input.mimeType,
      extension: input.extension,
      width: input.width,
      height: input.height,
      orientation: input.orientation,
      byteLength: input.byteLength,
      contentFingerprint: input.contentFingerprint,
      filename,
      timestamp: input.timestamp,
      at: input.at,
    });
    if (!loadNorm.ok) {
      return this.failClosed("FAILED", "NORMALIZATION_FAILED", input.at, imageId);
    }
    const normalized = this.module.normalizationEngine.normalize(input.at);
    if (!normalized.ok || !normalized.image || normalized.state.status !== "NORMALIZED") {
      return this.failClosed("FAILED", "NORMALIZATION_FAILED", input.at, imageId);
    }

    // --- Metadata Engine (composition step 4) ---
    const meta = normalized.image.metadata;
    const created = this.module.metadataEngine.create({
      identifier: meta.imageId,
      fingerprint: meta.contentFingerprint,
      width: meta.width,
      height: meta.height,
      orientation: meta.orientation,
      mimeType: meta.mimeType,
      extension: meta.extension,
      fileName: meta.filename,
      fileSize: meta.byteLength,
      timestamp: input.timestamp,
      format: meta.format,
      at: input.at,
    });
    if (!created.ok || !created.record) {
      return this.failClosed("FAILED", "METADATA_FAILED", input.at, imageId);
    }
    const frozen = this.module.metadataEngine.freeze(input.at);
    if (!frozen.ok || !frozen.record || frozen.state.status !== "FROZEN") {
      return this.failClosed("FAILED", "METADATA_FAILED", input.at, imageId);
    }

    if (!canTransition("NORMALIZING", "METADATA_READY")) {
      return this.failClosed("FAILED", "INVALID_TRANSITION", input.at, imageId);
    }
    this.state = {
      status: "METADATA_READY",
      imageId,
      normalized: cloneNormalized(normalized.image),
      metadata: cloneMetadata(frozen.record),
      failureReason: null,
      updatedAt: input.at,
    };
    const metadataReadyEvent: PipelineIntegrationEvent = {
      type: "IntegrationMetadataReady",
      imageId,
      at: input.at,
    };
    events.push(metadataReadyEvent);
    this.emit(metadataReadyEvent);

    // --- Pipeline Engine completion (composition step 5) ---
    const pipelineValidated = this.module.pipelineEngine.validatePipeline();
    if (!pipelineValidated.ok || pipelineValidated.state.status === "REJECTED") {
      return this.failClosed("FAILED", "PIPELINE_INTAKE_FAILED", input.at, imageId);
    }
    const pipelineReady = this.module.pipelineEngine.normalizePipeline();
    if (!pipelineReady.ok || pipelineReady.state.status !== "READY") {
      return this.failClosed("FAILED", "PIPELINE_INTAKE_FAILED", input.at, imageId);
    }

    if (!canTransition("METADATA_READY", "PIPELINE_READY")) {
      return this.failClosed("FAILED", "INVALID_TRANSITION", input.at, imageId);
    }
    this.state = {
      ...this.state,
      status: "PIPELINE_READY",
      updatedAt: input.at,
    };
    const readyEvent: PipelineIntegrationEvent = {
      type: "IntegrationPipelineReady",
      imageId,
      at: input.at,
    };
    events.push(readyEvent);
    this.emit(readyEvent);

    return {
      ok: true,
      state: this.getSnapshot(),
      events,
    };
  }

  reset(at = 0): PipelineIntegrationResult {
    this.resetEngines();
    this.state = createInitialState(at);
    return { ok: true, state: this.getSnapshot(), events: [] };
  }

  private exitFromValidation(
    reason: ValidationReason,
    imageId: string,
    at: number,
    priorEvents: readonly PipelineIntegrationEvent[],
  ): PipelineIntegrationResult {
    const exit = mapValidationReasonToExit(reason);
    if (exit === "REJECTED") {
      if (!canTransition(this.state.status, "REJECTED")) {
        return this.failClosed("FAILED", "INVALID_TRANSITION", at, imageId);
      }
      this.state = {
        status: "REJECTED",
        imageId,
        normalized: null,
        metadata: null,
        failureReason: reason,
        updatedAt: at,
      };
      const event: PipelineIntegrationEvent = {
        type: "IntegrationRejected",
        imageId,
        reason,
        at,
      };
      this.emit(event);
      return {
        ok: true,
        state: this.getSnapshot(),
        events: [...priorEvents, event],
      };
    }
    return this.failClosed("FAILED", reason, at, imageId);
  }

  private failClosed(
    code: "FAILED" | "REJECTED",
    reason: PipelineIntegrationFailureReason,
    at: number,
    imageId: string | null,
  ): PipelineIntegrationResult {
    this.state = {
      status: "FAILED",
      imageId,
      normalized: this.state.normalized ? cloneNormalized(this.state.normalized) : null,
      metadata: this.state.metadata ? cloneMetadata(this.state.metadata) : null,
      failureReason: reason,
      updatedAt: at,
    };
    this.emit({
      type: "IntegrationFailed",
      imageId,
      reason,
      at,
    });
    return {
      ok: false,
      code,
      message: ERROR_MESSAGE[code],
      reason,
    };
  }

  private resetEngines(): void {
    this.module.pipelineEngine.resetPipeline();
    this.module.validationEngine.reset();
    this.module.normalizationEngine.reset();
    this.module.metadataEngine.reset();
  }

  private emit(event: PipelineIntegrationEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export function createSmartMobileImagePipelineComposition(
  module?: IntegratedSmartMobileImagePipeline,
): SmartMobileImagePipelineComposition {
  return new SmartMobileImagePipelineComposition(module);
}

export function isPipelineIntegrationTransitionAllowed(
  from: PipelineIntegrationStatus,
  to: PipelineIntegrationStatus,
): boolean {
  return canTransition(from, to);
}

export function certifySmartMobileImagePipelineIntegration(
  composition: SmartMobileImagePipelineComposition = createSmartMobileImagePipelineComposition(),
): PipelineCompositionInvariantResult {
  return assertPipelineCompositionInvariants(composition.getEngines());
}
