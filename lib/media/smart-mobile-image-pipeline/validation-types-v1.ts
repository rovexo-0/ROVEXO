/**
 * ROVEXO Smart Mobile Image Pipeline — Validation types v1.0
 *
 * PHASE II · COD SÂNGE · Validation Engine · Logic only
 *
 * Owns validation contracts only — no normalization · no upload · no UI.
 */

import type {
  PipelineImageFormat,
  PipelineOrientation,
} from "@/lib/media/smart-mobile-image-pipeline/pipeline-types-v1";
import { SMART_MOBILE_IMAGE_PIPELINE_MAX_IMAGES } from "@/lib/media/smart-mobile-image-pipeline/pipeline-types-v1";

export const SMART_MOBILE_IMAGE_VALIDATION_MIN_DIMENSION = 32 as const;
export const SMART_MOBILE_IMAGE_VALIDATION_MAX_DIMENSION = 10_000 as const;
export const SMART_MOBILE_IMAGE_VALIDATION_MAX_BYTES = 15_728_640 as const; // 15 MiB
export const SMART_MOBILE_IMAGE_VALIDATION_MAX_IMAGES =
  SMART_MOBILE_IMAGE_PIPELINE_MAX_IMAGES;

export type ValidationReason =
  | "INVALID_INPUT"
  | "UNSUPPORTED_FORMAT"
  | "INVALID_MIME"
  | "INVALID_EXTENSION"
  | "IMAGE_TOO_SMALL"
  | "IMAGE_TOO_LARGE"
  | "FILE_TOO_LARGE"
  | "MISSING_METADATA"
  | "INVALID_ORIENTATION"
  | "CORRUPTED_IMAGE"
  | "DUPLICATE_IMAGE"
  | "MAXIMUM_IMAGES_EXCEEDED"
  | "UNKNOWN_VALIDATION_ERROR";

export type ValidationVerdict = "VALID" | "INVALID";

export type ImageValidationResult =
  | { status: "VALID" }
  | { status: "INVALID"; reason: ValidationReason };

export type ValidationEngineStatus =
  | "RECEIVED"
  | "VALIDATING"
  | "VALID"
  | "READY"
  | "INVALID"
  | "REJECTED"
  | "FAILED";

export type ValidationImageRecord = {
  imageId: string;
  format: PipelineImageFormat;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
  orientation: PipelineOrientation;
  byteLength: number;
  contentFingerprint: string;
  localUri: string | null;
  /** Optional JPEG bytes for SOI / UTF-8 corruption guards only. */
  hasBytes: boolean;
  jpegSoiValid: boolean | null;
};

export type ValidationEngineState = {
  status: ValidationEngineStatus;
  images: readonly ValidationImageRecord[];
  lastResult: ImageValidationResult | null;
  lastRejectedImageId: string | null;
  failureReason: ValidationReason | null;
  updatedAt: number;
};

export type ValidationEngineErrorCode =
  | "INVALID_TRANSITION"
  | "NO_IMAGES"
  | "VALIDATION_FAILED";

export type ValidationEngineFailure = {
  ok: false;
  code: ValidationEngineErrorCode;
  message: string;
  reason?: ValidationReason;
};

export type ValidationEngineSuccess = {
  ok: true;
  state: ValidationEngineState;
  events: readonly ValidationEngineEvent[];
  result: ImageValidationResult | null;
};

export type ValidationEngineResult = ValidationEngineSuccess | ValidationEngineFailure;

export type ValidationEngineEventType =
  | "ValidationStarted"
  | "ValidationPassed"
  | "ValidationFailed"
  | "ImageRejected"
  | "PipelineReady"
  | "PipelineFailed";

export type ValidationEngineEvent =
  | { type: "ValidationStarted"; imageCount: number; at: number }
  | { type: "ValidationPassed"; imageId: string; at: number }
  | {
      type: "ValidationFailed";
      imageId: string | null;
      reason: ValidationReason;
      at: number;
    }
  | {
      type: "ImageRejected";
      imageId: string;
      reason: ValidationReason;
      at: number;
    }
  | { type: "PipelineReady"; imageCount: number; at: number }
  | {
      type: "PipelineFailed";
      reason: ValidationReason;
      at: number;
    };

export type ReceiveValidationImageInput = {
  imageId: string;
  format: PipelineImageFormat;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
  orientation: PipelineOrientation;
  byteLength: number;
  contentFingerprint: string;
  localUri?: string;
  bytes?: Uint8Array;
  /** Deterministic timestamp — no timers inside the engine. */
  at?: number;
};

export type ValidationContext = {
  existingImageIds: readonly string[];
  existingFingerprints: readonly string[];
  currentCount: number;
};
