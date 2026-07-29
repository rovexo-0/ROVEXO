/**
 * ROVEXO Smart Mobile Image Pipeline — Metadata Engine v1.0
 *
 * PHASE IV · COD SÂNGE · ONE Metadata Engine · Logic only
 *
 * ONLY owner of image metadata.
 * NEVER: validation · normalization · upload · storage · rendering · UI ·
 * camera · pixel processing · compression · image transformation.
 */

import type { PipelineImageFormat, PipelineOrientation } from "@/lib/media/smart-mobile-image-pipeline/pipeline-types-v1";
import type {
  CreateMetadataInput,
  ImageMetadata,
  MergeMetadataPatch,
  MetadataEngineErrorCode,
  MetadataEngineEvent,
  MetadataEngineStatus,
  MetadataFailureReason,
  MetadataRecord,
  MetadataResult,
  MetadataSnapshot,
  MetadataState,
  MetadataVersion,
  PipelineMetadataShape,
  ProcessingFlags,
} from "@/lib/media/smart-mobile-image-pipeline/metadata-types-v1";

export const SMART_MOBILE_IMAGE_METADATA_ENGINE_V1 = {
  version: "1.0",
  id: "smart-mobile-image-metadata-engine-v1",
  phase: "IV_METADATA_ENGINE",
  status: "CERTIFIED",
  ownsMetadataOnly: true,
  validationForbidden: true,
  normalizationForbidden: true,
  uploadForbidden: true,
  storageForbidden: true,
  cameraForbidden: true,
  networkForbidden: true,
  pixelDecodeForbidden: true,
  pixelManipulationForbidden: true,
  compressionForbidden: true,
  imageTransformationForbidden: true,
  uiForbidden: true,
} as const;

type MetadataListener = (event: MetadataEngineEvent) => void;

const ERROR_MESSAGE: Record<MetadataEngineErrorCode, string> = {
  INVALID_TRANSITION: "Invalid metadata engine state transition.",
  INVALID_INPUT: "Metadata input is invalid.",
  NO_METADATA: "No metadata record is loaded.",
  FROZEN: "Frozen metadata cannot be modified.",
  METADATA_FAILED: "Metadata operation failed.",
};

const ALLOWED_TRANSITIONS: Readonly<
  Record<MetadataEngineStatus, readonly MetadataEngineStatus[]>
> = {
  EMPTY: ["CREATED", "FAILED"],
  CREATED: ["ACTIVE", "FROZEN", "FAILED", "EMPTY"],
  ACTIVE: ["ACTIVE", "FROZEN", "FAILED", "EMPTY"],
  FROZEN: ["EMPTY", "FAILED"],
  FAILED: ["EMPTY"],
};

function fail(
  code: MetadataEngineErrorCode,
  reason?: MetadataFailureReason,
): MetadataResult {
  return { ok: false, code, message: ERROR_MESSAGE[code], reason };
}

function succeed(
  state: MetadataState,
  events: readonly MetadataEngineEvent[],
  record: MetadataRecord | null,
  snapshot: MetadataSnapshot | null,
  compareEqual: boolean | null,
): MetadataResult {
  return { ok: true, state, events, record, snapshot, compareEqual };
}

