import { buildListingPublishPayload } from "@/lib/sell/build-listing-publish-payload";
import { assertSellCategoryPublishGate } from "@/lib/sell/category-engine-v1";
import type { PublishSuccessPayload } from "@/lib/sell/publish-success";
import { parsePublishSuccessResponse } from "@/lib/sell/publish-success";
import type { SellListingDraft, SellPhoto } from "@/features/sell/types";
import { sellPrimaryCtaLabel } from "@/lib/sell/canonical-edit-listing-engine-v1";

export type PublishPhase =
  | "idle"
  | "validating"
  | "uploading"
  | "creating"
  | "finalising"
  | "published"
  | "error";

export const LISTING_CREATE_RETRY_MS = [500, 1500, 3000] as const;

export const PUBLISH_FAILURE_MESSAGE =
  "Publishing failed. Please try again.";

export const PUBLISH_NETWORK_FAILURE_MESSAGE =
  "Network error while publishing. Check your connection and try again.";

export type PublishSuccessResult = PublishSuccessPayload & {
  photos: SellPhoto[];
};

export type PublishPipelineInput = {
  draft: SellListingDraft;
  editListingId?: string;
  removedImageIds: string[];
  uploadPhoto: (photo: SellPhoto, onFraction?: (fraction: number) => void) => Promise<SellPhoto>;
  onPhase: (phase: PublishPhase) => void;
  onUploadProgress: (percent: number) => void;
};

export class PublishEngineError extends Error {
  readonly persistDraft: boolean;
  readonly status?: number;
  readonly code?: string;

  constructor(
    message: string,
    options?: { persistDraft?: boolean; status?: number; code?: string },
  ) {
    super(message);
    this.name = "PublishEngineError";
    this.persistDraft = options?.persistDraft ?? false;
    this.status = options?.status;
    this.code = options?.code;
  }
}

type ListingApiErrorBody = {
  error?: unknown;
  message?: unknown;
  code?: unknown;
};

/** Surface backend `{ error | message, code }` — never discard the response body. */
export function extractListingApiErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === "object") {
    const record = body as ListingApiErrorBody;
    for (const candidate of [record.error, record.message]) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }
  if (status === 401 || status === 403) {
    return "Please sign in again to publish.";
  }
  if (status === 413) {
    return "Photos are too large. Try fewer or smaller photos.";
  }
  if (status >= 500) {
    return "Server could not publish right now. Please try again.";
  }
  return PUBLISH_FAILURE_MESSAGE;
}

export function extractListingApiErrorCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const code = (body as ListingApiErrorBody).code;
  return typeof code === "string" && code.trim() ? code.trim() : undefined;
}

/** Retry only transient failures — never retry validation / auth / business 4xx. */
export function isRetryableListingCreateStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export function publishPhaseLabel(
  phase: PublishPhase,
  options?: { uploadProgress?: number; isEdit?: boolean },
): string {
  switch (phase) {
    case "validating":
      return "Publishing…";
    case "uploading":
      return options?.uploadProgress && options.uploadProgress > 0
        ? `Please wait… ${options.uploadProgress}%`
        : "Please wait…";
    case "creating":
    case "finalising":
      return "Please wait…";
    case "published":
      return "Listing successfully published.";
    default:
      return options?.isEdit ? sellPrimaryCtaLabel(true) : sellPrimaryCtaLabel(false);
  }
}

async function uploadAllPhotos(
  photos: SellPhoto[],
  uploadPhoto: PublishPipelineInput["uploadPhoto"],
  onUploadProgress: (percent: number) => void,
): Promise<SellPhoto[]> {
  const fractions = new Array(photos.length).fill(0);
  const reportAggregate = () => {
    const sum = fractions.reduce((total, value) => total + value, 0);
    onUploadProgress(Math.round(sum / Math.max(1, photos.length)));
  };

  return Promise.all(
    photos.map((photo, index) => {
      if (photo.uploaded || !photo.file) {
        fractions[index] = 100;
        reportAggregate();
        return Promise.resolve(photo);
      }
      return uploadPhoto(photo, (fraction) => {
        fractions[index] = fraction;
        reportAggregate();
      });
    }),
  );
}

