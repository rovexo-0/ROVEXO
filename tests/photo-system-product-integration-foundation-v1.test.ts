import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  PHOTO_SYSTEM_FORBIDDEN_FEATURE_IMPORTS,
  PHOTO_SYSTEM_PRODUCT_ENTRY_POINTS,
  PHOTO_SYSTEM_PRODUCT_INTEGRATION_FOUNDATION_V1,
  PHOTO_SYSTEM_PRODUCT_OWNERSHIP,
  assertPhotoSystemProductIntegrationFoundation,
  assertValidJpegBuffer,
  createProductPhotoSystem,
  listPhotoSystemProductIntegrationAdvisories,
} from "@/lib/product-integration/photo-system-integration-foundation-v1";
import { SMART_MULTI_CAMERA_SESSION_V1 } from "@/lib/media/smart-multi-camera-session-v1";
import { SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_CERTIFICATION_V1 } from "@/lib/media/smart-mobile-image-pipeline/integration-certification-v1";
import { isValidJpegSoi } from "@/lib/media/smart-mobile-image-pipeline/jpeg-guards-v1";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function walkFiles(dir: string, out: string[] = []): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return out;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walkFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("Photo System Product Integration Foundation — Phase I", () => {
  it("exposes foundation SSOT and canonical flow", () => {
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_FOUNDATION_V1.phase).toBe(
      "PRODUCT_INTEGRATION_I_FOUNDATION",
    );
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_FOUNDATION_V1.certifiedLogicUntouchable).toBe(true);
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_FOUNDATION_V1.newPhotoLogicForbidden).toBe(true);
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_FOUNDATION_V1.uiRedesignForbidden).toBe(true);
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_FOUNDATION_V1.canonicalFlow).toEqual([
      "USER",
      "SELECT_CAMERA_OR_GALLERY",
      "SMART_MULTI_CAMERA_SESSION",
      "SMART_MOBILE_IMAGE_PIPELINE",
      "PRODUCT_INTEGRATION_LAYER",
      "LISTING_DRAFT",
      "PUBLISH",
    ]);
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_FOUNDATION_V1.integrationContracts).toHaveLength(4);
  });

  it("registers one canonical Sell host path for listing photos", () => {
    expect(PHOTO_SYSTEM_PRODUCT_ENTRY_POINTS.sellPage.role).toBe("CANONICAL_PRODUCT_HOST");
    expect(PHOTO_SYSTEM_PRODUCT_ENTRY_POINTS.editListing.role).toBe(
      "CANONICAL_PRODUCT_HOST_VIA_SELL",
    );
    expect(PHOTO_SYSTEM_PRODUCT_ENTRY_POINTS.editListing.reuses).toBe("SellPage");
    expect(PHOTO_SYSTEM_PRODUCT_ENTRY_POINTS.cameraStubRoutes.role).toBe(
      "REDIRECT_ONLY_NON_CANONICAL",
    );
  });

  it("preserves single ownership — certified engines own domains", () => {
    expect(PHOTO_SYSTEM_PRODUCT_OWNERSHIP.photoSession).toContain("SmartMultiCameraSession");
    expect(PHOTO_SYSTEM_PRODUCT_OWNERSHIP.imageValidation).toContain(
      "SmartMobileImageValidationEngine",
    );
    expect(PHOTO_SYSTEM_PRODUCT_OWNERSHIP.imageNormalization).toContain(
      "SmartMobileImageNormalizationEngine",
    );
    expect(PHOTO_SYSTEM_PRODUCT_OWNERSHIP.imageMetadata).toContain(
      "SmartMobileImageMetadataEngine",
    );
    expect(PHOTO_SYSTEM_PRODUCT_OWNERSHIP.productIntegrationLayer).toContain(
      "PhotoSystemProductIntegration",
    );
  });

  it("creates ONE product photo system from certified factories only", () => {
    const system = createProductPhotoSystem();
    expect(system.cameraSession.sessionEngine).toBeTruthy();
    expect(system.imagePipeline.validationEngine).toBeTruthy();
    expect(system.pipelineComposition.getEngines()).toBe(system.imagePipeline);
  });

  it("foundation assertion passes; Phase II removes legacy Sell bypass advisory", () => {
    const result = assertPhotoSystemProductIntegrationFoundation();
    expect(result.ok).toBe(true);
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_FOUNDATION_V1.status).toBe("CERTIFIED");
    const advisories = listPhotoSystemProductIntegrationAdvisories();
    expect(advisories.some((a) => a.code === "LEGACY_SELL_BYPASS")).toBe(false);
  });

  it("features/sell does not directly own validation/normalization/metadata engines", () => {
    const sellFiles = walkFiles(path.join(process.cwd(), "features/sell"));
    for (const file of sellFiles) {
      const source = readFileSync(file, "utf8");
      for (const forbidden of PHOTO_SYSTEM_FORBIDDEN_FEATURE_IMPORTS) {
        expect(source).not.toContain(forbidden);
      }
    }
  });

  it("upload route uses product integration JPEG guard entry (no behaviour change)", () => {
    const route = readSource("app/api/listings/upload/route.ts");
    expect(route).toContain("assertValidJpegBuffer");
    expect(route).toContain("photo-system-integration-foundation-v1");
    const valid = Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x04]);
    expect(isValidJpegSoi(valid)).toBe(true);
    expect(() => assertValidJpegBuffer(valid, "ok")).not.toThrow();
  });

  it("regression: certified logic modules remain certified / UI gate active", () => {
    expect(SMART_MULTI_CAMERA_SESSION_V1.uiGate).toBe("ACTIVE");
    expect(SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_CERTIFICATION_V1.logicModuleIntegration).toBe(
      "CERTIFIED",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_CERTIFICATION_V1.productUiStatus).toBe(
      "CERTIFIED",
    );
  });
});
