/**
 * ROVEXO Smart Mobile Image Pipeline — Normalization Engine v1.0
 *
 * PHASE III · COD SÂNGE · ONE Normalization Engine · Logic only
 *
 * Owns ONLY metadata normalization.
 * NEVER: validation · upload · storage · camera · network · rendering · UI ·
 * pixel decode · pixel manipulation · compression · image byte transforms.
 */

import type { PipelineImageFormat, PipelineOrientation } from "@/lib/media/smart-mobile-image-pipeline/pipeline-types-v1";
import type {
  NormalizeImageInput,
  NormalizedImage,
  NormalizedMetadata,
  NormalizationEngineErrorCode,
  NormalizationEngineEvent,
  NormalizationEngineStatus,
  NormalizationFailureReason,
  NormalizationResult,
  NormalizationState,
} from "@/lib/media/smart-mobile-image-pipeline/normalization-types-v1";

export const SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1 = {
  version: "1.0",
  id: "smart-mobile-image-normalization-engine-v1",
  phase: "III_NORMALIZATION_ENGINE",
  status: "CERTIFIED",
  ownsNormalizationOnly: true,
  validationForbidden: true,
  uploadForbidden: true,
  storageForbidden: true,
  cameraForbidden: true,
  networkForbidden: true,
  pixelDecodeForbidden: true,
  pixelManipulationForbidden: true,
  compressionForbidden: true,
  imageByteModificationForbidden: true,
  uiForbidden: true,
} as const;

type NormalizationListener = (event: NormalizationEngineEvent) => void;

const ERROR_MESSAGE: Record<NormalizationEngineErrorCode, string> = {
  INVALID_TRANSITION: "Invalid normalization engine state transition.",
  INVALID_INPUT: "Normalization input is invalid.",
  NO_IMAGE: "No image loaded for normalization.",
  NORMALIZATION_FAILED: "Normalization failed.",
};

const ALLOWED_TRANSITIONS: Readonly<
  Record<NormalizationEngineStatus, readonly NormalizationEngineStatus[]>
> = {
  NOT_NORMALIZED: ["NORMALIZING", "FAILED", "NOT_NORMALIZED"],
  NORMALIZING: ["NORMALIZED", "FAILED"],
  NORMALIZED: ["NOT_NORMALIZED", "FAILED"],
  FAILED: ["NOT_NORMALIZED"],
};

const CANONICAL_MIME: Readonly<Record<PipelineImageFormat, string>> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const CANONICAL_EXTENSION: Readonly<Record<PipelineImageFormat, string>> = {
  jpeg: ".jpg",
  png: ".png",
  webp: ".webp",
};

function fail(
  code: NormalizationEngineErrorCode,
  reason?: NormalizationFailureReason,
): NormalizationResult {
  return { ok: false, code, message: ERROR_MESSAGE[code], reason };
}

function succeed(
  state: NormalizationState,
  events: readonly NormalizationEngineEvent[],
  image: NormalizedImage | null,
): NormalizationResult {
  return { ok: true, state, events, image };
}

function canTransition(
  from: NormalizationEngineStatus,
  to: NormalizationEngineStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

function createInitialState(at = 0): NormalizationState {
  return {
    status: "NOT_NORMALIZED",
    image: null,
    failureReason: null,
    updatedAt: at,
  };
}

function cloneMetadata(metadata: NormalizedMetadata): NormalizedMetadata {
  return { ...metadata };
}

function cloneImage(image: NormalizedImage): NormalizedImage {
  return {
    ...image,
    metadata: cloneMetadata(image.metadata),
  };
}

function cloneState(state: NormalizationState): NormalizationState {
  return {
    ...state,
    image: state.image ? cloneImage(state.image) : null,
  };
}

function orientationRequiresSwap(orientation: PipelineOrientation): boolean {
  return (
    orientation === 5 ||
    orientation === 6 ||
    orientation === 7 ||
    orientation === 8 ||
    orientation === 90 ||
    orientation === 270
  );
}

function basename(filename: string): string {
  const trimmed = filename.trim();
  const parts = trimmed.split(/[/\\]/);
  return parts[parts.length - 1] ?? trimmed;
}

function stripExtension(name: string): string {
  const base = basename(name);
  const index = base.lastIndexOf(".");
  if (index <= 0) return base;
  return base.slice(0, index);
}

function sanitizeStem(stem: string): string {
  return stem
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9._-]/g, "_");
}

