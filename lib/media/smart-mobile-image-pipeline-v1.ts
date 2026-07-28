/**
 * ROVEXO Smart Mobile Image Pipeline v1.0
 *
 * STATUS: COD SÂNGE · OWNER LAW · FAIL CLOSED · UNDER INVESTIGATION / FIX
 *
 * Absolute: A listing is successful only when EVERY uploaded image is
 * processed, stored, rendered and visible on Sell · Listing Details ·
 * Marketplace · Buyer View — Desktop AND Mobile Production.
 *
 * Inequalities:
 *   Native Photo Picker PASS ≠ Image Upload PASS ≠ Image Rendering PASS
 *   Camera Session PASS ≠ Marketplace Rendering PASS
 *   EVERY STAGE MUST PASS.
 *
 * Canonical UX:
 *   ONE CAMERA SESSION → MULTIPLE PHOTOS → BOTTOM THUMBNAILS → NEXT/DONE
 *   → ONE RETURN → ONE AUTOMATIC UPLOAD → VISIBLE EVERYWHERE
 *
 * Upload policy: upload ONLY after Next/Done — never after each capture.
 *
 * Certification: localhost alone NEVER certifies. Real Production devices required.
 */

export const SMART_MOBILE_IMAGE_PIPELINE_V1 = {
  version: "1.0",
  id: "smart-mobile-image-pipeline-v1",
  status: "PRODUCTION_BLOCKER",
  localhostAloneForbidden: true,
  noCertificationUntilEveryStagePasses: true,

  productionDeploymentLaw: [
    "Code Review",
    "Build",
    "Type Check",
    "Lint",
    "Commit",
    "Push",
    "Production Deploy",
    "Production Smoke Test",
    "NEW Listing + NEW Images",
    "Verify Storage Object + JPEG SOI + HTTP 200",
    "Verify Sell · Listing Details · Marketplace · Buyer View",
    "Android Verification",
    "iPhone Verification",
    "Owner Certification",
  ] as const,

  /** Corrupt objects already in Production cannot be repaired in place — must re-upload. */
  previouslyCorruptedImagesMustBeReUploaded: true,

  absoluteSurfaces: [
    "Sell Page",
    "Listing Details",
    "Marketplace",
    "Buyer View",
  ] as const,

  absoluteDevices: ["Desktop", "Android Production", "iPhone Production"] as const,

  pipelineSteps: [
    "Native Photo Picker / Camera Session",
    "Image Compression",
    "Storage Upload",
    "Public URL HTTP 200 + valid JPEG SOI",
    "Database product_images URL",
    "Sell Preview",
    "Listing Details render",
    "Marketplace render",
    "Buyer View render",
  ] as const,

  uploadPolicy: {
    uploadOnlyAfterNextOrDone: true,
    neverUploadAfterEachCapture: true,
    retryOnlyFailedFiles: true,
    neverDiscardUserPhotos: true,
    neverRestartSuccessfulUploads: true,
  } as const,

  cameraSession: {
    oneSessionMultiplePhotos: true,
    bottomThumbnailStrip: true,
    nextOrDoneRequired: true,
    preferNativeOsBehaviour: true,
    neverReplaceNativeCameraUi: true,
  } as const,

  /**
   * Production evidence 2026-07-28 (Owner mobile publish):
   * - Storage object Content-Type image/jpeg + HTTP 200
   * - Bytes start with EF BF BD (UTF-8 U+FFFD) repeating — NOT FF D8 FF
   * - Remnant JPEG DQT (00 43 00) after FFFD proves binary→UTF-8 corruption
   * - /_next/image → 400 INVALID_IMAGE_OPTIMIZE_REQUEST
   * - SafeImage onError → placeholder (looks like “images don’t render”)
   * - Valid SOI siblings from same seller → /_next/image 200
   * - Secondary: ProductGallery quality={92} ∉ Next qualities [75, 90] → 400
   */
  confirmedRootCauses: [
    "STORAGE_OBJECT_UTF8_CORRUPTED_JPEG",
    "NEXT_IMAGE_QUALITY_92_NOT_ALLOWLISTED",
  ] as const,

  certification: {
    nativePhotoPicker: "NOT CERTIFIED",
    multiPhotoCameraSession: "NOT CERTIFIED",
    imageUploadPipeline: "NOT CERTIFIED",
    storageValidation: "NOT CERTIFIED",
    listingImages: "NOT CERTIFIED",
    marketplaceImages: "NOT CERTIFIED",
    buyerRendering: "NOT CERTIFIED",
    rootCause: "CONFIRMED_FIXES_PENDING_PRODUCTION_VERIFY",
    /** Only Owner Production device PASS may set this to CERTIFIED. */
    finalStatus: "NOT CERTIFIED" as "NOT CERTIFIED" | "CERTIFIED",
  },
} as const;

/** JPEG Start-Of-Image marker — required for Next image optimizer + browsers. */
export function isValidJpegSoi(buffer: Uint8Array): boolean {
  return (
    buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  );
}

/** Detect UTF-8 replacement corruption of binary JPEGs (FF → EF BF BD). */
export function isUtf8CorruptedJpeg(buffer: Uint8Array): boolean {
  if (buffer.length < 12) return false;
  const fffd = [0xef, 0xbf, 0xbd] as const;
  const startsWithFffd =
    buffer[0] === fffd[0] && buffer[1] === fffd[1] && buffer[2] === fffd[2];
  if (!startsWithFffd) return false;
  // Corrupted SOI+DQT often retains ASCII-safe length prefix 00 43 after FFFDs.
  for (let i = 0; i < Math.min(buffer.length - 2, 24); i++) {
    if (buffer[i] === 0x00 && buffer[i + 1] === 0x43 && buffer[i + 2] === 0x00) {
      return true;
    }
  }
  return startsWithFffd;
}

export function assertValidJpegBuffer(buffer: Uint8Array, label: string): void {
  if (isUtf8CorruptedJpeg(buffer)) {
    throw new Error(
      `Image data was corrupted during upload (${label}). Please retry the photo.`,
    );
  }
  if (!isValidJpegSoi(buffer)) {
    throw new Error(`Invalid JPEG produced for ${label}. Please retry the photo.`);
  }
}
