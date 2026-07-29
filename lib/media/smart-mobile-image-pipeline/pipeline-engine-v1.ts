/**
 * ROVEXO Smart Mobile Image Pipeline — Engine v1.0
 *
 * PHASE I · COD SÂNGE · Architecture & SSOT Foundation · Logic only · CERTIFIED
 *
 * Owns: pipeline lifecycle · pipeline state · lifecycle orchestration.
 * Canonical Validation / Normalization / Metadata ownership: Phase II / III / IV.
 * Inline validatePipeline / normalizePipeline remain LIFECYCLE_COMPAT only.
 *
 * NEVER: UI · camera · network · storage · Supabase · upload · pixels decode.
 */

import { safeRandomUUID } from "@/lib/uuid";
import {
  isUtf8CorruptedJpeg,
  isValidJpegSoi,
} from "@/lib/media/smart-mobile-image-pipeline/jpeg-guards-v1";
import type {
  PipelineErrorCode,
  PipelineEvent,
  PipelineFailureClass,
  PipelineImage,
  PipelineImageFormat,
  PipelineMetadata,
  PipelineOrientation,
  PipelineResult,
  PipelineState,
  PipelineStatus,
  ReceivePipelineImageInput,
} from "@/lib/media/smart-mobile-image-pipeline/pipeline-types-v1";
import {
  SMART_MOBILE_IMAGE_PIPELINE_MAX_DIMENSION,
  SMART_MOBILE_IMAGE_PIPELINE_MAX_IMAGES,
  SMART_MOBILE_IMAGE_PIPELINE_MIN_DIMENSION,
} from "@/lib/media/smart-mobile-image-pipeline/pipeline-types-v1";

export const SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1 = {
  version: "1.0",
  id: "smart-mobile-image-pipeline-engine-v1",
  phase: "I_ARCHITECTURE_SSOT_FOUNDATION",
  status: "CERTIFIED",
  maxImages: SMART_MOBILE_IMAGE_PIPELINE_MAX_IMAGES,
  uiForbidden: true,
  networkForbidden: true,
  storageForbidden: true,
  cameraForbidden: true,
} as const;

type PipelineListener = (event: PipelineEvent) => void;

const ERROR_MESSAGE: Record<PipelineErrorCode, string> = {
  INVALID_TRANSITION: "Invalid pipeline state transition.",
  INVALID_INPUT: "Image input is invalid.",
  CAPACITY_REACHED: "Pipeline image capacity reached.",
  DUPLICATE_IMAGE: "Duplicate image rejected.",
  INVALID_FORMAT: "Image format is not supported.",
  INVALID_DIMENSIONS: "Image dimensions are invalid.",
  INVALID_ORIENTATION: "Image orientation is invalid.",
  CORRUPTED_IMAGE: "Image data is corrupted.",
  IMAGE_NOT_FOUND: "Image not found in pipeline.",
  PIPELINE_FAILED: "Pipeline failed.",
  PIPELINE_REJECTED: "Pipeline rejected input.",
  NO_IMAGES: "Pipeline has no images.",
};

const ALLOWED_TRANSITIONS: Readonly<Record<PipelineStatus, readonly PipelineStatus[]>> = {
  EMPTY: ["RECEIVED"],
  RECEIVED: ["VALIDATING", "EMPTY", "RECEIVED", "FAILED"],
  VALIDATING: ["NORMALIZING", "REJECTED", "FAILED", "RECEIVED"],
  NORMALIZING: ["READY", "FAILED"],
  READY: ["RECEIVED", "EMPTY", "VALIDATING"],
  FAILED: ["EMPTY", "RECEIVED"],
  REJECTED: ["EMPTY", "RECEIVED"],
};

const ALLOWED_FORMATS: readonly PipelineImageFormat[] = ["jpeg", "png", "webp"];

const ALLOWED_ORIENTATIONS: readonly PipelineOrientation[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 0, 90, 180, 270,
];

