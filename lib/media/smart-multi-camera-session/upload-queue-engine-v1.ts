/**
 * ROVEXO Smart Multi Camera Session — Upload Queue Engine v1.0
 *
 * PHASE V · COD SÂNGE · ONE implementation · Logic only
 *
 * Prepares upload jobs. NEVER uploads, NEVER opens network, NEVER
 * knows storage providers. Host performs upload and notifies results.
 */

import { SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS } from "@/lib/media/smart-multi-camera-session/session-types-v1";
import type {
  CreateUploadQueueInput,
  CreateUploadQueueItemInput,
  UploadQueueErrorCode,
  UploadQueueEvent,
  UploadQueueItem,
  UploadQueueResult,
  UploadQueueState,
  UploadQueueStatus,
} from "@/lib/media/smart-multi-camera-session/upload-queue-types-v1";

export const SMART_MULTI_CAMERA_UPLOAD_QUEUE_V1 = {
  version: "1.0",
  id: "smart-multi-camera-upload-queue-v1",
  phase: "V_UPLOAD_QUEUE",
  status: "CERTIFIED",
  maxPhotos: SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS,
  oneQueuePerSession: true,
  networkForbidden: true,
  httpForbidden: true,
  storageForbidden: true,
  uiForbidden: true,
} as const;

type QueueListener = (event: UploadQueueEvent) => void;

const ERROR_MESSAGE: Record<UploadQueueErrorCode, string> = {
  INVALID_TRANSITION: "Invalid upload queue state transition.",
  EMPTY_QUEUE: "Upload queue cannot be empty.",
  CAPACITY_REACHED: "Upload queue exceeds photo capacity.",
  DUPLICATE_PHOTO_ID: "Upload queue contains duplicate photo ids.",
  INVALID_ORDER: "Upload queue order is invalid.",
  INVALID_ITEM: "Upload queue item is invalid.",
  QUEUE_EXISTS: "An upload queue already exists for this session.",
  NO_QUEUE: "No upload queue is available.",
  QUEUE_TERMINAL: "Upload queue is closed.",
};

const ALLOWED_TRANSITIONS: Readonly<
  Record<UploadQueueStatus, readonly UploadQueueStatus[]>
> = {
  EMPTY: ["CREATED"],
  CREATED: ["READY", "CANCELLED", "EMPTY"],
  READY: ["UPLOAD_REQUESTED", "CANCELLED", "EMPTY"],
  UPLOAD_REQUESTED: ["UPLOADING", "CANCELLED", "FAILED"],
  UPLOADING: ["COMPLETED", "FAILED", "CANCELLED"],
  COMPLETED: ["EMPTY"],
  FAILED: ["EMPTY", "UPLOAD_REQUESTED", "CANCELLED"],
  CANCELLED: ["EMPTY"],
};

function fail(code: UploadQueueErrorCode): UploadQueueResult {
  return { ok: false, code, message: ERROR_MESSAGE[code] };
}

function succeed(
  state: UploadQueueState,
  events: readonly UploadQueueEvent[],
): UploadQueueResult {
  return { ok: true, state, events };
}

function now(): number {
  return Date.now();
}

function canTransition(from: UploadQueueStatus, to: UploadQueueStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

function createEmptyState(): UploadQueueState {
  return {
    sessionId: null,
    status: "EMPTY",
    items: [],
    lastErrorCode: null,
    updatedAt: 0,
  };
}

function normalizeItems(
  items: readonly CreateUploadQueueItemInput[],
):
  | { ok: true; items: UploadQueueItem[] }
  | { ok: false; code: UploadQueueErrorCode } {
  if (items.length === 0) {
    return { ok: false, code: "EMPTY_QUEUE" };
  }
  if (items.length > SMART_MULTI_CAMERA_SESSION_MAX_PHOTOS) {
    return { ok: false, code: "CAPACITY_REACHED" };
  }

  const ids = new Set<string>();
  const normalized: UploadQueueItem[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]!;
    const photoId = item.photoId.trim();
    const localUri = item.localUri.trim();
    if (!photoId || !localUri || !Number.isInteger(item.order)) {
      return { ok: false, code: "INVALID_ITEM" };
    }
    if (ids.has(photoId)) {
      return { ok: false, code: "DUPLICATE_PHOTO_ID" };
    }
    ids.add(photoId);
    normalized.push({
      photoId,
      localUri,
      order: item.order,
    });
  }

  const sorted = [...normalized].sort((left, right) => left.order - right.order);
  for (let index = 0; index < sorted.length; index += 1) {
    if (sorted[index]!.order !== index) {
      return { ok: false, code: "INVALID_ORDER" };
    }
  }

  return {
    ok: true,
    items: sorted,
  };
}

/**
 * Canonical Upload Queue — single owner of upload job preparation state.
 */
export class SmartMultiCameraUploadQueue {
  private state: UploadQueueState = createEmptyState();
  private readonly listeners = new Set<QueueListener>();

  getSnapshot(): UploadQueueState {
    return {
      ...this.state,
      items: this.state.items.map((item) => ({ ...item })),
    };
  }

  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * EMPTY → CREATED
   * One queue per session. Items must match contiguous Photo Collection order.
   */
  createQueue(input: CreateUploadQueueInput): UploadQueueResult {
    if (this.state.status !== "EMPTY") {
      return fail("QUEUE_EXISTS");
    }
    if (!canTransition("EMPTY", "CREATED")) {
      return fail("INVALID_TRANSITION");
    }

    const sessionId = input.sessionId.trim();
    if (!sessionId) {
      return fail("INVALID_ITEM");
    }

    const normalized = normalizeItems(input.items);
    if (!normalized.ok) {
      return fail(normalized.code);
    }

    const at = now();
    return this.commit(
      {
        sessionId,
        status: "CREATED",
        items: normalized.items,
        lastErrorCode: null,
        updatedAt: at,
      },
      [
        {
          type: "QueueCreated",
          sessionId,
          itemCount: normalized.items.length,
          at,
        },
      ],
    );
  }