/** Deterministic UTC ISO-8601 from epoch ms (no Date.now). */
export function formatCanonicalTimestamp(epochMs: number): string {
  const date = new Date(epochMs);
  return date.toISOString();
}

/**
 * Pure deterministic metadata normalization.
 * Identical input → identical output. Never mutates image bytes.
 */
export function normalizeImageInput(input: NormalizeImageInput): {
  ok: true;
  image: NormalizedImage;
} | {
  ok: false;
  reason: NormalizationFailureReason;
} {
  try {
    const originalImageId = input.imageId ?? "";
    const imageId = originalImageId.trim();
    const fingerprint = (input.contentFingerprint ?? "").trim();
    const originalFilename = input.filename ?? "";
    const originalMimeType = input.mimeType ?? "";
    const originalExtension = input.extension ?? "";
    const format = input.format;
    const at = input.at ?? 0;

    if (
      !imageId ||
      !fingerprint ||
      !format ||
      (format !== "jpeg" && format !== "png" && format !== "webp") ||
      !Number.isFinite(input.width) ||
      !Number.isFinite(input.height) ||
      !Number.isFinite(input.byteLength) ||
      !Number.isInteger(input.width) ||
      !Number.isInteger(input.height) ||
      !Number.isInteger(input.byteLength) ||
      input.width <= 0 ||
      input.height <= 0 ||
      input.byteLength <= 0 ||
      !Number.isFinite(input.timestamp) ||
      !Number.isInteger(input.timestamp)
    ) {
      return { ok: false, reason: "INVALID_INPUT" };
    }

    const swap = orientationRequiresSwap(input.orientation);
    const width = swap ? input.height : input.width;
    const height = swap ? input.width : input.height;
    const mimeType = CANONICAL_MIME[format];
    const extension = CANONICAL_EXTENSION[format];
    const stem = sanitizeStem(stripExtension(originalFilename) || imageId);
    const filename = `${stem}${extension}`;

    const metadata: NormalizedMetadata = {
      format,
      mimeType,
      extension,
      width,
      height,
      orientation: 1,
      byteLength: input.byteLength,
      contentFingerprint: fingerprint,
      filename,
      imageId,
      timestamp: formatCanonicalTimestamp(input.timestamp),
      originalMimeType,
      originalExtension,
      originalWidth: input.width,
      originalHeight: input.height,
      originalOrientation: input.orientation,
      originalFilename,
      originalImageId,
      originalTimestamp: input.timestamp,
    };

    return {
      ok: true,
      image: {
        imageId,
        metadata,
        normalizedAt: at,
      },
    };
  } catch {
    return { ok: false, reason: "UNKNOWN_NORMALIZATION_ERROR" };
  }
}

/**
 * Canonical Normalization Engine — single owner of metadata normalization.
 */
export class SmartMobileImageNormalizationEngine {
  private state: NormalizationState = createInitialState();
  private pending: NormalizeImageInput | null = null;
  private readonly listeners = new Set<NormalizationListener>();

  getSnapshot(): NormalizationState {
    return cloneState(this.state);
  }

