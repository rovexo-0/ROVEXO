/**
 * Sell storage-engine — DELEGATE ONLY (Product Integration Phase IV).
 *
 * Upload/storage orchestration is owned by Product Integration.
 * This module re-exports orchestration APIs for compatibility.
 * Sell feature code must import from `@/lib/product-integration`.
 */

export {
  SELL_UPLOAD_RETRY_DELAYS_MS as UPLOAD_RETRY_DELAYS_MS,
  deleteSellListingPhoto as deleteListingImage,
  uploadSellListingPhoto as uploadListingImageWithBackoff,
  type UploadedImageResult,
} from "@/lib/product-integration/upload-storage-orchestration-v1";

export type { UploadSellListingPhotoInput as StorageUploadInput } from "@/lib/product-integration/upload-storage-orchestration-v1";

/** @deprecated Use uploadSellListingPhoto from Product Integration. */
export { uploadSellListingPhoto as uploadListingImage } from "@/lib/product-integration/upload-storage-orchestration-v1";
