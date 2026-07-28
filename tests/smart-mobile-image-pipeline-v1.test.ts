import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  SMART_MOBILE_IMAGE_PIPELINE_V1,
  assertValidJpegBuffer,
  isUtf8CorruptedJpeg,
  isValidJpegSoi,
} from "@/lib/media/smart-mobile-image-pipeline-v1";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Smart Mobile Image Pipeline v1.0", () => {
  it("locks absolute surfaces and upload-after-done policy", () => {
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.status).toBe("PRODUCTION_BLOCKER");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.noCertificationUntilEveryStagePasses).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.previouslyCorruptedImagesMustBeReUploaded).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.certification.finalStatus).toBe("NOT CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.uploadPolicy.uploadOnlyAfterNextOrDone).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.uploadPolicy.neverUploadAfterEachCapture).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.cameraSession.oneSessionMultiplePhotos).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.localhostAloneForbidden).toBe(true);
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.confirmedRootCauses).toContain(
      "STORAGE_OBJECT_UTF8_CORRUPTED_JPEG",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.confirmedRootCauses).toContain(
      "NEXT_IMAGE_QUALITY_92_NOT_ALLOWLISTED",
    );
  });

  it("detects valid JPEG SOI vs UTF-8 corruption (Production evidence pattern)", () => {
    const valid = Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x04]);
    const corrupt = Uint8Array.from([
      0xef, 0xbf, 0xbd, 0xef, 0xbf, 0xbd, 0xef, 0xbf, 0xbd, 0xef, 0xbf, 0xbd, 0x00, 0x43, 0x00, 0x04,
    ]);
    expect(isValidJpegSoi(valid)).toBe(true);
    expect(isUtf8CorruptedJpeg(valid)).toBe(false);
    expect(isValidJpegSoi(corrupt)).toBe(false);
    expect(isUtf8CorruptedJpeg(corrupt)).toBe(true);
    expect(() => assertValidJpegBuffer(valid, "ok")).not.toThrow();
    expect(() => assertValidJpegBuffer(corrupt, "bad")).toThrow(/corrupted/i);
  });

  it("upload route fail-closes on invalid JPEG and uploads Blob not raw Buffer", () => {
    const route = readSource("app/api/listings/upload/route.ts");
    expect(route).toContain("assertValidJpegBuffer");
    expect(route).toContain("new Blob([new Uint8Array(fullBuffer)]");
    expect(route).toContain("new Blob([new Uint8Array(thumbnailBuffer)]");
    expect(route).not.toMatch(/\.upload\(\s*fullPath,\s*fullBuffer\s*,/);
  });

  it("Product Gallery quality is within Next images.qualities allowlist", () => {
    const gallery = readSource("features/product-detail/ProductGalleryV1.tsx");
    const nextConfig = readSource("next.config.ts");
    expect(nextConfig).toContain("qualities: [75, 90]");
    expect(gallery).toContain("quality={90}");
    expect(gallery).not.toContain("quality={92}");
  });
});
