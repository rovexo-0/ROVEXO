/**
 * ROVEXO Smart Multi Camera Session — Upload Queue types v1.0
 *
 * PHASE V · COD SÂNGE · Logic only — prepares jobs · never uploads · no network.
 */

export type UploadQueueStatus =
  | "EMPTY"
  | "CREATED"
  | "READY"
  | "UPLOAD_REQUESTED"
  | "UPLOADING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type UploadQueueItem = {
  photoId: string;
  localUri: string;
  order: number;
};

export type UploadQueueState = {
  sessionId: string | null;
  status: UploadQueueStatus;
  items: readonly UploadQueueItem[];
  lastErrorCode: UploadQueueErrorCode | null;
  updatedAt: number;
};

export type CreateUploadQueueInput = {
  sessionId: string;
  items: readonly CreateUploadQueueItemInput[];
};

export type CreateUploadQueueItemInput = {
  photoId: string;
  localUri: string;
  order: number;
};

export type UploadQueueErrorCode =
  | "INVALID_TRANSITION"
  | "EMPTY_QUEUE"
  | "CAPACITY_REACHED"
  | "DUPLICATE_PHOTO_ID"
  | "INVALID_ORDER"
  | "INVALID_ITEM"
  | "QUEUE_EXISTS"
  | "NO_QUEUE"
  | "QUEUE_TERMINAL";

export type UploadQueueFailure = {
  ok: false;
  code: UploadQueueErrorCode;
  message: string;
};

export type UploadQueueSuccess = {
  ok: true;
  state: UploadQueueState;
  events: readonly UploadQueueEvent[];
};

export type UploadQueueResult = UploadQueueSuccess | UploadQueueFailure;

export type UploadQueueEventType =
  | "QueueCreated"
  | "QueueValidated"
  | "UploadRequested"
  | "UploadStarted"
  | "UploadCompleted"
  | "UploadFailed"
  | "QueueCancelled"
  | "QueueReset";

export type UploadQueueEvent =
  | { type: "QueueCreated"; sessionId: string; itemCount: number; at: number }
  | { type: "QueueValidated"; sessionId: string; itemCount: number; at: number }
  | { type: "UploadRequested"; sessionId: string; at: number }
  | { type: "UploadStarted"; sessionId: string; at: number }
  | { type: "UploadCompleted"; sessionId: string; at: number }
  | { type: "UploadFailed"; sessionId: string; at: number }
  | { type: "QueueCancelled"; sessionId: string; at: number }
  | { type: "QueueReset"; at: number };
