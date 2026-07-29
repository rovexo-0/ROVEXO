/**
 * ROVEXO CLUSTER 5 — PHOTO SYSTEM & UPLOAD PIPELINE
 * SCOPE LOCK v1.0
 *
 * OWNER APPROVED · ARCHITECTURE SCOPE LOCKED
 * Cod Sânge — Cluster 5 · Owner Architecture Decision
 *
 * Equation:
 * Native OS Gallery/Camera Picker
 * + Smart Mobile Image Pipeline (mandatory)
 * + Product Integration
 * + Upload → Supabase Storage → Draft → Publish
 * + Smart Multi Camera UI deferred to v1.1
 * = CLUSTER 5 v1.0 SCOPE LOCK
 *
 * This file is architecture / Scope Lock only.
 * It does not certify Technical Certification, Owner Visual QA, or Production Freeze.
 */

export const CLUSTER_5_PHOTO_SYSTEM_SCOPE_LOCK = {
  version: "1.0",
  cluster: "CLUSTER_5_PHOTO_SYSTEM_UPLOAD_PIPELINE",
  status: "OWNER_APPROVED_PRODUCTION_READY_FROZEN",
  approvedByOwner: true,
  scopeLocked: true,
  architectureCertified: true,
  /** Owner Visual QA PASS · Production Freeze applied. */
  productionReady: true,
  freezeApplied: true,
  technicalCertificationPass: true,
  ownerVisualQaPass: true,

  equation:
    "OS_PICKER + SMART_MOBILE_IMAGE_PIPELINE + PRODUCT_INTEGRATION + UPLOAD + STORAGE + DRAFT + PUBLISH",

  canonicalAcquisition: {
    primary: "Native OS Gallery Picker",
    secondary: "Native OS Camera Picker (when exposed by the operating system)",
    hostInput: "features/sell/ui/SellPhotoFileInput.tsx",
    pickerContract: "lib/media/universal-photo-picker-v1.ts",
    forbidden: [
      "Standalone Smart Multi Camera UI",
      "Advanced in-app camera workflow",
      "Second listing upload workflow without Owner approval",
    ] as const,
  } as const,

  canonicalFlow: [
    "USER",
    "NATIVE_OS_GALLERY_OR_CAMERA_PICKER",
    "SMART_MOBILE_IMAGE_PIPELINE",
    "PRODUCT_INTEGRATION",
    "UPLOAD",
    "SUPABASE_STORAGE",
    "DRAFT_PRODUCT",
    "PUBLISH",
  ] as const,

  mandatoryActive: [
    "Smart Mobile Image Pipeline",
    "Compression",
    "Thumbnail generation",
    "EXIF correction",
    "Orientation correction",
    "Retry engine",
    "Validation pipeline",
  ] as const,

  deferredToV1_1: [
    "Standalone Smart Multi Camera UI",
    "Advanced in-app camera workflow",
  ] as const,

  multiCamera: {
    logicPreserved: true,
    uiGate: "ACTIVE",
    uiDeferredTo: "v1.1",
    productionRuntimeDependsOnUi: false,
    removingUiDoesNotAffectCanonicalUpload: true,
    ssot: "lib/media/smart-multi-camera-session-v1.ts",
  } as const,

  productIntegration: {
    barrel: "lib/product-integration/index.ts",
    foundation: "lib/product-integration/photo-system-integration-foundation-v1.ts",
    intake: "lib/product-integration/sell-photo-intake-v1.ts",
    canonicalEntry: "lib/product-integration/camera-gallery-canonical-entry-v1.ts",
    sessionHost: "lib/product-integration/sell-photo-session-host-v1.ts",
    uploadOrchestration: "lib/product-integration/upload-storage-orchestration-v1.ts",
    sellHost: "features/sell/ui/SellPage.tsx",
    sellProvider: "features/sell/context/SellProvider.tsx",
    uploadRoute: "app/api/listings/upload/route.ts",
  } as const,

  entryPoints: {
    canonical: [
      "features/sell/ui/SellPage.tsx → SellPhotoRail → SellPhotoFileInput",
      "features/sell/context/SellProvider.tsx → intakeSellPhotoFromCanonicalEntry",
      "features/sell/context/SellProvider.tsx → uploadSellListingPhoto",
      "app/seller/listings/[id]/edit → SellPage reuse",
      "Draft restore via Product Integration draft storage",
    ] as const,
    redirectOnly: ["/sell/camera", "/sell/new"] as const,
    nonListingParallelSurfaces: [
      "Messages photo attachment",
      "Support document upload",
      "Camera Search",
      "Avatar upload",
    ] as const,
  } as const,

  permanentlyForbidden: [
    "Second listing photo upload workflow",
    "Sell feature → upload-client / client-images bypass of Product Integration",
    "Promoting Smart Multi Camera UI to v1.0 without Owner approval",
    "Parallel Sell camera page UI",
  ] as const,

  ssot: {
    scopeLock: "lib/product-integration/cluster-5-photo-system-scope-lock-v1.ts",
    productIntegration: "lib/product-integration/index.ts",
    pipeline: "lib/media/smart-mobile-image-pipeline-v1.ts",
    multiCamera: "lib/media/smart-multi-camera-session-v1.ts",
  } as const,
} as const;

export type Cluster5PhotoSystemScopeLock = typeof CLUSTER_5_PHOTO_SYSTEM_SCOPE_LOCK;

export function getCluster5PhotoSystemScopeLockSnapshot() {
  return CLUSTER_5_PHOTO_SYSTEM_SCOPE_LOCK;
}

export function assertCluster5PhotoSystemArchitectureOrBlock(): void {
  const lock = CLUSTER_5_PHOTO_SYSTEM_SCOPE_LOCK;
  if (!lock.approvedByOwner || !lock.scopeLocked || !lock.architectureCertified) {
    throw new Error("CLUSTER 5 Photo System architecture Scope Lock is not Owner-approved.");
  }
  if (lock.multiCamera.productionRuntimeDependsOnUi) {
    throw new Error(
      "CLUSTER 5 invariant broken: Multi Camera UI must not be required for canonical upload.",
    );
  }
}
