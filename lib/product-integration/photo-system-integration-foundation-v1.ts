/**
 * ROVEXO Photo System — Product Integration Foundation v1.0
 *
 * PRODUCT INTEGRATION · PHASE I · COD SÂNGE
 *
 * Integrates CERTIFIED logic modules into product architecture.
 * NO new photo logic · NO certified-engine modifications · NO UI redesign.
 *
 * Canonical product path:
 *   User → Camera/Gallery → Smart Multi Camera Session
 *   → Smart Mobile Image Pipeline → Product Integration Layer
 *   → Listing Draft → Publish
 */

import {
  SMART_MULTI_CAMERA_SESSION_V1,
} from "@/lib/media/smart-multi-camera-session-v1";
import {
  createIntegratedSmartMultiCameraSession,
  type IntegratedSmartMultiCameraSession,
} from "@/lib/media/smart-multi-camera-session/integration-certification-v1";
import {
  assertValidJpegBuffer,
  isUtf8CorruptedJpeg,
  isValidJpegSoi,
} from "@/lib/media/smart-mobile-image-pipeline/jpeg-guards-v1";
import {
  createIntegratedSmartMobileImagePipeline,
  createSmartMobileImagePipelineComposition,
  type IntegratedSmartMobileImagePipeline,
  SmartMobileImagePipelineComposition,
} from "@/lib/media/smart-mobile-image-pipeline/pipeline-integration-v1";
import {
  certifySmartMobileImagePipelineLogicModule,
} from "@/lib/media/smart-mobile-image-pipeline/integration-certification-v1";

export const PHOTO_SYSTEM_PRODUCT_INTEGRATION_FOUNDATION_V1 = {
  version: "1.0",
  id: "photo-system-product-integration-foundation-v1",
  phase: "PRODUCT_INTEGRATION_I_FOUNDATION",
  status: "CERTIFIED",
  scope: "PRODUCT_ARCHITECTURE_ONLY",
  certifiedLogicUntouchable: true,
  newPhotoLogicForbidden: true,
  uiRedesignForbidden: true,
  cameraImplementationForbidden: true,
  uploadImplementationForbidden: true,
  storageImplementationForbidden: true,
  networkImplementationForbidden: true,
  businessLogicChangesForbidden: true,
  uiGate: "ACTIVE",
  productUiStatus: "CERTIFIED",
  certifiedModules: {
    smartMultiCameraSession: "LOGIC_LAYER_CERTIFIED",
    smartMobileImagePipeline: "LOGIC_LAYER_CERTIFIED",
  } as const,
  canonicalFlow: [
    "USER",
    "SELECT_CAMERA_OR_GALLERY",
    "SMART_MULTI_CAMERA_SESSION",
    "SMART_MOBILE_IMAGE_PIPELINE",
    "PRODUCT_INTEGRATION_LAYER",
    "LISTING_DRAFT",
    "PUBLISH",
  ] as const,
  integrationContracts: [
    "Sell Page → Photo Session",
    "Photo Session → Pipeline",
    "Pipeline → Draft",
    "Draft → Publish",
  ] as const,
} as const;

/**
 * Product entry points that create or edit listing photos.
 * Exactly one canonical host path; others are documented for migration.
 */
