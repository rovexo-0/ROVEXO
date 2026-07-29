/**
 * ROVEXO Smart Multi Camera Session v1.0
 *
 * STATUS: PHASE I SESSION ENGINE CERTIFIED · READY FOR PHASE II (LOGIC ONLY)
 *
 * Owner master image:
 *   docs/modules/smart-multi-camera-session/assets/smart-multi-camera-session-v1-owner-master.png
 *
 * Docs:
 *   docs/modules/smart-multi-camera-session/MASTER_ENGINEERING_SPECIFICATION.md
 *   docs/modules/smart-multi-camera-session/MASTER_UI_SPECIFICATION.md
 *
 * Absolute equation:
 *   ONE CAMERA SESSION · ONE PHOTO RAIL · ONE NEXT · ONE UPLOAD · ONE RETURN TO SELL
 *
 * UI GATE: ACTIVE — UI / camera preview / Sell wiring blocked until
 * Smart Mobile Image Pipeline finalStatus === CERTIFIED.
 */

import { SMART_MOBILE_IMAGE_PIPELINE_V1 } from "@/lib/media/smart-mobile-image-pipeline-v1";

export const SMART_MULTI_CAMERA_SESSION_V1 = {
  version: "1.0",
  id: "smart-multi-camera-session-v1",
  status: "PHASE_I_IX_LOGIC_INTEGRATION_CERTIFIED_UI_GATE_ACTIVE",
  pageStatus: "REVIEW",
  implementationGate: "SMART_MOBILE_IMAGE_PIPELINE_CERTIFIED",
  uiGate: "ACTIVE",
  phaseISessionEngine: {
    status: "CERTIFIED",
    ssot: "PASS",
    typescript: "PASS",
    eslint: "PASS",
    build: "PASS",
    unitTests: "14/14 PASS",
    architecture: "PASS",
    module: "lib/media/smart-multi-camera-session/session-engine-v1.ts",
    surface: "lib/media/smart-multi-camera-session/index.ts",
  } as const,
  phaseIILogicLayer: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "CAMERA_CONTROLLER",
    module: "lib/media/smart-multi-camera-session/camera-controller-v1.ts",
    uiForbidden: true,
    hardwareForbidden: true,
  } as const,
  phaseIIICaptureCoordinator: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "CAPTURE_COORDINATOR",
    module: "lib/media/smart-multi-camera-session/capture-coordinator-v1.ts",
    uiForbidden: true,
    hardwareForbidden: true,
  } as const,
  phaseIVPhotoCollectionEngine: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "PHOTO_COLLECTION_ENGINE",
    module: "lib/media/smart-multi-camera-session/photo-collection-engine-v1.ts",
    uiForbidden: true,
    hardwareForbidden: true,
    uploadForbidden: true,
  } as const,
  phaseVUploadQueue: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "UPLOAD_QUEUE",
    module: "lib/media/smart-multi-camera-session/upload-queue-engine-v1.ts",
    uiForbidden: true,
    networkForbidden: true,
    httpForbidden: true,
    storageForbidden: true,
  } as const,
  phaseVIRecoveryEngine: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "RECOVERY_ENGINE",
    module: "lib/media/smart-multi-camera-session/recovery-engine-v1.ts",
    uiForbidden: true,
    networkForbidden: true,
    inventsDataForbidden: true,
  } as const,
  phaseVIIPerformanceValidation: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "PERFORMANCE_VALIDATION",
    module: "lib/media/smart-multi-camera-session/performance-validation-v1.ts",
    behaviouralChangesForbidden: true,
    publicContractChangesForbidden: true,
  } as const,
  phaseVIIISsotConsolidation: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "SSOT_CONSOLIDATION",
    module: "lib/media/smart-multi-camera-session/ssot-consolidation-v1.ts",
    behaviouralChangesForbidden: true,
    publicApiRemovalsForbidden: true,
  } as const,
  phaseIXIntegrationCertification: {
    status: "CERTIFIED",
    scope: "LOGIC_LAYER_ONLY",
    component: "INTEGRATION_CERTIFICATION",
    module: "lib/media/smart-multi-camera-session/integration-certification-v1.ts",
    behaviouralChangesForbidden: true,
    featureAdditionsForbidden: true,
    uiForbidden: true,
  } as const,
  ownerMasterImage:
    "docs/modules/smart-multi-camera-session/assets/smart-multi-camera-session-v1-owner-master.png",

  mission: [
    "ONE CAMERA SESSION",
    "CAPTURE MULTIPLE PHOTOS",
    "EDIT BEFORE LEAVING CAMERA",
    "ONE CONFIRMATION",
    "ONE UPLOAD",
    "RETURN TO SELL",
  ] as const,

  absoluteLaw: [
    "ONE CAMERA SESSION",
    "ONE PHOTO RAIL",
    "ONE NEXT BUTTON",
    "ONE UPLOAD",
    "ONE RETURN TO SELL",
  ] as const,

  primaryGoal: "SELLER_NEVER_LEAVES_CAMERA_AFTER_EVERY_PHOTO",
  cameraRemainsOpenUntil: ["NEXT", "CLOSE"] as const,

  sessionFlow: [
    "SELL",
    "Take Photos",
    "Smart Multi Camera Session opens",
    "Take Photo",
    "Thumbnail appears instantly",
    "Take Next Photo",
    "Thumbnail appears",
    "Repeat",
    "Delete if needed",
    "Reorder if needed",
    "NEXT",
    "Upload starts (complete session)",
    "Return to Sell Page",
  ] as const,

  uiLayout: {
    topBar: ["Close", "Flash", "Switch Camera", "Next"] as const,
    body: "FULL_SCREEN_LIVE_CAMERA_PREVIEW",
    photoThumbnailRail: ["Photo…", "Add More"] as const,
    bottom: "BIG_SHUTTER_BUTTON",
  } as const,

  designRules: {
    noCounter: true,
    noPopups: true,
    noConfirmDialogs: true,
    noUploadAfterEveryPhoto: true,
    noEmptySlots: true,
    noPageRefresh: true,
    noLeavingCameraMidCaptureLoop: true,
    noDuplicateUploads: true,
  } as const,

  photoLimit: {
    minimum: 1,
    maximum: 8,
  } as const,

  maxPhotos: 8,
  minPhotos: 1,

  thumbnailRail: {
    instantPreview: true,
    deleteX: true,
    coverIndicatorFirstPhoto: true,
    coverStyle: "PURPLE_BORDER_FIRST_THUMBNAIL",
    addMoreSlot: true,
    smoothAnimation: true,
    showCountAndCapacity: false,
  } as const,

  deleteUx: {
    inheritsPhotoDeleteUxV1: true,
    tapX: true,
    removeImmediately: true,
    slideLeftAnimation: true,
    noConfirmation: true,
    noBlankSpace: true,
    memoryReleased: true,
    cancelledUploadRemoved: true,
  } as const,

  reorder: {
    pressAndHold: true,
    drag: true,
    drop: true,
    orderUpdatesInstantly: true,
    firstPhotoBecomesCover: true,
  } as const,

  nextButton: {
    neverUploadsOneImage: true,
    uploadsCompleteSessionOnly: true,
    label: "Next",
    colour: "ROVEXO_PURPLE",
  } as const,

  uploadEngine: [
    "NEXT",
    "Validate Session",
    "Compress",
    "Prepare Upload Queue",
    "Parallel Upload",
    "Storage Validation",
    "Database Update",
    "Return Success",
    "Back To Sell",
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

  failClosed: {
    remainOnSessionIfUploadFails: true,
    nothingLost: true,
    retryAvailable: true,
    noPartialPublish: true,
  } as const,

  performance: {
    animationTargetFps: 60,
    instantThumbnail: true,
    lowMemoryUsage: true,
    blobCleanup: true,
    cancelledUploadCleanup: true,
    backgroundProcessing: true,
  } as const,

  compatibility: {
    androidNative: "PASS_REQUIRED",
    iphoneNative: "PASS_REQUIRED",
    responsive: "PASS_REQUIRED",
  } as const,

  /** Session uses device camera stream inside ROVEXO chrome matching Owner master image. */
  platformLaw: {
    continuousInAppCameraSession: true,
    ownerMasterUiIsSourceOfTruth: true,
    neverForceLeaveCameraPerPhoto: true,
    webAndPwa: "BEST_DEVICE_CAMERA_AVAILABLE",
  } as const,

  forbiddenFlow: [
    "Take Photo",
    "Return To ROVEXO",
    "Upload",
    "Take Photo",
    "Return To ROVEXO",
    "Upload",
    "Repeat per photo",
  ] as const,

  implementationOrder: [
    "1 MASTER ENGINEERING SPEC → LOCKED (this COD)",
    "2 MASTER UI SPEC → Owner visual lock (master image)",
    "3 SMART_MOBILE_IMAGE_PIPELINE → CERTIFIED",
    "4 SMART_MULTI_CAMERA_SESSION → IMPLEMENTATION AUTHORIZED",
    "5 ANDROID CERTIFICATION → PASS",
    "6 IPHONE CERTIFICATION → PASS",
    "7 OWNER CERTIFICATION → PASS",
    "8 ROVEXO PHOTO EXPERIENCE → CERTIFIED",
  ] as const,

  certificationGates: [
    "TypeScript",
    "ESLint",
    "Tests",
    "Production Build",
    "Production Deploy",
    "Android Validation",
    "iPhone Validation",
    "Owner Certification",
  ] as const,

  certification: {
    masterEngineeringSpec: "LOCKED",
    masterUiSpec: "AWAITING_OWNER_APPROVAL",
    phaseISessionEngine: "CERTIFIED",
    phaseIICameraController: "CERTIFIED",
    phaseIIICaptureCoordinator: "CERTIFIED",
    phaseIVPhotoCollectionEngine: "CERTIFIED",
    phaseVUploadQueue: "CERTIFIED",
    phaseVIRecoveryEngine: "CERTIFIED",
    phaseVIIPerformanceValidation: "CERTIFIED",
    phaseVIIISsotConsolidation: "CERTIFIED",
    phaseIXIntegrationCertification: "CERTIFIED",
    logicModuleIntegration: "CERTIFIED",
    cameraOpens: "NOT CERTIFIED",
    oneContinuousSession: "NOT CERTIFIED",
    maxEightPhotos: "NOT CERTIFIED",
    bottomThumbnailStrip: "NOT CERTIFIED",
    delete: "NOT CERTIFIED",
    reorder: "NOT CERTIFIED",
    coverSelection: "NOT CERTIFIED",
    nextCompleteSessionUpload: "NOT CERTIFIED",
    oneUploadSession: "NOT CERTIFIED",
    parallelUpload: "NOT CERTIFIED",
    failClosedRetry: "NOT CERTIFIED",
    sellPreview: "NOT CERTIFIED",
    android: "NOT CERTIFIED",
    iphone: "NOT CERTIFIED",
    finalStatus: "NOT CERTIFIED",
  } as const,
} as const;

/**
 * UI / camera / preview / Sell wiring gate.
 * Phase I Session Engine is authorized separately (pure business logic).
 */
export function isSmartMultiCameraSessionUiImplementationAuthorized(): boolean {
  return SMART_MOBILE_IMAGE_PIPELINE_V1.certification.finalStatus === "CERTIFIED";
}

/** @deprecated Prefer isSmartMultiCameraSessionUiImplementationAuthorized */
export function isSmartMultiCameraSessionImplementationAuthorized(): boolean {
  return isSmartMultiCameraSessionUiImplementationAuthorized();
}

export function assertSmartMultiCameraSessionUiImplementationGate(): void {
  if (!isSmartMultiCameraSessionUiImplementationAuthorized()) {
    throw new Error(
      "SMART MULTI CAMERA SESSION UI BLOCKED — Smart Mobile Image Pipeline must be CERTIFIED first (Owner Production device PASS). Phase I Session Engine is allowed; NO UI / CAMERA / SELL IMPLEMENTATION until gate PASS.",
    );
  }
}

/** @deprecated Prefer assertSmartMultiCameraSessionUiImplementationGate */
export function assertSmartMultiCameraSessionImplementationGate(): void {
  assertSmartMultiCameraSessionUiImplementationGate();
}
