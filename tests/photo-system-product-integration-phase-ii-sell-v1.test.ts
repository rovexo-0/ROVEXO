/**
 * Product Integration Phase II — Sell canonical photo intake.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  PHOTO_SYSTEM_FORBIDDEN_FEATURE_IMPORTS,
  PHOTO_SYSTEM_PRODUCT_INTEGRATION_FOUNDATION_V1,
  PHOTO_SYSTEM_PRODUCT_OWNERSHIP,
  assertPhotoSystemProductIntegrationFoundation,
  listPhotoSystemProductIntegrationAdvisories,
} from "@/lib/product-integration/photo-system-integration-foundation-v1";
import {
  PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_II_V1,
  createSellProductPhotoSystem,
  intakeSellGalleryPhoto,
  prepareProductPhotoCameraSession,
  projectMetadataRecordToSellDraft,
} from "@/lib/product-integration";
import { createMetadataRecord } from "@/lib/media/smart-mobile-image-pipeline/metadata-engine-v1";
import { certifySmartMobileImagePipelineLogicModule } from "@/lib/media/smart-mobile-image-pipeline/integration-certification-v1";
import { SMART_MULTI_CAMERA_SESSION_V1 } from "@/lib/media/smart-multi-camera-session-v1";

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

function minimalJpegFile(name = "sell-photo.jpg"): File {
  const bytes = Uint8Array.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
    0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
    0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x40,
    0x00, 0x40, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xff, 0xda, 0x00, 0x08,
    0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x7f, 0xaa, 0xff, 0xd9,
  ]);
  return new File([bytes], name, { type: "image/jpeg" });
}

describe("Photo System Product Integration — Phase II Sell canonical", () => {
  it("marks Phase I CERTIFIED and Phase II IMPLEMENTATION", () => {
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_FOUNDATION_V1.status).toBe("CERTIFIED");
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_II_V1.parentStatus).toBe("CERTIFIED");
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_II_V1.status).toBe("IMPLEMENTATION");
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_II_V1.canonicalFlow).toEqual([
      "USER",
      "GALLERY_OR_CAMERA",
      "PRODUCT_INTEGRATION",
      "SMART_MULTI_CAMERA_SESSION",
      "SMART_MOBILE_IMAGE_PIPELINE",
      "DRAFT_ENGINE",
      "PUBLISH_PREPARATION",
    ]);
  });

  it("foundation passes with zero legacy Sell bypass advisories", () => {
    expect(assertPhotoSystemProductIntegrationFoundation().ok).toBe(true);
    expect(listPhotoSystemProductIntegrationAdvisories()).toEqual([]);
    expect(PHOTO_SYSTEM_PRODUCT_OWNERSHIP.sellPhotoIntake).toContain("CANONICAL_SELL_INTAKE");
    expect(PHOTO_SYSTEM_PRODUCT_OWNERSHIP.imageMetadata).toContain(
      "SmartMobileImageMetadataEngine",
    );
  });

  it("SellProvider never imports client-images validate/compress or engine internals", () => {
    const provider = readSource("features/sell/context/SellProvider.tsx");
    expect(provider).not.toContain("@/lib/storage/client-images");
    expect(provider).not.toContain("validateClientImage");
    expect(provider).not.toContain("compressListingImage");
    expect(provider).not.toContain("createListingThumbnail");
    expect(provider).toContain("intakeSellPhotoFromCanonicalEntry");
    expect(provider).toContain("@/lib/product-integration");

    const sellFiles = walkFiles(path.join(process.cwd(), "features/sell"));
    for (const file of sellFiles) {
      const source = readFileSync(file, "utf8");
      for (const forbidden of PHOTO_SYSTEM_FORBIDDEN_FEATURE_IMPORTS) {
        expect(source).not.toContain(forbidden);
      }
      expect(source).not.toMatch(/from ["']@\/lib\/storage\/client-images["']/);
    }
  });

  it("photo-metadata is delegate-only — projects Metadata Engine records", () => {
    const source = readSource("lib/sell/photo-metadata.ts");
    expect(source).toContain("DELEGATE ONLY");
    expect(source).toContain("projectMetadataRecordToSellDraft");
    expect(source).not.toContain("orientationFromDimensions");

    const record = createMetadataRecord({
      identifier: "meta-1",
      fingerprint: "fp-meta-1",
      width: 800,
      height: 600,
      orientation: 1,
      mimeType: "image/jpeg",
      extension: ".jpg",
      fileName: "a.jpg",
      fileSize: 12_000,
      timestamp: 1,
      format: "jpeg",
      at: 1,
    });
    expect(record).not.toBeNull();
    const projected = projectMetadataRecordToSellDraft(record!, null);
    expect(projected).toEqual({
      id: "meta-1",
      width: 800,
      height: 600,
      orientation: "landscape",
      dominantColour: null,
    });
  });

  it("camera entry preparation starts Multi Camera session without hardware", () => {
    const system = createSellProductPhotoSystem();
    const prepared = prepareProductPhotoCameraSession(system);
    expect(prepared.ok).toBe(true);
    expect(system.cameraSession.sessionEngine.getSnapshot().status).toBe("CAPTURING");
  });

  it("draft metadata comes from pipeline Metadata Engine after intake (when Image available)", async () => {
    const previousImage = globalThis.Image;
    class FakeImage {
      naturalWidth = 640;
      naturalHeight = 480;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    // @ts-expect-error test double for browser Image
    globalThis.Image = FakeImage;

    try {
      const system = createSellProductPhotoSystem();
      const result = await intakeSellGalleryPhoto(system, minimalJpegFile());
      if (!result.ok) {
        expect.fail(`intake failed: ${result.message}`);
      }
      expect(result.metadataRecord.metadata.identifier).toBe(result.photo.id);
      expect(result.draftMetadata.width).toBe(640);
      expect(result.draftMetadata.height).toBe(480);
      expect(result.draftMetadata.id).toBe(result.photo.id);
      expect(system.cameraSession.sessionEngine.getSnapshot().photos).toHaveLength(1);
      expect(system.pipelineComposition.getSnapshot().status).toBe("PIPELINE_READY");
    } finally {
      globalThis.Image = previousImage;
    }
  });

  it("edit listing host remains SellPage reuse (canonical flow)", () => {
    const editPage = readSource("app/(platform)/seller/listings/[id]/edit/page.tsx");
    expect(editPage).toMatch(/SellPage|sell/);
  });

  it("regression: certified Multi Camera + Image Pipeline logic untouched", () => {
    expect(SMART_MULTI_CAMERA_SESSION_V1.uiGate).toBe("ACTIVE");
    expect(certifySmartMobileImagePipelineLogicModule().ok).toBe(true);
  });
});
