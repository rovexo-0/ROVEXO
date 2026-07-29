/**
 * ROVEXO Smart Mobile Image Pipeline — types v1.0
 *
 * PHASE I · COD SÂNGE · Architecture & SSOT Foundation · Logic only
 *
 * Pure contracts — no UI · no camera · no network · no storage.
 */

export const SMART_MOBILE_IMAGE_PIPELINE_MAX_IMAGES = 8 as const;
export const SMART_MOBILE_IMAGE_PIPELINE_MIN_DIMENSION = 1 as const;
export const SMART_MOBILE_IMAGE_PIPELINE_MAX_DIMENSION = 10_000 as const;

export type PipelineImageFormat = "jpeg" | "png" | "webp";

/** EXIF orientation 1–8, or upright degrees after logical normalization. */
export type PipelineOrientation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 0 | 90 | 180 | 270;

export type PipelineStatus =
  | "EMPTY"
  | "RECEIVED"
  | "VALIDATING"
  | "NORMALIZING"
  | "READY"
  | "FAILED"
  | "REJECTED";

export type PipelineFailureClass =
  | "INVALID_FORMAT"
  | "INVALID_DIMENSIONS"
  | "INVALID_ORIENTATION"
  | "CORRUPTED_IMAGE"
  | "DUPLICATE_IMAGE"
  | "CAPACITY_REACHED"
  | "INVALID_TRANSITION"
  | "INVALID_INPUT"
  | "UNRECOVERABLE";

export type PipelineMetadata = {
  format: PipelineImageFormat;
  width: number;
  height: number;
  orientation: PipelineOrientation;
  byteLength: number;
  contentFingerprint: string;
  normalized: boolean;
  /** True when JPEG bytes were inspected and SOI passed. */
  jpegSoiValid: boolean | null;
};

export type PipelineImage = {
  imageId: string;
  localUri: string | null;
  metadata: PipelineMetadata;
  receivedAt: number;
  validatedAt: number | null;
  normalizedAt: number | null;
};

export type PipelineState = {
  status: PipelineStatus;
  images: readonly PipelineImage[];
  failureClass: PipelineFailureClass | null;
  lastRejectedImageId: string | null;
  updatedAt: number;
};

export type PipelineErrorCode =
  | "INVALID_TRANSITION"
  | "INVALID_INPUT"
  | "CAPACITY_REACHED"
  | "DUPLICATE_IMAGE"
  | "INVALID_FORMAT"
  | "INVALID_DIMENSIONS"
  | "INVALID_ORIENTATION"
  | "CORRUPTED_IMAGE"
  | "IMAGE_NOT_FOUND"
  | "PIPELINE_FAILED"
  | "PIPELINE_REJECTED"
  | "NO_IMAGES";

export type PipelineFailure = {
  ok: false;
  code: PipelineErrorCode;
  message: string;
  failureClass?: PipelineFailureClass;
};

export type PipelineSuccess = {
  ok: true;
  state: PipelineState;
  events: readonly PipelineEvent[];
};

export type PipelineResult = PipelineSuccess | PipelineFailure;

export type PipelineEventType =
  | "ImageReceived"
  | "ImageValidated"
  | "ImageRejected"
  | "ImageNormalized"
  | "PipelineReady"
  | "PipelineFailed";

export type PipelineEvent =
  | { type: "ImageReceived"; imageId: string; at: number }
  | { type: "ImageValidated"; imageId: string; at: number }
  | {
      type: "ImageRejected";
      imageId: string;
      failureClass: PipelineFailureClass;
      at: number;
    }
  | { type: "ImageNormalized"; imageId: string; at: number }
  | { type: "PipelineReady"; imageCount: number; at: number }
  | {
      type: "PipelineFailed";
      failureClass: PipelineFailureClass;
      at: number;
    };

export type ReceivePipelineImageInput = {
  imageId?: string;
  format: PipelineImageFormat;
  width: number;
  height: number;
  orientation: PipelineOrientation;
  byteLength: number;
  contentFingerprint: string;
  localUri?: string;
  /** Optional in-memory bytes for JPEG SOI / corruption checks only. */
  bytes?: Uint8Array;
};
