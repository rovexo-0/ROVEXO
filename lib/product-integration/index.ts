/**
 * ROVEXO Product Integration — public surface.
 */

export {
  PHOTO_SYSTEM_FORBIDDEN_FEATURE_IMPORTS,
  PHOTO_SYSTEM_PRODUCT_ENTRY_POINTS,
  PHOTO_SYSTEM_PRODUCT_INTEGRATION_FOUNDATION_V1,
  PHOTO_SYSTEM_PRODUCT_OWNERSHIP,
  assertPhotoSystemProductIntegrationFoundation,
  assertValidJpegBuffer,
  createProductPhotoSystem,
  isUtf8CorruptedJpeg,
  isValidJpegSoi,
  listPhotoSystemProductIntegrationAdvisories,
} from "@/lib/product-integration/photo-system-integration-foundation-v1";

export type {
  PhotoSystemProductIntegrationIssue,
  PhotoSystemProductIntegrationResult,
  ProductPhotoSystem,
} from "@/lib/product-integration/photo-system-integration-foundation-v1";

export {
  PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_II_V1,
  createSellProductPhotoSystem,
  intakeSellGalleryPhoto,
  prepareProductPhotoCameraSession,
  removeSellPhotoFromProductSystem,
  reorderSellPhotosInProductSystem,
  resetSellProductPhotoSystem,
} from "@/lib/product-integration/sell-photo-intake-v1";

export type {
  SellPhotoIntakeFailure,
  SellPhotoIntakePhoto,
  SellPhotoIntakeResult,
  SellPhotoIntakeSuccess,
} from "@/lib/product-integration/sell-photo-intake-v1";

export { projectMetadataRecordToSellDraft } from "@/lib/product-integration/sell-photo-metadata-adapter-v1";

export type {
  SellDraftPhotoMetadata,
  SellDraftPhotoOrientation,
} from "@/lib/product-integration/sell-photo-metadata-adapter-v1";

export {
  SELL_PHOTO_SESSION_HOST_V1,
  acquireSellPhotoSession,
  assertSingleActiveSellPhotoSession,
  cancelSellPhotoSession,
  getActiveSellPhotoSessionOwnerId,
  getActiveSellPhotoSystem,
  resetSellPhotoSession,
  resumeSellPhotoSession,
} from "@/lib/product-integration/sell-photo-session-host-v1";

export {
  PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_III_V1,
  SELL_PHOTO_CANONICAL_ENTRIES,
  intakeSellPhotoFromCanonicalEntry,
  prepareSellCameraEntry,
  prepareSellGalleryEntry,
  removeSellPhotoViaCanonicalEntry,
  reorderSellPhotosViaCanonicalEntry,
  resumeSellDraftPhotosIntoSession,
} from "@/lib/product-integration/camera-gallery-canonical-entry-v1";

export type {
  IntakeSellPhotoFromEntryInput,
  SellPhotoEntrySource,
} from "@/lib/product-integration/camera-gallery-canonical-entry-v1";

export {
  PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_IV_V1,
  SELL_UPLOAD_RETRY_DELAYS_MS,
  clearSellDraftPhotosViaProductIntegration,
  deleteSellListingPhoto,
  loadSellDraftPhotosViaProductIntegration,
  prepareSellListingUpload,
  saveSellDraftPhotosViaProductIntegration,
  uploadSellListingPhoto,
} from "@/lib/product-integration/upload-storage-orchestration-v1";

export type {
  DeleteSellListingPhotoInput,
  PreparedSellListingUpload,
  UploadSellListingPhotoInput,
  UploadedImageResult,
} from "@/lib/product-integration/upload-storage-orchestration-v1";

// Phase V E2E certification is imported directly by tests / server tools —
// not re-exported from this barrel (keeps Sell client bundle free of cert-only deps).

export {
  CLUSTER_5_PHOTO_SYSTEM_SCOPE_LOCK,
  assertCluster5PhotoSystemArchitectureOrBlock,
  getCluster5PhotoSystemScopeLockSnapshot,
} from "@/lib/product-integration/cluster-5-photo-system-scope-lock-v1";

export type { Cluster5PhotoSystemScopeLock } from "@/lib/product-integration/cluster-5-photo-system-scope-lock-v1";