function fail(
  code: PipelineErrorCode,
  failureClass?: PipelineFailureClass,
): PipelineResult {
  return { ok: false, code, message: ERROR_MESSAGE[code], failureClass };
}

function succeed(
  state: PipelineState,
  events: readonly PipelineEvent[],
): PipelineResult {
  return { ok: true, state, events };
}

function now(): number {
  return Date.now();
}

function canTransition(from: PipelineStatus, to: PipelineStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

function createEmptyState(at = 0): PipelineState {
  return {
    status: "EMPTY",
    images: [],
    failureClass: null,
    lastRejectedImageId: null,
    updatedAt: at,
  };
}

function cloneImage(image: PipelineImage): PipelineImage {
  return {
    ...image,
    metadata: { ...image.metadata },
  };
}

function cloneState(state: PipelineState): PipelineState {
  return {
    ...state,
    images: state.images.map(cloneImage),
  };
}

function isAllowedFormat(format: string): format is PipelineImageFormat {
  return (ALLOWED_FORMATS as readonly string[]).includes(format);
}

function isAllowedOrientation(value: number): value is PipelineOrientation {
  return (ALLOWED_ORIENTATIONS as readonly number[]).includes(value);
}

function dimensionsValid(width: number, height: number): boolean {
  if (!Number.isFinite(width) || !Number.isFinite(height)) return false;
  if (!Number.isInteger(width) || !Number.isInteger(height)) return false;
  if (width < SMART_MOBILE_IMAGE_PIPELINE_MIN_DIMENSION) return false;
  if (height < SMART_MOBILE_IMAGE_PIPELINE_MIN_DIMENSION) return false;
  if (width > SMART_MOBILE_IMAGE_PIPELINE_MAX_DIMENSION) return false;
  if (height > SMART_MOBILE_IMAGE_PIPELINE_MAX_DIMENSION) return false;
  return true;
}

/**
 * Logical upright normalization — metadata only (no pixel decode).
 * EXIF 5–8 swap width/height; degrees 90/270 swap; others keep size.
 */
function normalizeMetadata(metadata: PipelineMetadata): PipelineMetadata {
  const orientation = metadata.orientation;
  const swaps =
    orientation === 5 ||
    orientation === 6 ||
    orientation === 7 ||
    orientation === 8 ||
    orientation === 90 ||
    orientation === 270;

  return {
    ...metadata,
    width: swaps ? metadata.height : metadata.width,
    height: swaps ? metadata.width : metadata.height,
    orientation: 1,
    normalized: true,
  };
}

function inspectBytes(
  format: PipelineImageFormat,
  bytes: Uint8Array | undefined,
):
  | { ok: true; jpegSoiValid: boolean | null }
  | { ok: false; code: PipelineErrorCode; failureClass: PipelineFailureClass } {
  if (!bytes) {
    return { ok: true, jpegSoiValid: null };
  }
  if (format !== "jpeg") {
    return { ok: true, jpegSoiValid: null };
  }
  if (isUtf8CorruptedJpeg(bytes)) {
    return { ok: false, code: "CORRUPTED_IMAGE", failureClass: "CORRUPTED_IMAGE" };
  }
  if (!isValidJpegSoi(bytes)) {
    return { ok: false, code: "CORRUPTED_IMAGE", failureClass: "CORRUPTED_IMAGE" };
  }
  return { ok: true, jpegSoiValid: true };
}

/**
 * Canonical Smart Mobile Image Pipeline — single owner of image processing state.
 */
export class SmartMobileImagePipelineEngine {
  private state: PipelineState = createEmptyState();
  private readonly listeners = new Set<PipelineListener>();

  getSnapshot(): PipelineState {
    return cloneState(this.state);
  }

  subscribe(listener: PipelineListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * EMPTY | READY | FAILED | REJECTED | RECEIVED → RECEIVED
   * Accepts one image reference + metadata. Never stores blobs to disk.
   */
  receiveImage(input: ReceivePipelineImageInput): PipelineResult {
    if (!canTransition(this.state.status, "RECEIVED") && this.state.status !== "RECEIVED") {
      return fail("INVALID_TRANSITION", "INVALID_TRANSITION");
    }

    if (this.state.images.length >= SMART_MOBILE_IMAGE_PIPELINE_MAX_IMAGES) {
      return fail("CAPACITY_REACHED", "CAPACITY_REACHED");
    }

    if (!isAllowedFormat(input.format)) {
      return fail("INVALID_FORMAT", "INVALID_FORMAT");
    }
    if (!dimensionsValid(input.width, input.height)) {
      return fail("INVALID_DIMENSIONS", "INVALID_DIMENSIONS");
    }
    if (!isAllowedOrientation(input.orientation)) {
      return fail("INVALID_ORIENTATION", "INVALID_ORIENTATION");
    }
    if (!Number.isFinite(input.byteLength) || input.byteLength <= 0) {
      return fail("INVALID_INPUT", "INVALID_INPUT");
    }
    const fingerprint = input.contentFingerprint.trim();
    if (!fingerprint) {
      return fail("INVALID_INPUT", "INVALID_INPUT");
    }

    const imageId = input.imageId?.trim() || safeRandomUUID();
    if (!imageId) {
      return fail("INVALID_INPUT", "INVALID_INPUT");
    }
    if (
      this.state.images.some(
        (image) =>
          image.imageId === imageId || image.metadata.contentFingerprint === fingerprint,
      )
    ) {
      return fail("DUPLICATE_IMAGE", "DUPLICATE_IMAGE");
    }

    const bytesCheck = inspectBytes(input.format, input.bytes);
    if (!bytesCheck.ok) {
      return fail(bytesCheck.code, bytesCheck.failureClass);
    }

    const at = now();
    const metadata: PipelineMetadata = {
      format: input.format,
      width: input.width,
      height: input.height,
      orientation: input.orientation,
      byteLength: input.byteLength,
      contentFingerprint: fingerprint,
      normalized: false,
      jpegSoiValid: bytesCheck.jpegSoiValid,
    };

    const image: PipelineImage = {
      imageId,
      localUri: input.localUri?.trim() || null,
      metadata,
      receivedAt: at,
      validatedAt: null,
      normalizedAt: null,
    };

    return this.commit(
      {
        status: "RECEIVED",
        images: [...this.state.images, image],
        failureClass: null,
        lastRejectedImageId: null,
        updatedAt: at,
      },
      [{ type: "ImageReceived", imageId, at }],
    );
  }

  /**
   * RECEIVED | READY → VALIDATING (or REJECTED on first invalid image).
   */
  validatePipeline(): PipelineResult {
    if (this.state.images.length === 0) {
      return fail("NO_IMAGES");
    }
    if (!canTransition(this.state.status, "VALIDATING")) {
      return fail("INVALID_TRANSITION", "INVALID_TRANSITION");
    }

    const at = now();
    const events: PipelineEvent[] = [];
    const nextImages: PipelineImage[] = [];

    for (const image of this.state.images) {
      const rejection = this.validateImageRecord(image);
      if (rejection) {
        events.push({
          type: "ImageRejected",
          imageId: image.imageId,
          failureClass: rejection.failureClass,
          at,
        });
        return this.commit(
          {
            status: "REJECTED",
            images: this.state.images,
            failureClass: rejection.failureClass,
            lastRejectedImageId: image.imageId,
            updatedAt: at,
          },
          events,
        );
      }
      events.push({ type: "ImageValidated", imageId: image.imageId, at });
      nextImages.push({
        imageId: image.imageId,
        localUri: image.localUri,
        metadata: { ...image.metadata },
        receivedAt: image.receivedAt,
        validatedAt: at,
        normalizedAt: image.normalizedAt,
      });
    }

    return this.commit(
      {
        status: "VALIDATING",
        images: nextImages,
        failureClass: null,
        lastRejectedImageId: null,
        updatedAt: at,
      },
      events,
    );
  }

  /**
   * VALIDATING → READY (via NORMALIZING rules).
   * Metadata-only upright normalization. Never decodes pixels.
   */
  normalizePipeline(): PipelineResult {
    if (this.state.status !== "VALIDATING") {
      return fail("INVALID_TRANSITION", "INVALID_TRANSITION");
    }
    if (this.state.images.length === 0) {
      return fail("NO_IMAGES");
    }
    if (!canTransition("VALIDATING", "NORMALIZING")) {
      return fail("INVALID_TRANSITION", "INVALID_TRANSITION");
    }
    if (!canTransition("NORMALIZING", "READY")) {
      return fail("INVALID_TRANSITION", "INVALID_TRANSITION");
    }

    const at = now();
    const events: PipelineEvent[] = [];
    const normalizedImages = this.state.images.map((image) => {
      const next: PipelineImage = {
        imageId: image.imageId,
        localUri: image.localUri,
        metadata: normalizeMetadata(image.metadata),
        receivedAt: image.receivedAt,
        validatedAt: image.validatedAt,
        normalizedAt: at,
      };
      events.push({ type: "ImageNormalized", imageId: image.imageId, at });
      return next;
    });

    events.push({ type: "PipelineReady", imageCount: normalizedImages.length, at });

    return this.commit(
      {
        status: "READY",
        images: normalizedImages,
        failureClass: null,
        lastRejectedImageId: null,
        updatedAt: at,
      },
      events,
    );
  }

  /** Full path for current images: validate → normalize → READY */
  runPipeline(): PipelineResult {
    const validated = this.validatePipeline();
    if (!validated.ok) return validated;
    if (validated.state.status !== "VALIDATING") {
      return validated;
    }
    return this.normalizePipeline();
  }

  /** Mark pipeline FAILED (fail closed) from RECEIVED / VALIDATING. */
  failPipeline(failureClass: PipelineFailureClass = "UNRECOVERABLE"): PipelineResult {
    if (!canTransition(this.state.status, "FAILED")) {
      return fail("INVALID_TRANSITION", "INVALID_TRANSITION");
    }
    const at = now();
    return this.commit(
      {
        status: "FAILED",
        images: this.state.images,
        failureClass,
        lastRejectedImageId: this.state.lastRejectedImageId,
        updatedAt: at,
      },
      [{ type: "PipelineFailed", failureClass, at }],
    );
  }

  /** Reset to EMPTY — clears all in-memory images. */
  resetPipeline(): PipelineResult {
    if (this.state.status === "EMPTY") {
      return succeed(this.getSnapshot(), []);
    }
    if (!canTransition(this.state.status, "EMPTY")) {
      return fail("INVALID_TRANSITION", "INVALID_TRANSITION");
    }
    const at = now();
    return this.commit(createEmptyState(at), []);
  }

  private validateImageRecord(
    image: PipelineImage,
  ): { failureClass: PipelineFailureClass } | null {
    if (!isAllowedFormat(image.metadata.format)) {
      return { failureClass: "INVALID_FORMAT" };
    }
    if (!dimensionsValid(image.metadata.width, image.metadata.height)) {
      return { failureClass: "INVALID_DIMENSIONS" };
    }
    if (!isAllowedOrientation(image.metadata.orientation)) {
      return { failureClass: "INVALID_ORIENTATION" };
    }
    if (image.metadata.format === "jpeg" && image.metadata.jpegSoiValid === false) {
      return { failureClass: "CORRUPTED_IMAGE" };
    }
    return null;
  }

  private commit(
    state: PipelineState,
    events: readonly PipelineEvent[],
  ): PipelineResult {
    this.state = {
      ...state,
      images: state.images.map(cloneImage),
    };
    for (const event of events) {
      for (const listener of this.listeners) {
        listener(event);
      }
    }
    return succeed(cloneState(this.state), events);
  }
}

export function createSmartMobileImagePipelineEngine(): SmartMobileImagePipelineEngine {
  return new SmartMobileImagePipelineEngine();
}

export function isPipelineTransitionAllowed(
  from: PipelineStatus,
  to: PipelineStatus,
): boolean {
  return canTransition(from, to);
}
