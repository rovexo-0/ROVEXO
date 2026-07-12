import { buildListingPublishPayload } from "@/lib/sell/build-listing-publish-payload";
import type { PublishSuccessPayload } from "@/lib/sell/publish-success";
import { parsePublishSuccessResponse } from "@/lib/sell/publish-success";
import type { SellListingDraft, SellPhoto } from "@/features/sell/types";

export type PublishPhase =
  | "idle"
  | "validating"
  | "uploading"
  | "creating"
  | "finalising"
  | "published"
  | "error";

export const LISTING_CREATE_RETRY_MS = [2000, 5000, 10000] as const;

export const PUBLISH_FAILURE_MESSAGE =
  "Publishing failed. Your draft has been safely saved.";

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

  constructor(message: string, options?: { persistDraft?: boolean }) {
    super(message);
    this.name = "PublishEngineError";
    this.persistDraft = options?.persistDraft ?? false;
  }
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
        ? `Uploading photos… ${options.uploadProgress}%`
        : "Uploading photos…";
    case "creating":
      return options?.isEdit ? "Saving changes…" : "Creating listing…";
    case "finalising":
      return "Finalising…";
    case "published":
      return "Published";
    default:
      return options?.isEdit ? "Save changes" : "Publish";
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
      if (!photo.file) {
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
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < LISTING_CREATE_RETRY_MS.length; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok || response.status === 428) {
        return response;
      }

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Unable to save listing.");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unable to save listing.");
      const delay = LISTING_CREATE_RETRY_MS[attempt];
      if (delay !== undefined && attempt < LISTING_CREATE_RETRY_MS.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error("Unable to save listing.");
}

export async function runPublishPipeline(input: PublishPipelineInput): Promise<PublishSuccessResult> {
  const { draft, editListingId, removedImageIds, uploadPhoto, onPhase, onUploadProgress } = input;

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
    editListingId ? { ...payload, removeImageIds: removedImageIds } : payload,
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
    throw new PublishEngineError(PUBLISH_FAILURE_MESSAGE, { persistDraft: true });
  }

  onPhase("finalising");

  if (editListingId) {
    onPhase("published");
    return {
      listingId: editListingId,
      listingSlug: "",
      listingUrl: "",
      sellerId: "",
      listingStatus: "published",
      publishedAt: new Date().toISOString(),
      title: draft.title.trim(),
      photos: uploadedPhotos,
    };
  }

  const result = (await response.json()) as Parameters<typeof parsePublishSuccessResponse>[0];
  const publish = parsePublishSuccessResponse(result);

  onPhase("published");
  return {
    ...publish,
    title: publish.title || draft.title.trim(),
    photos: uploadedPhotos,
  };
}