async function createListingWithRetry(
  endpoint: string,
  method: string,
  body: unknown,
): Promise<Response> {
  let lastError: PublishEngineError | null = null;

  for (let attempt = 0; attempt < LISTING_CREATE_RETRY_MS.length; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      if (response.ok || response.status === 428) {
        return response;
      }

      const parsed = await response.json().catch(() => null);
      const apiError = new PublishEngineError(
        extractListingApiErrorMessage(response.status, parsed),
        {
          persistDraft: true,
          status: response.status,
          code: extractListingApiErrorCode(parsed),
        },
      );

      if (!isRetryableListingCreateStatus(response.status)) {
        throw apiError;
      }

      lastError = apiError;
    } catch (error) {
      if (error instanceof PublishEngineError) {
        if (error.status !== undefined && !isRetryableListingCreateStatus(error.status)) {
          throw error;
        }
        lastError = error;
      } else {
        lastError = new PublishEngineError(PUBLISH_NETWORK_FAILURE_MESSAGE, {
          persistDraft: true,
        });
      }
    }

    const delay = LISTING_CREATE_RETRY_MS[attempt];
    if (delay !== undefined && attempt < LISTING_CREATE_RETRY_MS.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw (
    lastError ??
    new PublishEngineError(PUBLISH_FAILURE_MESSAGE, { persistDraft: true })
  );
}

export async function runPublishPipeline(input: PublishPipelineInput): Promise<PublishSuccessResult> {
  const { draft, editListingId, removedImageIds, uploadPhoto, onPhase, onUploadProgress } = input;

  onPhase("validating");
  const categoryGate = assertSellCategoryPublishGate({
    categoryPath: draft.categoryPath,
    title: draft.title,
    description: draft.description,
    brand: draft.brand,
  });
  if (!categoryGate.ok) {
    throw new PublishEngineError(categoryGate.message, { persistDraft: true });
  }

  onPhase("uploading");
  onUploadProgress(0);

  const uploadedPhotos = await uploadAllPhotos(draft.photos, uploadPhoto, onUploadProgress);

  if (uploadedPhotos.some((photo) => !photo.url || !photo.storagePath)) {
    throw new PublishEngineError("Photo upload did not complete. Please try again.", {
      persistDraft: true,
    });
  }

  onPhase("creating");
  const payload = buildListingPublishPayload(draft, uploadedPhotos);
  const endpoint = editListingId ? `/api/listings/${editListingId}` : "/api/listings";
  const method = editListingId ? "PATCH" : "POST";

  const response = await createListingWithRetry(
    endpoint,
    method,
    editListingId
      ? { ...payload, removeImageIds: removedImageIds, status: "published" }
      : payload,
  );

  if (response.status === 428) {
    const body = (await response.json().catch(() => null)) as { redirect?: string } | null;
    if (body?.redirect) {
      const redirectError = new PublishEngineError("Profile verification required.", {
        persistDraft: true,
      });
      (redirectError as PublishEngineError & { redirect?: string }).redirect = body.redirect;
      throw redirectError;
    }
  }

  if (!response.ok) {
    const parsed = await response.json().catch(() => null);
    throw new PublishEngineError(extractListingApiErrorMessage(response.status, parsed), {
      persistDraft: true,
      status: response.status,
      code: extractListingApiErrorCode(parsed),
    });
  }

  onPhase("finalising");

  const result = (await response.json()) as Parameters<typeof parsePublishSuccessResponse>[0];
  const publish = parsePublishSuccessResponse(result);

  onPhase("published");
  return {
    ...publish,
    title: publish.title || draft.title.trim(),
    photos: uploadedPhotos,
  };
}