  subscribe(listener: NormalizationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Load input into NOT_NORMALIZED. Does not validate beyond structural load.
   * Does not modify bytes (none are accepted).
   */
  load(input: NormalizeImageInput): NormalizationResult {
    if (
      this.state.status !== "NOT_NORMALIZED" &&
      this.state.status !== "NORMALIZED" &&
      this.state.status !== "FAILED"
    ) {
      return this.failClosed("INVALID_TRANSITION", "INVALID_TRANSITION", input.at ?? 0);
    }
    if (
      this.state.status === "NORMALIZED" ||
      this.state.status === "FAILED"
    ) {
      if (!canTransition(this.state.status, "NOT_NORMALIZED")) {
        return this.failClosed("INVALID_TRANSITION", "INVALID_TRANSITION", input.at ?? 0);
      }
    }

    const at = input.at ?? 0;
    this.pending = { ...input };
    return this.commit(
      {
        status: "NOT_NORMALIZED",
        image: null,
        failureReason: null,
        updatedAt: at,
      },
      [],
      null,
    );
  }

  /**
   * NOT_NORMALIZED → NORMALIZING → NORMALIZED
   * Illegal → FAILED (fail closed).
   */
  normalize(at = 0): NormalizationResult {
    if (!this.pending) {
      return fail("NO_IMAGE");
    }
    if (!canTransition(this.state.status, "NORMALIZING")) {
      return this.failClosed("INVALID_TRANSITION", "INVALID_TRANSITION", at);
    }

    const imageId = this.pending.imageId.trim() || null;
    this.emit({ type: "NormalizationStarted", imageId: imageId ?? "", at });
    this.state = {
      ...this.state,
      status: "NORMALIZING",
      updatedAt: at,
    };

    const normalized = normalizeImageInput({ ...this.pending, at });
    if (!normalized.ok) {
      this.emit({
        type: "NormalizationFailed",
        imageId,
        reason: normalized.reason,
        at,
      });
      if (!canTransition("NORMALIZING", "FAILED")) {
        return this.failClosed("INVALID_TRANSITION", normalized.reason, at);
      }
      return this.commit(
        {
          status: "FAILED",
          image: null,
          failureReason: normalized.reason,
          updatedAt: at,
        },
        [],
        null,
      );
    }

    if (!canTransition("NORMALIZING", "NORMALIZED")) {
      return this.failClosed("INVALID_TRANSITION", "UNKNOWN_NORMALIZATION_ERROR", at);
    }

    return this.commit(
      {
        status: "NORMALIZED",
        image: normalized.image,
        failureReason: null,
        updatedAt: at,
      },
      [{ type: "NormalizationCompleted", imageId: normalized.image.imageId, at }],
      normalized.image,
    );
  }

  reset(at = 0): NormalizationResult {
    this.pending = null;
    if (this.state.status === "NOT_NORMALIZED" && !this.state.image) {
      return succeed(this.getSnapshot(), [], null);
    }
    if (
      this.state.status !== "NORMALIZED" &&
      this.state.status !== "FAILED" &&
      this.state.status !== "NOT_NORMALIZED"
    ) {
      return this.failClosed("INVALID_TRANSITION", "INVALID_TRANSITION", at);
    }
    if (this.state.status !== "NOT_NORMALIZED" && !canTransition(this.state.status, "NOT_NORMALIZED")) {
      return this.failClosed("INVALID_TRANSITION", "INVALID_TRANSITION", at);
    }
    return this.commit(createInitialState(at), [], null);
  }

  private failClosed(
    code: NormalizationEngineErrorCode,
    reason: NormalizationFailureReason,
    at: number,
  ): NormalizationResult {
    this.state = {
      status: "FAILED",
      image: this.state.image ? cloneImage(this.state.image) : null,
      failureReason: reason,
      updatedAt: at,
    };
    this.emit({
      type: "NormalizationFailed",
      imageId: this.pending?.imageId.trim() || null,
      reason,
      at,
    });
    return fail(code, reason);
  }

  private commit(
    state: NormalizationState,
    events: readonly NormalizationEngineEvent[],
    image: NormalizedImage | null,
  ): NormalizationResult {
    const ownedImage = state.image ? cloneImage(state.image) : null;
    this.state = {
      ...state,
      image: ownedImage,
    };
    for (const event of events) {
      this.emit(event);
    }
    const snapshot = cloneState(this.state);
    return succeed(
      snapshot,
      events,
      image ? cloneImage(image) : null,
    );
  }

  private emit(event: NormalizationEngineEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export function createSmartMobileImageNormalizationEngine(): SmartMobileImageNormalizationEngine {
  return new SmartMobileImageNormalizationEngine();
}

export function isNormalizationTransitionAllowed(
  from: NormalizationEngineStatus,
  to: NormalizationEngineStatus,
): boolean {
  return canTransition(from, to);
}
