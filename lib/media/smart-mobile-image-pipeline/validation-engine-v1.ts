/**
 * ROVEXO Smart Mobile Image Pipeline — Validation Engine v1.0
 *
 * PHASE II · COD SÂNGE · ONE Validation Engine · Logic only
 *
 * Owns ONLY validation. Never normalizes · transforms · uploads · stores ·
 * renders · opens camera · decodes pixels · compresses.
 */

import {
  isUtf8CorruptedJpeg,
  isValidJpegSoi,
} from "@/lib/media/smart-mobile-image-pipeline/jpeg-guards-v1";
import type { PipelineImageFormat, PipelineOrientation } from "@/lib/media/smart-mobile-image-pipeline/pipeline-types-v1";
import type {
  ImageValidationResult,
  ReceiveValidationImageInput,
  ValidationContext,
  ValidationEngineErrorCode,
  ValidationEngineEvent,
  ValidationEngineResult,
  ValidationEngineState,
  ValidationEngineStatus,
  ValidationImageRecord,
  ValidationReason,
} from "@/lib/media/smart-mobile-image-pipeline/validation-types-v1";
import {
  SMART_MOBILE_IMAGE_VALIDATION_MAX_BYTES,
  SMART_MOBILE_IMAGE_VALIDATION_MAX_DIMENSION,
  SMART_MOBILE_IMAGE_VALIDATION_MAX_IMAGES,
  SMART_MOBILE_IMAGE_VALIDATION_MIN_DIMENSION,
} from "@/lib/media/smart-mobile-image-pipeline/validation-types-v1";

export const SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1 = {
  version: "1.0",
  id: "smart-mobile-image-validation-engine-v1",
  phase: "II_VALIDATION_ENGINE",
  status: "CERTIFIED",
  ownsValidationOnly: true,
  normalizationForbidden: true,
  transformationForbidden: true,
  uploadForbidden: true,
  storageForbidden: true,
  uiForbidden: true,
  cameraForbidden: true,
  pixelManipulationForbidden: true,
  compressionForbidden: true,
  networkForbidden: true,
  maxImages: SMART_MOBILE_IMAGE_VALIDATION_MAX_IMAGES,
} as const;

type ValidationListener = (event: ValidationEngineEvent) => void;

const ERROR_MESSAGE: Record<ValidationEngineErrorCode, string> = {
  INVALID_TRANSITION: "Invalid validation engine state transition.",
  NO_IMAGES: "No images available to validate.",
  VALIDATION_FAILED: "Validation failed.",
};

const ALLOWED_TRANSITIONS: Readonly<
  Record<ValidationEngineStatus, readonly ValidationEngineStatus[]>
> = {
  RECEIVED: ["VALIDATING", "FAILED", "RECEIVED"],
  VALIDATING: ["VALID", "INVALID", "FAILED"],
  VALID: ["READY", "FAILED"],
  READY: ["RECEIVED", "FAILED"],
  INVALID: ["REJECTED", "FAILED"],
  REJECTED: ["RECEIVED", "FAILED"],
  FAILED: ["RECEIVED"],
};

const FORMAT_MIME: Readonly<Record<PipelineImageFormat, readonly string[]>> = {
  jpeg: ["image/jpeg", "image/jpg"],
  png: ["image/png"],
  webp: ["image/webp"],
};

const FORMAT_EXTENSIONS: Readonly<Record<PipelineImageFormat, readonly string[]>> = {
  jpeg: [".jpg", ".jpeg"],
  png: [".png"],
  webp: [".webp"],
};

const ALLOWED_ORIENTATIONS: readonly PipelineOrientation[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 0, 90, 180, 270,
];

function fail(
  code: ValidationEngineErrorCode,
  reason?: ValidationReason,
): ValidationEngineResult {
  return { ok: false, code, message: ERROR_MESSAGE[code], reason };
}

function succeed(
  state: ValidationEngineState,
  events: readonly ValidationEngineEvent[],
  result: ImageValidationResult | null,
): ValidationEngineResult {
  return { ok: true, state, events, result };
}

