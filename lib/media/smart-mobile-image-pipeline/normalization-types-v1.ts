/**
 * ROVEXO Smart Mobile Image Pipeline — Normalization types v1.0
 *
 * PHASE III · COD SÂNGE · Normalization Engine · Logic only
 *
 * Metadata normalization only — never touches image bytes.
 */

import type { PipelineImageFormat, PipelineOrientation } from "@/lib/media/smart-mobile-image-pipeline/pipeline-types-v1";

export type NormalizationEngineStatus =
  | "NOT_NORMALIZED"
  | "NORMALIZING"
  | "NORMALIZED"
  | "FAILED";

export type NormalizationFailureReason =
  | "INVALID_INPUT"
  | "INVALID_TRANSITION"
  | "UNKNOWN_NORMALIZATION_ERROR";

export type NormalizedMetadata = {
  format: PipelineImageFormat;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
  orientation: 1;
  byteLength: number;
  contentFingerprint: string;
  filename: string;
  imageId: string;
  timestamp: string;
  /** Preserved originals — normalization must not lose information. */
  originalMimeType: string;
  originalExtension: string;
  originalWidth: number;
  originalHeight: number;
  originalOrientation: PipelineOrientation;
  originalFilename: string;
  originalImageId: string;
  originalTimestamp: number;
};

export type NormalizedImage = {
  imageId: string;
  metadata: NormalizedMetadata;
  normalizedAt: number;
};

export type NormalizationState = {
  status: NormalizationEngineStatus;
  image: NormalizedImage | null;
  failureReason: NormalizationFailureReason | null;
  updatedAt: number;
};

export type NormalizationEngineErrorCode =
  | "INVALID_TRANSITION"
  | "INVALID_INPUT"
  | "NO_IMAGE"
  | "NORMALIZATION_FAILED";

export type NormalizationFailure = {
  ok: false;
  code: NormalizationEngineErrorCode;
  message: string;
  reason?: NormalizationFailureReason;
};

export type NormalizationSuccess = {
  ok: true;
  state: NormalizationState;
  events: readonly NormalizationEngineEvent[];
  image: NormalizedImage | null;
};

export type NormalizationResult = NormalizationSuccess | NormalizationFailure;

export type NormalizationEngineEventType =
  | "NormalizationStarted"
  | "NormalizationCompleted"
  | "NormalizationFailed";

export type NormalizationEngineEvent =
  | { type: "NormalizationStarted"; imageId: string; at: number }
  | { type: "NormalizationCompleted"; imageId: string; at: number }
  | {
      type: "NormalizationFailed";
      imageId: string | null;
      reason: NormalizationFailureReason;
      at: number;
    };

export type NormalizeImageInput = {
  imageId: string;
  format: PipelineImageFormat;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
  orientation: PipelineOrientation;
  byteLength: number;
  contentFingerprint: string;
  filename: string;
  /** Deterministic epoch ms — no timers inside the engine. */
  timestamp: number;
  /** Deterministic clock for events / normalizedAt. */
  at?: number;
};