function canTransition(from: MetadataEngineStatus, to: MetadataEngineStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

function createInitialState(at = 0): MetadataState {
  return {
    status: "EMPTY",
    record: null,
    lastSnapshot: null,
    lastCompareEqual: null,
    failureReason: null,
    updatedAt: at,
  };
}

function buildProcessingFlags(meta: {
  width: number;
  height: number;
  orientation: PipelineOrientation;
  fingerprint: string;
  mimeType: string;
  extension: string;
  fileName: string;
}): ProcessingFlags {
  return {
    dimensionsPresent: meta.width > 0 && meta.height > 0,
    orientationPresent: meta.orientation !== undefined,
    fingerprintPresent: meta.fingerprint.trim().length > 0,
    mimePresent: meta.mimeType.trim().length > 0,
    extensionPresent: meta.extension.trim().length > 0,
    fileNamePresent: meta.fileName.trim().length > 0,
  };
}

function buildPipelineMetadata(input: {
  format: PipelineImageFormat;
  width: number;
  height: number;
  orientation: PipelineOrientation;
  fileSize: number;
  fingerprint: string;
}): PipelineMetadataShape {
  return {
    format: input.format,
    width: input.width,
    height: input.height,
    orientation: input.orientation,
    byteLength: input.fileSize,
    contentFingerprint: input.fingerprint,
  };
}

function cloneProcessingFlags(flags: ProcessingFlags): ProcessingFlags {
  return { ...flags };
}

function clonePipelineMetadata(shape: PipelineMetadataShape): PipelineMetadataShape {
  return { ...shape };
}

function cloneImageMetadata(metadata: ImageMetadata): ImageMetadata {
  return {
    ...metadata,
    processingFlags: cloneProcessingFlags(metadata.processingFlags),
    pipelineMetadata: clonePipelineMetadata(metadata.pipelineMetadata),
  };
}

function cloneRecord(record: MetadataRecord): MetadataRecord {
  return {
    ...record,
    metadata: cloneImageMetadata(record.metadata),
  };
}

function cloneSnapshot(snapshot: MetadataSnapshot): MetadataSnapshot {
  return {
    ...snapshot,
    record: cloneRecord(snapshot.record),
  };
}

function cloneState(state: MetadataState): MetadataState {
  return {
    ...state,
    record: state.record ? cloneRecord(state.record) : null,
    lastSnapshot: state.lastSnapshot ? cloneSnapshot(state.lastSnapshot) : null,
  };
}

function isFiniteInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value);
}

function isValidFormat(format: PipelineImageFormat): boolean {
  return format === "jpeg" || format === "png" || format === "webp";
}

function validateCreateInput(input: CreateMetadataInput): boolean {
  return (
    typeof input.identifier === "string" &&
    input.identifier.trim().length > 0 &&
    typeof input.fingerprint === "string" &&
    input.fingerprint.trim().length > 0 &&
    isFiniteInteger(input.width) &&
    isFiniteInteger(input.height) &&
    isFiniteInteger(input.fileSize) &&
    isFiniteInteger(input.timestamp) &&
    input.width > 0 &&
    input.height > 0 &&
    input.fileSize > 0 &&
    isValidFormat(input.format) &&
    typeof input.mimeType === "string" &&
    typeof input.extension === "string" &&
    typeof input.fileName === "string"
  );
}

function validatePatch(patch: MergeMetadataPatch): boolean {
  if (patch.fingerprint !== undefined && patch.fingerprint.trim().length === 0) return false;
  if (patch.width !== undefined && (!isFiniteInteger(patch.width) || patch.width <= 0)) return false;
  if (patch.height !== undefined && (!isFiniteInteger(patch.height) || patch.height <= 0)) return false;
  if (patch.fileSize !== undefined && (!isFiniteInteger(patch.fileSize) || patch.fileSize <= 0)) {
    return false;
  }
  if (patch.timestamp !== undefined && !isFiniteInteger(patch.timestamp)) return false;
  if (patch.format !== undefined && !isValidFormat(patch.format)) return false;
  if (patch.mimeType !== undefined && typeof patch.mimeType !== "string") return false;
  if (patch.extension !== undefined && typeof patch.extension !== "string") return false;
  if (patch.fileName !== undefined && typeof patch.fileName !== "string") return false;
  return true;
}

/**
 * Pure create — deterministic, immutable.
 */
export function createMetadataRecord(
  input: CreateMetadataInput,
  version: MetadataVersion = 1,
): MetadataRecord | null {
  if (!validateCreateInput(input)) return null;
  const identifier = input.identifier.trim();
  const fingerprint = input.fingerprint.trim();
  const at = input.at ?? 0;
  const image: ImageMetadata = {
    identifier,
    fingerprint,
    width: input.width,
    height: input.height,
    orientation: input.orientation,
    mimeType: input.mimeType,
    extension: input.extension,
    fileName: input.fileName,
    fileSize: input.fileSize,
    timestamp: input.timestamp,
    processingFlags: buildProcessingFlags({
      width: input.width,
      height: input.height,
      orientation: input.orientation,
      fingerprint,
      mimeType: input.mimeType,
      extension: input.extension,
      fileName: input.fileName,
    }),
    pipelineMetadata: buildPipelineMetadata({
      format: input.format,
      width: input.width,
      height: input.height,
      orientation: input.orientation,
      fileSize: input.fileSize,
      fingerprint,
    }),
  };
  return {
    version,
    metadata: image,
    createdAt: at,
    updatedAt: at,
    frozenAt: null,
  };
}