function canTransition(
  from: ValidationEngineStatus,
  to: ValidationEngineStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

function createInitialState(at = 0): ValidationEngineState {
  return {
    status: "RECEIVED",
    images: [],
    lastResult: null,
    lastRejectedImageId: null,
    failureReason: null,
    updatedAt: at,
  };
}

function cloneRecord(record: ValidationImageRecord): ValidationImageRecord {
  return { ...record };
}

function cloneState(state: ValidationEngineState): ValidationEngineState {
  return {
    ...state,
    images: state.images.map(cloneRecord),
    lastResult: state.lastResult ? { ...state.lastResult } : null,
  };
}

function normalizeExtension(extension: string): string {
  const trimmed = extension.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
}

function normalizeMime(mimeType: string): string {
  return mimeType.trim().toLowerCase();
}

function isAllowedOrientation(value: number): value is PipelineOrientation {
  return (ALLOWED_ORIENTATIONS as readonly number[]).includes(value);
}

/**
 * Pure deterministic image validation — no side effects · no timers · no I/O.
 */
export function evaluateImageValidation(
  input: ReceiveValidationImageInput,
  context: ValidationContext,
): ImageValidationResult {
  try {
    if (context.currentCount >= SMART_MOBILE_IMAGE_VALIDATION_MAX_IMAGES) {
      return { status: "INVALID", reason: "MAXIMUM_IMAGES_EXCEEDED" };
    }

    const imageId = input.imageId?.trim() ?? "";
    const fingerprint = input.contentFingerprint?.trim() ?? "";
    const mimeType = normalizeMime(input.mimeType ?? "");
    const extension = normalizeExtension(input.extension ?? "");
    const format = input.format;

    if (
      !imageId ||
      !fingerprint ||
      input.width === undefined ||
      input.height === undefined ||
      input.orientation === undefined ||
      input.byteLength === undefined ||
      !format ||
      !mimeType ||
      !extension
    ) {
      return { status: "INVALID", reason: "MISSING_METADATA" };
    }

    if (
      !Number.isFinite(input.width) ||
      !Number.isFinite(input.height) ||
      !Number.isFinite(input.byteLength) ||
      !Number.isInteger(input.width) ||
      !Number.isInteger(input.height) ||
      !Number.isInteger(input.byteLength)
    ) {
      return { status: "INVALID", reason: "INVALID_INPUT" };
    }

    if (format !== "jpeg" && format !== "png" && format !== "webp") {
      return { status: "INVALID", reason: "UNSUPPORTED_FORMAT" };
    }

    const allowedMimes = FORMAT_MIME[format];
    if (!allowedMimes.includes(mimeType)) {
      return { status: "INVALID", reason: "INVALID_MIME" };
    }

    const allowedExt = FORMAT_EXTENSIONS[format];
    if (!allowedExt.includes(extension)) {
      return { status: "INVALID", reason: "INVALID_EXTENSION" };
    }

    if (
      input.width < SMART_MOBILE_IMAGE_VALIDATION_MIN_DIMENSION ||
      input.height < SMART_MOBILE_IMAGE_VALIDATION_MIN_DIMENSION
    ) {
      return { status: "INVALID", reason: "IMAGE_TOO_SMALL" };
    }

    if (
      input.width > SMART_MOBILE_IMAGE_VALIDATION_MAX_DIMENSION ||
      input.height > SMART_MOBILE_IMAGE_VALIDATION_MAX_DIMENSION
    ) {
      return { status: "INVALID", reason: "IMAGE_TOO_LARGE" };
    }

    if (input.byteLength <= 0) {
      return { status: "INVALID", reason: "INVALID_INPUT" };
    }

    if (input.byteLength > SMART_MOBILE_IMAGE_VALIDATION_MAX_BYTES) {
      return { status: "INVALID", reason: "FILE_TOO_LARGE" };
    }

    if (!isAllowedOrientation(input.orientation)) {
      return { status: "INVALID", reason: "INVALID_ORIENTATION" };
    }

    if (
      context.existingImageIds.includes(imageId) ||
      context.existingFingerprints.includes(fingerprint)
    ) {
      return { status: "INVALID", reason: "DUPLICATE_IMAGE" };
    }

    if (input.bytes) {
      if (format === "jpeg") {
        if (isUtf8CorruptedJpeg(input.bytes) || !isValidJpegSoi(input.bytes)) {
          return { status: "INVALID", reason: "CORRUPTED_IMAGE" };
        }
      }
    }

    return { status: "VALID" };
  } catch {
    return { status: "INVALID", reason: "UNKNOWN_VALIDATION_ERROR" };
  }
}

function inspectJpegBytes(
  format: PipelineImageFormat,
  bytes: Uint8Array | undefined,
): boolean | null {
  if (!bytes || format !== "jpeg") return null;
  if (isUtf8CorruptedJpeg(bytes) || !isValidJpegSoi(bytes)) return false;
  return true;
}

/**
 * Canonical Validation Engine — single owner of Smart Mobile Image validation.
 */
export class SmartMobileImageValidationEngine {
  private state: ValidationEngineState = createInitialState();
  private readonly listeners = new Set<ValidationListener>();
  /** Bytes kept privately for JPEG guards during validate — never exposed on snapshots. */
  private readonly bytesById = new Map<string, Uint8Array>();

  getSnapshot(): ValidationEngineState {
    return cloneState(this.state);
  }

  subscribe(listener: ValidationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Accept an image into RECEIVED for later validation.
   * Intake only: capacity + identity. Full validation runs in validate().
   */
  receiveImage(input: ReceiveValidationImageInput): ValidationEngineResult {
    if (
      this.state.status !== "RECEIVED" &&
      this.state.status !== "READY" &&
      this.state.status !== "REJECTED" &&
      this.state.status !== "FAILED"
    ) {
      return this.failClosed("INVALID_TRANSITION", "UNKNOWN_VALIDATION_ERROR");
    }

    if (
      this.state.status === "READY" ||
      this.state.status === "REJECTED" ||
      this.state.status === "FAILED"
    ) {
      if (!canTransition(this.state.status, "RECEIVED")) {
        return this.failClosed("INVALID_TRANSITION", "UNKNOWN_VALIDATION_ERROR");
      }
    }

    const at = input.at ?? 0;
    const imageId = input.imageId?.trim() ?? "";
    if (!imageId) {
      return fail("VALIDATION_FAILED", "MISSING_METADATA");
    }

    const restarting =
      this.state.status === "READY" ||
      this.state.status === "REJECTED" ||
      this.state.status === "FAILED";
    const currentCount = restarting ? 0 : this.state.images.length;

    if (currentCount >= SMART_MOBILE_IMAGE_VALIDATION_MAX_IMAGES) {
      return fail("VALIDATION_FAILED", "MAXIMUM_IMAGES_EXCEEDED");
    }

    if (
      !restarting &&
      this.state.images.some(
        (image) =>
          image.imageId === imageId ||
          image.contentFingerprint === (input.contentFingerprint?.trim() ?? ""),
      )
    ) {
      return fail("VALIDATION_FAILED", "DUPLICATE_IMAGE");
    }

    const jpegSoiValid = inspectJpegBytes(input.format, input.bytes);
    const record: ValidationImageRecord = {
      imageId,
      format: input.format,
      mimeType: normalizeMime(input.mimeType ?? ""),
      extension: normalizeExtension(input.extension ?? ""),
      width: input.width,
      height: input.height,
      orientation: input.orientation,
      byteLength: input.byteLength,
      contentFingerprint: (input.contentFingerprint ?? "").trim(),
      localUri: input.localUri?.trim() || null,
      hasBytes: Boolean(input.bytes),
      jpegSoiValid,
    };

    if (restarting) {
      this.bytesById.clear();
    }
    if (input.bytes) {
      this.bytesById.set(record.imageId, input.bytes);
    }

    const nextImages = restarting ? [record] : [...this.state.images, record];

    return this.commit(
      {
        status: "RECEIVED",
        images: nextImages,
        lastResult: null,
        lastRejectedImageId: null,
        failureReason: null,
        updatedAt: at,
      },
      [],
      null,
    );
  }

  /**
   * RECEIVED → VALIDATING → VALID → READY
   * or VALIDATING → INVALID → REJECTED
   * Illegal → FAILED (fail closed).
   */
  validate(at = 0): ValidationEngineResult {
    if (this.state.images.length === 0) {
      return fail("NO_IMAGES");
    }
    if (!canTransition(this.state.status, "VALIDATING")) {
      return this.failClosed("INVALID_TRANSITION", "UNKNOWN_VALIDATION_ERROR", at);
    }

    const started: ValidationEngineEvent[] = [
      { type: "ValidationStarted", imageCount: this.state.images.length, at },
    ];

    // Enter VALIDATING
    this.state = {
      ...this.state,
      status: "VALIDATING",
      updatedAt: at,
    };
    for (const event of started) {
      this.emit(event);
    }

    const acceptedIds: string[] = [];
    const acceptedFingerprints: string[] = [];

    for (const image of this.state.images) {
      const bytes = this.bytesById.get(image.imageId);
      const input: ReceiveValidationImageInput = {
        imageId: image.imageId,
        format: image.format,
        mimeType: image.mimeType,
        extension: image.extension,
        width: image.width,
        height: image.height,
        orientation: image.orientation,
        byteLength: image.byteLength,
        contentFingerprint: image.contentFingerprint,
        localUri: image.localUri ?? undefined,
        bytes,
        at,
      };
      const context: ValidationContext = {
        existingImageIds: acceptedIds,
        existingFingerprints: acceptedFingerprints,
        currentCount: acceptedIds.length,
      };
      const result = evaluateImageValidation(input, context);

      if (result.status === "INVALID") {
        if (!canTransition("VALIDATING", "INVALID")) {
          return this.failClosed("INVALID_TRANSITION", result.reason, at);
        }
        this.state = {
          ...this.state,
          status: "INVALID",
          lastResult: result,
          lastRejectedImageId: image.imageId,
          failureReason: result.reason,
          updatedAt: at,
        };
        const failEvents: ValidationEngineEvent[] = [
          {
            type: "ValidationFailed",
            imageId: image.imageId,
            reason: result.reason,
            at,
          },
          {
            type: "ImageRejected",
            imageId: image.imageId,
            reason: result.reason,
            at,
          },
        ];
        for (const event of failEvents) {
          this.emit(event);
        }
        if (!canTransition("INVALID", "REJECTED")) {
          return this.failClosed("INVALID_TRANSITION", result.reason, at);
        }
        return this.commit(
          {
            status: "REJECTED",
            images: this.state.images,
            lastResult: result,
            lastRejectedImageId: image.imageId,
            failureReason: result.reason,
            updatedAt: at,
          },
          [],
          result,
        );
      }

      acceptedIds.push(image.imageId);
      acceptedFingerprints.push(image.contentFingerprint);
    }

    if (!canTransition("VALIDATING", "VALID") || !canTransition("VALID", "READY")) {
      return this.failClosed("INVALID_TRANSITION", "UNKNOWN_VALIDATION_ERROR", at);
    }

    this.state = {
      ...this.state,
      status: "VALID",
      lastResult: { status: "VALID" },
      lastRejectedImageId: null,
      failureReason: null,
      updatedAt: at,
    };

    const passEvents: ValidationEngineEvent[] = this.state.images.map((image) => ({
      type: "ValidationPassed" as const,
      imageId: image.imageId,
      at,
    }));
    passEvents.push({ type: "PipelineReady", imageCount: this.state.images.length, at });

    return this.commit(
      {
        status: "READY",
        images: this.state.images,
        lastResult: { status: "VALID" },
        lastRejectedImageId: null,
        failureReason: null,
        updatedAt: at,
      },
      passEvents,
      { status: "VALID" },
    );
  }

  /** Clear to empty RECEIVED — deterministic reset. */
  reset(at = 0): ValidationEngineResult {
    this.bytesById.clear();
    return this.commit(createInitialState(at), [], null);
  }

  private failClosed(
    code: ValidationEngineErrorCode,
    reason: ValidationReason,
    at = 0,
  ): ValidationEngineResult {
    const events: ValidationEngineEvent[] = [
      { type: "PipelineFailed", reason, at },
    ];
    this.state = {
      status: "FAILED",
      images: this.state.images.map(cloneRecord),
      lastResult: { status: "INVALID", reason },
      lastRejectedImageId: this.state.lastRejectedImageId,
      failureReason: reason,
      updatedAt: at,
    };
    for (const event of events) {
      this.emit(event);
    }
    return fail(code, reason);
  }

  private commit(
    state: ValidationEngineState,
    events: readonly ValidationEngineEvent[],
    result: ImageValidationResult | null,
  ): ValidationEngineResult {
    const ownedResult = result ? { ...result } : null;
    this.state = {
      ...state,
      images: state.images.map(cloneRecord),
      lastResult: ownedResult,
    };
    for (const event of events) {
      this.emit(event);
    }
    const snapshot = cloneState(this.state);
    return succeed(
      snapshot,
      events,
      ownedResult ? { ...ownedResult } : null,
    );
  }

  private emit(event: ValidationEngineEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export function createSmartMobileImageValidationEngine(): SmartMobileImageValidationEngine {
  return new SmartMobileImageValidationEngine();
}

export function isValidationTransitionAllowed(
  from: ValidationEngineStatus,
  to: ValidationEngineStatus,
): boolean {
  return canTransition(from, to);
}