export const PHOTO_SYSTEM_PRODUCT_ENTRY_POINTS = {
  sellPage: {
    route: "/sell",
    host: "features/sell/ui/SellPage.tsx",
    photoRail: "features/sell/ui/SellPhotoRail.tsx",
    role: "CANONICAL_PRODUCT_HOST",
  },
  editListing: {
    route: "/seller/listings/[id]/edit",
    host: "app/(platform)/seller/listings/[id]/edit/page.tsx",
    reuses: "SellPage",
    role: "CANONICAL_PRODUCT_HOST_VIA_SELL",
  },
  sellCamera: {
    route: "/sell/camera",
    convergesTo: "/sell",
    role: "CAMERA_ENTRY_REDIRECT_TO_CANONICAL_HOST",
    ownership: "PRODUCT_INTEGRATION",
  },
  galleryPicker: {
    host: "features/sell/ui/SellPhotoFileInput.tsx",
    role: "GALLERY_ENTRY_VIA_PRODUCT_INTEGRATION",
    ownership: "PRODUCT_INTEGRATION",
  },
  draftRecovery: {
    storage: "lib/sell/draft-photo-storage.ts",
    engine: "lib/sell/draft-engine.ts",
    role: "DRAFT_PERSISTENCE_ONLY",
  },
  photoPreview: {
    host: "features/sell/ui/SellPhotoRail.tsx",
    role: "CANONICAL_PREVIEW_SURFACE",
  },
  publishFlow: {
    host: "features/sell/context/SellProvider.tsx",
    uploadApi: "app/api/listings/upload/route.ts",
    role: "PUBLISH_UPLOAD_SURFACE",
  },
  cameraStubRoutes: {
    routes: ["/sell/camera", "/sell/new"] as const,
    role: "REDIRECT_ONLY_NON_CANONICAL",
  },
} as const;

/**
 * Domain ownership for product integration (not engine internals).
 * Certified engines remain sole owners of their domains.
 */
export const PHOTO_SYSTEM_PRODUCT_OWNERSHIP = {
  photoSession: "SmartMultiCameraSession (LOGIC CERTIFIED)",
  imageValidation: "SmartMobileImageValidationEngine (LOGIC CERTIFIED)",
  imageNormalization: "SmartMobileImageNormalizationEngine (LOGIC CERTIFIED)",
  imageMetadata: "SmartMobileImageMetadataEngine (LOGIC CERTIFIED)",
  imagePipelineComposition: "SmartMobileImagePipelineComposition (LOGIC CERTIFIED)",
  productIntegrationLayer: "PhotoSystemProductIntegration (THIS MODULE)",
  listingDraftPersistence: "lib/sell/draft-* (PRODUCT)",
  listingPublishUpload: "app/api/listings/upload (PRODUCT · JPEG guard via pipeline)",
  /** Phase II — Sell routes through Product Integration intake (no direct engine bypass). */
  sellPhotoIntake:
    "lib/product-integration/sell-photo-intake-v1.ts (CANONICAL_SELL_INTAKE)",
  sellPhotoMetadataProjection:
    "lib/product-integration/sell-photo-metadata-adapter-v1.ts (Metadata Engine projection only)",
  sellPhotoMetadataCompat:
    "lib/sell/photo-metadata.ts (DELEGATE_ONLY · no ownership)",
  /** Phase III — Camera / Gallery entry ownership. */
  sellPhotoSessionHost:
    "lib/product-integration/sell-photo-session-host-v1.ts (EXACTLY_ONE_ACTIVE_SESSION)",
  cameraGalleryCanonicalEntry:
    "lib/product-integration/camera-gallery-canonical-entry-v1.ts (CANONICAL_CAMERA_GALLERY_ENTRY)",
  /** Phase IV — Upload / Storage orchestration. */
  uploadOrchestration:
    "lib/product-integration/upload-storage-orchestration-v1.ts (UPLOAD_ORCHESTRATION)",
  storageOrchestration:
    "lib/product-integration/upload-storage-orchestration-v1.ts (STORAGE_ORCHESTRATION)",
  uploadClientTransport:
    "lib/listings/upload-client.ts (TRANSPORT_ONLY)",
  draftPhotoPersistence:
    "lib/sell/draft-photo-storage.ts (PERSISTENCE_ONLY · via Product Integration)",
  sellStorageEngineCompat:
    "lib/sell/storage-engine.ts (DELEGATE_ONLY · no ownership)",
  /** Phase V — End-to-end product certification. */
  productPhotoE2eCertification:
    "lib/product-integration/product-photo-system-e2e-certification-v1.ts (E2E_PRODUCT_CERTIFICATION)",
} as const;

