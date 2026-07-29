/**
 * ROVEXO Sell image processor — Product Integration Phase II–IV.
 *
 * Direct client-images / upload-client usage removed from Sell ownership.
 * Canonical path: Product Integration intake → upload/storage orchestration.
 */

export {
  intakeSellPhotoFromCanonicalEntry,
  prepareSellCameraEntry,
  prepareSellGalleryEntry,
  resumeSellDraftPhotosIntoSession,
} from "@/lib/product-integration/camera-gallery-canonical-entry-v1";

export {
  createSellProductPhotoSystem,
  intakeSellGalleryPhoto,
  prepareProductPhotoCameraSession,
} from "@/lib/product-integration/sell-photo-intake-v1";

export {
  clearSellDraftPhotosViaProductIntegration,
  deleteSellListingPhoto,
  loadSellDraftPhotosViaProductIntegration,
  prepareSellListingUpload,
  saveSellDraftPhotosViaProductIntegration,
  uploadSellListingPhoto,
} from "@/lib/product-integration/upload-storage-orchestration-v1";