/**
 * Deep clone — no shared references with source.
 */
export function cloneMetadataRecord(record: MetadataRecord): MetadataRecord {
  return cloneRecord(record);
}

/**
 * Merge patch into record; increments version. Pure — does not mutate input.
 */
export function mergeMetadataRecord(
  record: MetadataRecord,
  patch: MergeMetadataPatch,
  at = 0,
): MetadataRecord | null {
  if (!validatePatch(patch)) return null;
  const nextFormat = patch.format ?? record.metadata.pipelineMetadata.format;
  const nextFingerprint = (patch.fingerprint ?? record.metadata.fingerprint).trim();
  const width = patch.width ?? record.metadata.width;
  const height = patch.height ?? record.metadata.height;
  const orientation = patch.orientation ?? record.metadata.orientation;
  const mimeType = patch.mimeType ?? record.metadata.mimeType;
  const extension = patch.extension ?? record.metadata.extension;
  const fileName = patch.fileName ?? record.metadata.fileName;
  const fileSize = patch.fileSize ?? record.metadata.fileSize;
  const timestamp = patch.timestamp ?? record.metadata.timestamp;

  const metadata: ImageMetadata = {
    identifier: record.metadata.identifier,
    fingerprint: nextFingerprint,
    width,
    height,
    orientation,
    mimeType,
    extension,
    fileName,
    fileSize,
    timestamp,
    processingFlags: buildProcessingFlags({
      width,
      height,
      orientation,
      fingerprint: nextFingerprint,
      mimeType,
      extension,
      fileName,
    }),
    pipelineMetadata: buildPipelineMetadata({
      format: nextFormat,
      width,
      height,
      orientation,
      fileSize,
      fingerprint: nextFingerprint,
    }),
  };

  return {
    version: record.version + 1,
    metadata,
    createdAt: record.createdAt,
    updatedAt: at,
    frozenAt: null,
  };
}

/**
 * Structural equality of owned metadata fields (ignores createdAt/updatedAt/frozenAt).
 */
export function compareMetadataRecords(
  left: MetadataRecord,
  right: MetadataRecord,
): boolean {
  const a = left.metadata;
  const b = right.metadata;
  return (
    left.version === right.version &&
    a.identifier === b.identifier &&
    a.fingerprint === b.fingerprint &&
    a.width === b.width &&
    a.height === b.height &&
    a.orientation === b.orientation &&
    a.mimeType === b.mimeType &&
    a.extension === b.extension &&
    a.fileName === b.fileName &&
    a.fileSize === b.fileSize &&
    a.timestamp === b.timestamp &&
    a.processingFlags.dimensionsPresent === b.processingFlags.dimensionsPresent &&
    a.processingFlags.orientationPresent === b.processingFlags.orientationPresent &&
    a.processingFlags.fingerprintPresent === b.processingFlags.fingerprintPresent &&
    a.processingFlags.mimePresent === b.processingFlags.mimePresent &&
    a.processingFlags.extensionPresent === b.processingFlags.extensionPresent &&
    a.processingFlags.fileNamePresent === b.processingFlags.fileNamePresent &&
    a.pipelineMetadata.format === b.pipelineMetadata.format &&
    a.pipelineMetadata.width === b.pipelineMetadata.width &&
    a.pipelineMetadata.height === b.pipelineMetadata.height &&
    a.pipelineMetadata.orientation === b.pipelineMetadata.orientation &&
    a.pipelineMetadata.byteLength === b.pipelineMetadata.byteLength &&
    a.pipelineMetadata.contentFingerprint === b.pipelineMetadata.contentFingerprint
  );
}

export function freezeMetadataRecord(record: MetadataRecord, at = 0): MetadataRecord {
  return {
    ...cloneRecord(record),
    frozenAt: at,
    updatedAt: at,
  };
}