  /** CREATED → READY after validation (fail closed on invalid). */
  validateQueue(): UploadQueueResult {
    if (this.state.status !== "CREATED") {
      return fail("INVALID_TRANSITION");
    }
    if (!this.state.sessionId || this.state.items.length === 0) {
      return fail("EMPTY_QUEUE");
    }

    const normalized = normalizeItems(this.state.items);
    if (!normalized.ok) {
      return fail(normalized.code);
    }
    if (!canTransition("CREATED", "READY")) {
      return fail("INVALID_TRANSITION");
    }

    const at = now();
    return this.commit(
      {
        ...this.state,
        status: "READY",
        items: normalized.items,
        lastErrorCode: null,
        updatedAt: at,
      },
      [
        {
          type: "QueueValidated",
          sessionId: this.state.sessionId,
          itemCount: normalized.items.length,
          at,
        },
      ],
    );
  }

  /** READY | FAILED → UPLOAD_REQUESTED — never uploads. */
  requestUpload(): UploadQueueResult {
    if (this.state.status !== "READY" && this.state.status !== "FAILED") {
      return fail("INVALID_TRANSITION");
    }
    if (!canTransition(this.state.status, "UPLOAD_REQUESTED")) {
      return fail("INVALID_TRANSITION");
    }
    if (!this.state.sessionId || this.state.items.length === 0) {
      return fail("EMPTY_QUEUE");
    }

    const at = now();
    return this.commit(
      {
        ...this.state,
        status: "UPLOAD_REQUESTED",
        lastErrorCode: null,
        updatedAt: at,
      },
      [{ type: "UploadRequested", sessionId: this.state.sessionId, at }],
    );
  }

  /** Host signal — UPLOAD_REQUESTED → UPLOADING */
  notifyUploadStarted(): UploadQueueResult {
    if (!this.state.sessionId) {
      return fail("NO_QUEUE");
    }
    if (!canTransition(this.state.status, "UPLOADING")) {
      return fail("INVALID_TRANSITION");
    }
    const at = now();
    return this.commit(
      {
        ...this.state,
        status: "UPLOADING",
        lastErrorCode: null,
        updatedAt: at,
      },
      [{ type: "UploadStarted", sessionId: this.state.sessionId, at }],
    );
  }

  /** Host signal — UPLOADING → COMPLETED */
  notifyUploadCompleted(): UploadQueueResult {
    if (!this.state.sessionId) {
      return fail("NO_QUEUE");
    }
    if (!canTransition(this.state.status, "COMPLETED")) {
      return fail("INVALID_TRANSITION");
    }
    const at = now();
    return this.commit(
      {
        ...this.state,
        status: "COMPLETED",
        lastErrorCode: null,
        updatedAt: at,
      },
      [{ type: "UploadCompleted", sessionId: this.state.sessionId, at }],
    );
  }

  /** Host signal — UPLOADING | UPLOAD_REQUESTED → FAILED */
  notifyUploadFailed(): UploadQueueResult {
    if (!this.state.sessionId) {
      return fail("NO_QUEUE");
    }
    if (!canTransition(this.state.status, "FAILED")) {
      return fail("INVALID_TRANSITION");
    }
    const at = now();
    return this.commit(
      {
        ...this.state,
        status: "FAILED",
        lastErrorCode: null,
        updatedAt: at,
      },
      [{ type: "UploadFailed", sessionId: this.state.sessionId, at }],
    );
  }

  /** Cancel active / prepared queue. */
  cancelQueue(): UploadQueueResult {
    if (this.state.status === "EMPTY") {
      return fail("NO_QUEUE");
    }
    if (this.state.status === "COMPLETED") {
      return fail("QUEUE_TERMINAL");
    }
    if (!canTransition(this.state.status, "CANCELLED")) {
      return fail("INVALID_TRANSITION");
    }
    if (!this.state.sessionId) {
      return fail("NO_QUEUE");
    }

    const at = now();
    return this.commit(
      {
        ...this.state,
        status: "CANCELLED",
        updatedAt: at,
      },
      [{ type: "QueueCancelled", sessionId: this.state.sessionId, at }],
    );
  }

  /** Reset to EMPTY — clears session binding and items. */
  resetQueue(): UploadQueueResult {
    if (this.state.status === "EMPTY") {
      return succeed(this.getSnapshot(), []);
    }
    if (!canTransition(this.state.status, "EMPTY")) {
      return fail("INVALID_TRANSITION");
    }

    const at = now();
    this.state = { ...createEmptyState(), updatedAt: at };
    const events: UploadQueueEvent[] = [{ type: "QueueReset", at }];
    this.emitAll(events);
    return succeed(this.getSnapshot(), events);
  }

  private commit(
    state: UploadQueueState,
    events: readonly UploadQueueEvent[],
  ): UploadQueueResult {
    // Take ownership of freshly built items (single defensive clone on return).
    this.state = {
      ...state,
      items: state.items,
    };
    this.emitAll(events);
    return succeed(this.getSnapshot(), events);
  }

  private emitAll(events: readonly UploadQueueEvent[]): void {
    for (const event of events) {
      for (const listener of this.listeners) {
        listener(event);
      }
    }
  }
}

export function createSmartMultiCameraUploadQueue(): SmartMultiCameraUploadQueue {
  return new SmartMultiCameraUploadQueue();
}

export function isUploadQueueTransitionAllowed(
  from: UploadQueueStatus,
  to: UploadQueueStatus,
): boolean {
  return canTransition(from, to);
}
