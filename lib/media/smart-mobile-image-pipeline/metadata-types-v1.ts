/**
 * ROVEXO Smart Mobile Image Pipeline — Metadata types v1.0
 *
 * PHASE IV · COD SÂNGE · Metadata Engine · Logic only
 *
 * Image metadata ownership only — no validation / normalization / UI / upload state.
 */

import type {
  PipelineImageFormat,
  PipelineOrientation,
} from "@/lib/media/smart-mobile-image-pipeline/pipeline-types-v1";

export type MetadataEngineStatus =
  | "EMPTY"
  | "CREATED"
  | "ACTIVE"
  | "FROZEN"
  | "FAILED";

export type MetadataVersion = number;

export type ImageIdentifier = string;
export type ImageFingerprint = string;

/**
 * Descriptive completeness flags for metadata fields only.
 * Never holds validation / normalization / upload / camera / UI / runtime engine state.
 */
export type ProcessingFlags = {
  readonly dimensionsPresent: boolean;
  readonly orientationPresent: boolean;
  readonly fingerprintPresent: boolean;
  readonly mimePresent: boolean;
  readonly extensionPresent: boolean;
  readonly fileNamePresent: boolean;
};

/**
 * Pipeline-facing metadata shape owned by the Metadata Engine.
 * Pure data — no lifecycle / engine status fields.
 */
export type PipelineMetadataShape = {
  readonly format: PipelineImageFormat;
  readonly width: number;
  readonly height: number;
  readonly orientation: PipelineOrientation;
  readonly byteLength: number;
  readonly contentFingerprint: ImageFingerprint;
};

export type ImageMetadata = {
  readonly identifier: ImageIdentifier;
  readonly fingerprint: ImageFingerprint;
  readonly width: number;
  readonly height: number;
  readonly orientation: PipelineOrientation;
  readonly mimeType: string;
  readonly extension: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly timestamp: number;
  readonly processingFlags: ProcessingFlags;
  readonly pipelineMetadata: PipelineMetadataShape;
};

export type MetadataRecord = {
  readonly version: MetadataVersion;
  readonly metadata: ImageMetadata;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly frozenAt: number | null;
};

export type MetadataSnapshot = {
  readonly version: MetadataVersion;
  readonly capturedAt: number;
  readonly record: MetadataRecord;
};

export type MetadataState = {
  readonly status: MetadataEngineStatus;
  readonly record: MetadataRecord | null;
  readonly lastSnapshot: MetadataSnapshot | null;
  readonly lastCompareEqual: boolean | null;
  readonly failureReason: MetadataFailureReason | null;
  readonly updatedAt: number;
};

export type MetadataFailureReason =
  | "INVALID_INPUT"
  | "INVALID_TRANSITION"
  | "NO_METADATA"
  | "FROZEN"
  | "UNKNOWN_METADATA_ERROR";

export type MetadataEngineErrorCode =
  | "INVALID_TRANSITION"
  | "INVALID_INPUT"
  | "NO_METADATA"
  | "FROZEN"
  | "METADATA_FAILED";

export type MetadataFailure = {
  ok: false;
  code: MetadataEngineErrorCode;
  message: string;
  reason?: MetadataFailureReason;
};

export type MetadataSuccess = {
  ok: true;
  state: MetadataState;
  events: readonly MetadataEngineEvent[];
  record: MetadataRecord | null;
  snapshot: MetadataSnapshot | null;
  compareEqual: boolean | null;
};

export type MetadataResult = MetadataSuccess | MetadataFailure;

export type MetadataEngineEventType =
  | "MetadataCreated"
  | "MetadataUpdated"
  | "MetadataFrozen"
  | "MetadataCompared"
  | "MetadataSnapshotCreated"
  | "MetadataFailed";

export type MetadataEngineEvent =
  | { type: "MetadataCreated"; identifier: ImageIdentifier; version: MetadataVersion; at: number }
  | { type: "MetadataUpdated"; identifier: ImageIdentifier; version: MetadataVersion; at: number }
  | { type: "MetadataFrozen"; identifier: ImageIdentifier; version: MetadataVersion; at: number }
  | {
      type: "MetadataCompared";
      identifier: ImageIdentifier;
      equal: boolean;
      at: number;
    }
  | {
      type: "MetadataSnapshotCreated";
      identifier: ImageIdentifier;
      version: MetadataVersion;
      at: number;
    }
  | {
      type: "MetadataFailed";
      identifier: ImageIdentifier | null;
      reason: MetadataFailureReason;
      at: number;
    };

export type CreateMetadataInput = {
  identifier: ImageIdentifier;
  fingerprint: ImageFingerprint;
  width: number;
  height: number;
  orientation: PipelineOrientation;
  mimeType: string;
  extension: string;
  fileName: string;
  fileSize: number;
  timestamp: number;
  format: PipelineImageFormat;
  at?: number;
};

export type MergeMetadataPatch = Partial<{
  fingerprint: ImageFingerprint;
  width: number;
  height: number;
  orientation: PipelineOrientation;
  mimeType: string;
  extension: string;
  fileName: string;
  fileSize: number;
  timestamp: number;
  format: PipelineImageFormat;
}>;
