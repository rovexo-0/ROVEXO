/**
 * ROVEXO Smart Multi Camera Session v1.0
 *
 * STATUS: NEXT MAJOR MODULE · COD SÂNGE · GATED
 *
 * IMPLEMENT ONLY AFTER Smart Mobile Image Pipeline is CERTIFIED.
 *
 * Absolute: Seller SHALL NEVER be forced to
 *   Take Photo → Return → Upload → Take Photo → Return → Upload (per photo).
 * That flow is FORBIDDEN.
 *
 * Canonical:
 *   ONE continuous camera session → 1…8 photos → live bottom thumbnails →
 *   delete/reorder → Done/Next → ONE automatic parallel upload → Ready to Publish.
 *
 * Upload SHALL start ONLY after Done/Next — never after each capture.
 *
 * SSOT companion: lib/media/smart-mobile-image-pipeline-v1.ts
 */

import { SMART_MOBILE_IMAGE_PIPELINE_V1 } from "@/lib/media/smart-mobile-image-pipeline-v1";

export const SMART_MULTI_CAMERA_SESSION_V1 = {
  version: "1.0",
  id: "smart-multi-camera-session-v1",
  status: "NEXT_MAJOR_MODULE_GATED",
  implementationGate: "SMART_MOBILE_IMAGE_PIPELINE_CERTIFIED",
  maxPhotos: 8,

  forbiddenFlow: [
    "Take Photo",
    "Return To ROVEXO",
    "Upload",
    "Take Photo",
    "Return To ROVEXO",
    "Upload",
    "Repeat per photo",
  ] as const,

  canonicalFlow: [
    "Add Photos → Take Photos",
    "Native Camera continuous session",
    "Capture 1…8 with live bottom thumbnails",
    "Delete / Reorder / Cover",
    "Done or Next",
    "Return to ROVEXO",
    "ONE automatic parallel upload",
    "Ready to Publish",
  ] as const,

  photoLibraryFlow: [
    "Photo Library",
    "Select 1…8",
    "Done",
    "ONE upload session",
    "Ready to Publish",
  ] as const,

  uploadLaw: {
    neverUploadAfterEachCapture: true,
    uploadOnlyAfterDoneOrNext: true,
    oneUploadSession: true,
    parallelUpload: true,
    retryOnlyFailedFiles: true,
    neverDiscardCapturedPhotos: true,
    neverDuplicateUploads: true,
  } as const,

  thumbnailLaw: {
    liveBottomStrip: true,
    showCountAndCapacity: true,
    firstPhotoIsAutomaticCover: true,
    sellerMayChangeCoverBeforePublish: true,
  } as const,

  editBeforeUpload: [
    "Delete Photos",
    "Reorder Photos",
    "Replace Photos",
    "Preview Photos",
    "Zoom Photos",
  ] as const,

  platformLaw: {
    preferNativeOsExperience: true,
    neverReplaceNativeCameraUi: true,
    webAndPwa: "BEST_NATIVE_AVAILABLE",
  } as const,

  implementationOrder: [
    "1 SMART_MOBILE_IMAGE_PIPELINE → CERTIFIED",
    "2 SMART_MULTI_CAMERA_SESSION → IMPLEMENTED",
    "3 ANDROID CERTIFICATION → PASS",
    "4 IPHONE CERTIFICATION → PASS",
    "5 ROVEXO PHOTO EXPERIENCE → CERTIFIED",
  ] as const,

  certification: {
    cameraOpens: "NOT CERTIFIED",
    oneContinuousSession: "NOT CERTIFIED",
    maxEightPhotos: "NOT CERTIFIED",
    bottomThumbnailStrip: "NOT CERTIFIED",
    delete: "NOT CERTIFIED",
    reorder: "NOT CERTIFIED",
    coverSelection: "NOT CERTIFIED",
    doneOrNext: "NOT CERTIFIED",
    oneUploadSession: "NOT CERTIFIED",
    parallelUpload: "NOT CERTIFIED",
    sellPreview: "NOT CERTIFIED",
    listingDetails: "NOT CERTIFIED",
    marketplace: "NOT CERTIFIED",
    buyerView: "NOT CERTIFIED",
    android: "NOT CERTIFIED",
    iphone: "NOT CERTIFIED",
    finalStatus: "NOT CERTIFIED",
  } as const,
} as const;

/**
 * Hard gate: Multi Camera Session code changes are forbidden until
 * Smart Mobile Image Pipeline is Owner-certified on real Production devices.
 */
export function isSmartMultiCameraSessionImplementationAuthorized(): boolean {
  return SMART_MOBILE_IMAGE_PIPELINE_V1.certification.finalStatus === "CERTIFIED";
}

export function assertSmartMultiCameraSessionImplementationGate(): void {
  if (!isSmartMultiCameraSessionImplementationAuthorized()) {
    throw new Error(
      "SMART MULTI CAMERA SESSION BLOCKED — Smart Mobile Image Pipeline must be CERTIFIED first (Owner Production device PASS). NO IMPLEMENTATION.",
    );
  }
}