/** Forbidden direct imports from product UI / feature hosts into engine internals. */
export const PHOTO_SYSTEM_FORBIDDEN_FEATURE_IMPORTS = [
  "lib/media/smart-mobile-image-pipeline/validation-engine-v1",
  "lib/media/smart-mobile-image-pipeline/normalization-engine-v1",
  "lib/media/smart-mobile-image-pipeline/metadata-engine-v1",
  "lib/media/smart-mobile-image-pipeline/pipeline-engine-v1",
  "lib/media/smart-multi-camera-session/session-engine-v1",
  "lib/media/smart-multi-camera-session/camera-controller-v1",
  "lib/media/smart-multi-camera-session/capture-coordinator-v1",
  "lib/media/smart-multi-camera-session/photo-collection-engine-v1",
  "lib/media/smart-multi-camera-session/upload-queue-engine-v1",
] as const;

export type ProductPhotoSystem = {
  readonly cameraSession: IntegratedSmartMultiCameraSession;
  readonly imagePipeline: IntegratedSmartMobileImagePipeline;
  readonly pipelineComposition: SmartMobileImagePipelineComposition;
};

/**
 * ONE canonical product composition factory.
 * Reuses certified factories only — no new photo logic.
 */
export function createProductPhotoSystem(): ProductPhotoSystem {
  const imagePipeline = createIntegratedSmartMobileImagePipeline();
  return {
    cameraSession: createIntegratedSmartMultiCameraSession(),
    imagePipeline,
    pipelineComposition: createSmartMobileImagePipelineComposition(imagePipeline),
  };
}

export type PhotoSystemProductIntegrationIssue = {
  code:
    | "CERTIFIED_LOGIC_NOT_READY"
    | "DUPLICATE_PRODUCT_FACTORY"
    | "MISSING_CANONICAL_FLOW"
    | "MISSING_CONTRACT"
    | "LEGACY_SELL_BYPASS"
    | "UI_GATE_INACTIVE_WHILE_PRODUCT_UNCERTIFIED";
  message: string;
};

export type PhotoSystemProductIntegrationResult =
  | { ok: true; issues: readonly [] }
  | { ok: false; issues: readonly PhotoSystemProductIntegrationIssue[] };

/**
 * Foundation verification — architecture only.
 * Does not modify Sell UI or certified engines.
 */
export function assertPhotoSystemProductIntegrationFoundation(): PhotoSystemProductIntegrationResult {
  const issues: PhotoSystemProductIntegrationIssue[] = [];

  if (SMART_MULTI_CAMERA_SESSION_V1.uiGate !== "ACTIVE") {
    issues.push({
      code: "UI_GATE_INACTIVE_WHILE_PRODUCT_UNCERTIFIED",
      message:
        "Multi Camera UI gate must remain ACTIVE until product photo integration is Owner-certified.",
    });
  }

  const pipelineLogic = certifySmartMobileImagePipelineLogicModule();
  if (!pipelineLogic.ok) {
    issues.push({
      code: "CERTIFIED_LOGIC_NOT_READY",
      message: "Smart Mobile Image Pipeline logic certification failed.",
    });
  }

  if (PHOTO_SYSTEM_PRODUCT_INTEGRATION_FOUNDATION_V1.canonicalFlow.length !== 7) {
    issues.push({
      code: "MISSING_CANONICAL_FLOW",
      message: "Canonical product photo flow must declare exactly seven stages.",
    });
  }

  if (PHOTO_SYSTEM_PRODUCT_INTEGRATION_FOUNDATION_V1.integrationContracts.length !== 4) {
    issues.push({
      code: "MISSING_CONTRACT",
      message: "Product integration must declare exactly four one-way contracts.",
    });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, issues: [] };
}

/**
 * Soft advisory issues.
 * Phase II removes Sell legacy bypass — advisories empty when intake is canonical.
 */
export function listPhotoSystemProductIntegrationAdvisories(): readonly PhotoSystemProductIntegrationIssue[] {
  if (!PHOTO_SYSTEM_PRODUCT_OWNERSHIP.sellPhotoIntake.includes("CANONICAL_SELL_INTAKE")) {
    return [
      {
        code: "LEGACY_SELL_BYPASS",
        message:
          "Sell must route photo intake through Product Integration (canonical).",
      },
    ];
  }
  return [];
}

/** Product-facing JPEG guards — single re-export from certified pipeline helpers. */
export {
  assertValidJpegBuffer,
  isUtf8CorruptedJpeg,
  isValidJpegSoi,
};
