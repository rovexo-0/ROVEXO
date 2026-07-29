/**
 * ROVEXO Smart Mobile Image Pipeline — Integration types v1.0
 *
 * PHASE V · COD SÂNGE · Pipeline Integration · Logic only
 *
 * Composition contracts only — no new engine features.
 */

import type { MetadataRecord } from "@/lib/media/smart-mobile-image-pipeline/metadata-types-v1";
import type { NormalizedImage } from "@/lib/media/smart-mobile-image-pipeline/normalization-types-v1";
import type {
  PipelineImageFormat,
  PipelineOrientation,
} from "@/lib/media/smart-mobile-image-pipeline/pipeline-types-v1";
import type { ValidationReason } from "@/lib/media/smart-mobile-image-pipeline/validation-types-v1";

export type PipelineIntegrationStatus =
  | "RECEIVED"
  | "VALIDATING"
  | "NORMALIZING"
  | "METADATA_READY"
  | "PIPELINE_READY"
  | "REJECTED"
  | "FAILED";

export type PipelineIntegrationFailureReason =
  | ValidationReason
  | "INVALID_TRANSITION"
  | "PIPELINE_INTAKE_FAILED"
  | "NORMALIZATION_FAILED"
  | "METADATA_FAILED"
  | "COMPOSITION_INVARIANT_VIOLATION"
  | "UNKNOWN_INTEGRATION_ERROR";

export type PipelineIntegrationState = {
  readonly status: PipelineIntegrationStatus;
  readonly imageId: string | null;
  readonly normalized: NormalizedImage | null;
  readonly metadata: MetadataRecord | null;
  readonly failureReason: PipelineIntegrationFailureReason | null;
  readonly updatedAt: number;
};

export type PipelineIntegrationErrorCode =
  | "INVALID_TRANSITION"
  | "INVALID_INPUT"
  | "REJECTED"
  | "FAILED"
  | "INTEGRATION_FAILED";

export type PipelineIntegrationFailure = {
  ok: false;
  code: PipelineIntegrationErrorCode;
  message: string;
  reason?: PipelineIntegrationFailureReason;
};

export type PipelineIntegrationSuccess = {
  ok: true;
  state: PipelineIntegrationState;
  events: readonly PipelineIntegrationEvent[];
};

export type PipelineIntegrationResult =
  | PipelineIntegrationSuccess
  | PipelineIntegrationFailure;

export type PipelineIntegrationEventType =
  | "IntegrationReceived"
  | "IntegrationValidating"
  | "IntegrationNormalizing"
  | "IntegrationMetadataReady"
  | "IntegrationPipelineReady"
  | "IntegrationRejected"
  | "IntegrationFailed";

export type PipelineIntegrationEvent =
  | { type: "IntegrationReceived"; imageId: string; at: number }
  | { type: "IntegrationValidating"; imageId: string; at: number }
  | { type: "IntegrationNormalizing"; imageId: string; at: number }
  | { type: "IntegrationMetadataReady"; imageId: string; at: number }
  | { type: "IntegrationPipelineReady"; imageId: string; at: number }
  | {
      type: "IntegrationRejected";
      imageId: string | null;
      reason: PipelineIntegrationFailureReason;
      at: number;
    }
  | {
      type: "IntegrationFailed";
      imageId: string | null;
      reason: PipelineIntegrationFailureReason;
      at: number;
    };

export type ProcessPipelineImageInput = {
  imageId: string;
  format: PipelineImageFormat;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
  orientation: PipelineOrientation;
  byteLength: number;
  contentFingerprint: string;
  filename?: string;
  localUri?: string;
  bytes?: Uint8Array;
  /** Deterministic epoch for normalization / metadata timestamps. */
  timestamp: number;
  /** Deterministic composition clock — no timers inside integration. */
  at: number;
};

export type PipelineCompositionOwnership = {
  readonly pipelineEngineCount: 1;
  readonly validationEngineCount: 1;
  readonly normalizationEngineCount: 1;
  readonly metadataEngineCount: 1;
  readonly compositionCount: 1;
};

export type PipelineCompositionInvariantResult =
  | { ok: true; ownership: PipelineCompositionOwnership }
  | { ok: false; violations: readonly string[] };
