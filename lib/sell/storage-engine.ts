import {
  deleteListingImage,
  uploadListingImage,
  type UploadedImageResult,
} from "@/lib/listings/upload-client";

/** SELL-107 — upload retry backoff (seconds → ms). */
export const UPLOAD_RETRY_DELAYS_MS = [2000, 5000, 10000] as const;

export type StorageUploadInput = {
  file: File;
  productId?: string;
  sessionId?: string;
  onProgress?: (progress: number) => void;
};

export async function uploadListingImageWithBackoff(
  input: StorageUploadInput,
): Promise<UploadedImageResult> {
  return uploadListingImage({
    ...input,
    maxRetries: UPLOAD_RETRY_DELAYS_MS.length,
    retryDelaysMs: [...UPLOAD_RETRY_DELAYS_MS],
  });
}

export { deleteListingImage, uploadListingImage, type UploadedImageResult };
