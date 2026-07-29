/**
 * ROVEXO Smart Mobile Image Pipeline v1.0
 *
 * STATUS: COD SÂNGE · OWNER LAW · FAIL CLOSED · PHASE I–VIII LOGIC CERTIFIED
 * · PRODUCT UI CERTIFIED (OS Picker Scope Lock · Cluster 5 Owner Visual QA)
 * · Multi Camera UI remains deferred (finalStatus NOT CERTIFIED keeps UI gate closed)
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
 *
 * Phase I (logic only): Architecture & SSOT Foundation — CERTIFIED.
 * Phase II (logic only): Validation Engine — CERTIFIED.
 * Phase III (logic only): Normalization Engine — CERTIFIED.
 * Phase IV (logic only): Metadata Engine — CERTIFIED.
 * Phase V (logic only): Pipeline Integration — CERTIFIED.
 * Phase VI (logic only): Performance Validation — CERTIFIED.
 * Phase VII (logic only): SSOT Consolidation — CERTIFIED.
 * Phase VIII (logic only): Integration Certification — CERTIFIED (logic module).
 * UI · camera · network · storage remain forbidden until later phases.
 */

export {
  assertValidJpegBuffer,
  isUtf8CorruptedJpeg,
  isValidJpegSoi,
} from "@/lib/media/smart-mobile-image-pipeline/jpeg-guards-v1";

export const SMART_MOBILE_IMAGE_PIPELINE_V1 = {
  version: "1.0",
  id: "smart-mobile-image-pipeline-v1",
  status: "CERTIFIED",
  localhostAloneForbidden: true,
  noCertificationUntilEveryStagePasses: true,
  phaseIArchitectureSsot: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "PIPELINE_ENGINE",
    module: "lib/media/smart-mobile-image-pipeline/pipeline-engine-v1.ts",
    surface: "lib/media/smart-mobile-image-pipeline/index.ts",
    uiForbidden: true,
    networkForbidden: true,
    storageForbidden: true,
    cameraForbidden: true,
  } as const,
  phaseIIValidationEngine: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "VALIDATION_ENGINE",
    module: "lib/media/smart-mobile-image-pipeline/validation-engine-v1.ts",
    ownsValidationOnly: true,
    normalizationForbidden: true,
    uiForbidden: true,
    networkForbidden: true,
    storageForbidden: true,
    cameraForbidden: true,
  } as const,
  phaseIIINormalizationEngine: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "NORMALIZATION_ENGINE",
    module: "lib/media/smart-mobile-image-pipeline/normalization-engine-v1.ts",
    ownsNormalizationOnly: true,
    validationForbidden: true,
    uploadForbidden: true,
    storageForbidden: true,
    cameraForbidden: true,
    networkForbidden: true,
    pixelDecodeForbidden: true,
    compressionForbidden: true,
    imageByteModificationForbidden: true,
    uiForbidden: true,
  } as const,
  phaseIVMetadataEngine: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "METADATA_ENGINE",
    module: "lib/media/smart-mobile-image-pipeline/metadata-engine-v1.ts",
    ownsMetadataOnly: true,
    validationForbidden: true,
    normalizationForbidden: true,
    uploadForbidden: true,
    storageForbidden: true,
    cameraForbidden: true,
    networkForbidden: true,
    pixelDecodeForbidden: true,
    compressionForbidden: true,
    imageTransformationForbidden: true,
    uiForbidden: true,
  } as const,
  phaseVPipelineIntegration: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "PIPELINE_INTEGRATION",
    module: "lib/media/smart-mobile-image-pipeline/pipeline-integration-v1.ts",
    compositionOnly: true,
    behaviouralChangesForbidden: true,
    featureAdditionsForbidden: true,
    uiForbidden: true,
    cameraForbidden: true,
    networkForbidden: true,
    storageForbidden: true,
    uploadForbidden: true,
    pixelDecodeForbidden: true,
    compressionForbidden: true,
  } as const,
  phaseVIPerformanceValidation: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "PERFORMANCE_VALIDATION",
    module: "lib/media/smart-mobile-image-pipeline/performance-validation-v1.ts",
    behaviouralChangesForbidden: true,
    publicContractChangesForbidden: true,
    apiChangesForbidden: true,
    uiForbidden: true,
    cameraForbidden: true,
    networkForbidden: true,
    storageForbidden: true,
    uploadForbidden: true,
    pixelDecodeForbidden: true,
    compressionForbidden: true,
  } as const,
  phaseVIISsotConsolidation: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "SSOT_CONSOLIDATION",
    module: "lib/media/smart-mobile-image-pipeline/ssot-consolidation-v1.ts",
    architectureVerificationOnly: true,
    behaviouralChangesForbidden: true,
    publicApiChangesForbidden: true,
    optimisationForbidden: true,
    featureAdditionsForbidden: true,
    uiForbidden: true,
    cameraForbidden: true,
    networkForbidden: true,
    storageForbidden: true,
    uploadForbidden: true,
    pixelDecodeForbidden: true,
    compressionForbidden: true,
  } as const,
  phaseVIIIIntegrationCertification: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "INTEGRATION_CERTIFICATION",
    module: "lib/media/smart-mobile-image-pipeline/integration-certification-v1.ts",
    logicModuleIntegration: "CERTIFIED",
    productUiStatus: "CERTIFIED",
    behaviouralChangesForbidden: true,
    featureAdditionsForbidden: true,
    optimisationForbidden: true,
    publicApiChangesForbidden: true,
    uiForbidden: true,
    cameraForbidden: true,
    networkForbidden: true,
    storageForbidden: true,
    uploadForbidden: true,
    pixelDecodeForbidden: true,
    compressionForbidden: true,
  } as const,

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
    phaseIArchitectureSsot: "CERTIFIED",
    phaseIIValidationEngine: "CERTIFIED",
    phaseIIINormalizationEngine: "CERTIFIED",
    phaseIVMetadataEngine: "CERTIFIED",
    phaseVPipelineIntegration: "CERTIFIED",
    phaseVIPerformanceValidation: "CERTIFIED",
    phaseVIISsotConsolidation: "CERTIFIED",
    phaseVIIIIntegrationCertification: "CERTIFIED",
    nativePhotoPicker: "CERTIFIED",
    multiPhotoCameraSession: "NOT CERTIFIED",
    imageUploadPipeline: "CERTIFIED",
    storageValidation: "CERTIFIED",
    listingImages: "CERTIFIED",
    marketplaceImages: "NOT CERTIFIED",
    buyerRendering: "NOT CERTIFIED",
    productIntegrationFoundation: "CERTIFIED",
    rootCause: "CONFIRMED_FIXES_PENDING_PRODUCTION_VERIFY",
    /**
     * Full pipeline finalStatus stays NOT CERTIFIED while Smart Multi Camera UI
     * is deferred to v1.1 (UI gate reads this field). OS Picker product UI is
     * certified via status + productUiStatus under Cluster 5 Scope Lock.
     */
    finalStatus: "NOT CERTIFIED" as "NOT CERTIFIED" | "CERTIFIED",
  },
} as const;