export function createMetadataSnapshot(record: MetadataRecord, at = 0): MetadataSnapshot {
  return {
    version: record.version,
    capturedAt: at,
    record: cloneRecord(record),
  };
}

/**
 * Canonical Metadata Engine — single owner of image metadata.
 */
export class SmartMobileImageMetadataEngine {
  private state: MetadataState = createInitialState();
  private readonly listeners = new Set<MetadataListener>();

  getSnapshot(): MetadataState {
    return cloneState(this.state);
  }

  subscribe(listener: MetadataListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** EMPTY → CREATED */
  create(input: CreateMetadataInput): MetadataResult {
    if (!canTransition(this.state.status, "CREATED")) {
      return this.failClosed("INVALID_TRANSITION", "INVALID_TRANSITION", input.at ?? 0);
    }
    const at = input.at ?? 0;
    const record = createMetadataRecord(input, 1);
    if (!record) {
      return this.failClosed("INVALID_INPUT", "INVALID_INPUT", at, input.identifier?.trim() || null);
    }
    return this.commit(
      {
        status: "CREATED",
        record,
        lastSnapshot: null,
        lastCompareEqual: null,
        failureReason: null,
        updatedAt: at,
      },
      [
        {
          type: "MetadataCreated",
          identifier: record.metadata.identifier,
          version: record.version,
          at,
        },
      ],
      record,
      null,
      null,
    );
  }

  /** CREATED | ACTIVE → ACTIVE (version++) */
  merge(patch: MergeMetadataPatch, at = 0): MetadataResult {
    if (this.state.status === "FROZEN") {
      return this.failClosed("FROZEN", "FROZEN", at);
    }
    if (this.state.status !== "CREATED" && this.state.status !== "ACTIVE") {
      return this.failClosed("INVALID_TRANSITION", "INVALID_TRANSITION", at);
    }
    if (!this.state.record) {
      return this.failClosed("NO_METADATA", "NO_METADATA", at);
    }
    if (!canTransition(this.state.status, "ACTIVE")) {
      return this.failClosed("INVALID_TRANSITION", "INVALID_TRANSITION", at);
    }
    const merged = mergeMetadataRecord(this.state.record, patch, at);
    if (!merged) {
      return this.failClosed("INVALID_INPUT", "INVALID_INPUT", at, this.state.record.metadata.identifier);
    }
    return this.commit(
      {
        status: "ACTIVE",
        record: merged,
        lastSnapshot: this.state.lastSnapshot,
        lastCompareEqual: this.state.lastCompareEqual,
        failureReason: null,
        updatedAt: at,
      },
      [
        {
          type: "MetadataUpdated",
          identifier: merged.metadata.identifier,
          version: merged.version,
          at,
        },
      ],
      merged,
      null,
      null,
    );
  }

  /** CREATED | ACTIVE → FROZEN */
  freeze(at = 0): MetadataResult {
    if (this.state.status !== "CREATED" && this.state.status !== "ACTIVE") {
      return this.failClosed("INVALID_TRANSITION", "INVALID_TRANSITION", at);
    }
    if (!this.state.record) {
      return this.failClosed("NO_METADATA", "NO_METADATA", at);
    }
    if (!canTransition(this.state.status, "FROZEN")) {
      return this.failClosed("INVALID_TRANSITION", "INVALID_TRANSITION", at);
    }
    const frozen = freezeMetadataRecord(this.state.record, at);
    return this.commit(
      {
        status: "FROZEN",
        record: frozen,
        lastSnapshot: this.state.lastSnapshot,
        lastCompareEqual: this.state.lastCompareEqual,
        failureReason: null,
        updatedAt: at,
      },
      [
        {
          type: "MetadataFrozen",
          identifier: frozen.metadata.identifier,
          version: frozen.version,
          at,
        },
      ],
      frozen,
      null,
      null,
    );
  }

  /** Read current record (immutable clone). */
  read(): MetadataResult {
    if (!this.state.record) {
      return fail("NO_METADATA", "NO_METADATA");
    }
    return succeed(this.getSnapshot(), [], cloneRecord(this.state.record), null, null);
  }

  /** Deep clone of current record without changing engine state. */
  clone(): MetadataResult {
    if (!this.state.record) {
      return fail("NO_METADATA", "NO_METADATA");
    }
    const cloned = cloneMetadataRecord(this.state.record);
    return succeed(this.getSnapshot(), [], cloned, null, null);
  }

  /** Compare current record to another (or to last snapshot if omitted). */
  compare(other?: MetadataRecord, at = 0): MetadataResult {
    if (!this.state.record) {
      return this.failClosed("NO_METADATA", "NO_METADATA", at);
    }
    const current = this.state.record;
    const target = other ?? this.state.lastSnapshot?.record;
    if (!target) {
      return this.failClosed("INVALID_INPUT", "INVALID_INPUT", at, current.metadata.identifier);
    }
    const equal = compareMetadataRecords(current, target);
    const identifier = current.metadata.identifier;
    this.state = {
      ...this.state,
      lastCompareEqual: equal,
      updatedAt: at,
    };
    const event: MetadataEngineEvent = {
      type: "MetadataCompared",
      identifier,
      equal,
      at,
    };
    this.emit(event);
    return succeed(this.getSnapshot(), [event], cloneRecord(current), null, equal);
  }

  /** Produce immutable snapshot of current record. */
  snapshot(at = 0): MetadataResult {
    if (!this.state.record) {
      return this.failClosed("NO_METADATA", "NO_METADATA", at);
    }
    const current = this.state.record;
    if (
      this.state.status !== "CREATED" &&
      this.state.status !== "ACTIVE" &&
      this.state.status !== "FROZEN"
    ) {
      return this.failClosed("INVALID_TRANSITION", "INVALID_TRANSITION", at);
    }
    const snap = createMetadataSnapshot(current, at);
    return this.commit(
      {
        ...this.state,
        lastSnapshot: snap,
        updatedAt: at,
      },
      [
        {
          type: "MetadataSnapshotCreated",
          identifier: snap.record.metadata.identifier,
          version: snap.version,
          at,
        },
      ],
      current,
      snap,
      null,
    );
  }

  reset(at = 0): MetadataResult {
    if (this.state.status === "EMPTY") {
      return succeed(this.getSnapshot(), [], null, null, null);
    }
    if (!canTransition(this.state.status, "EMPTY")) {
      return this.failClosed("INVALID_TRANSITION", "INVALID_TRANSITION", at);
    }
    return this.commit(createInitialState(at), [], null, null, null);
  }

  private failClosed(
    code: MetadataEngineErrorCode,
    reason: MetadataFailureReason,
    at: number,
    identifier: string | null = this.state.record?.metadata.identifier ?? null,
  ): MetadataResult {
    this.state = {
      status: "FAILED",
      record: this.state.record ? cloneRecord(this.state.record) : null,
      lastSnapshot: this.state.lastSnapshot ? cloneSnapshot(this.state.lastSnapshot) : null,
      lastCompareEqual: this.state.lastCompareEqual,
      failureReason: reason,
      updatedAt: at,
    };
    this.emit({
      type: "MetadataFailed",
      identifier,
      reason,
      at,
    });
    return fail(code, reason);
  }

  private commit(
    state: MetadataState,
    events: readonly MetadataEngineEvent[],
    record: MetadataRecord | null,
    snapshot: MetadataSnapshot | null,
    compareEqual: boolean | null,
  ): MetadataResult {
    const ownedRecord = state.record ? cloneRecord(state.record) : null;
    const ownedSnapshot = state.lastSnapshot ? cloneSnapshot(state.lastSnapshot) : null;
    this.state = {
      ...state,
      record: ownedRecord,
      lastSnapshot: ownedSnapshot,
    };
    for (const event of events) {
      this.emit(event);
    }
    return succeed(
      cloneState(this.state),
      events,
      record ? cloneRecord(record) : null,
      snapshot ? cloneSnapshot(snapshot) : null,
      compareEqual,
    );
  }

  private emit(event: MetadataEngineEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export function createSmartMobileImageMetadataEngine(): SmartMobileImageMetadataEngine {
  return new SmartMobileImageMetadataEngine();
}

export function isMetadataTransitionAllowed(
  from: MetadataEngineStatus,
  to: MetadataEngineStatus,
): boolean {
  return canTransition(from, to);
}
