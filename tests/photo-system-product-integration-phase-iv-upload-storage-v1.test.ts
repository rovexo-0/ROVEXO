/**
 * Product Integration Phase IV — Upload & Storage canonical orchestration.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_IV_V1,
  PHOTO_SYSTEM_PRODUCT_OWNERSHIP,
  PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_II_V1,
  PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_III_V1,
  prepareSellListingUpload,
  uploadSellListingPhoto,
  deleteSellListingPhoto,
  loadSellDraftPhotosViaProductIntegration,
  saveSellDraftPhotosViaProductIntegration,
  clearSellDraftPhotosViaProductIntegration,
} from "@/lib/product-integration";
import { certifySmartMobileImagePipelineLogicModule } from "@/lib/media/smart-mobile-image-pipeline/integration-certification-v1";
import { SMART_MULTI_CAMERA_SESSION_V1 } from "@/lib/media/smart-multi-camera-session-v1";
import * as uploadClient from "@/lib/listings/upload-client";
import * as clientImages from "@/lib/storage/client-images";

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

describe("Photo System Product Integration — Phase IV Upload & Storage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes Phase IV SSOT and ownership", () => {
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_IV_V1.status).toBe("IMPLEMENTATION");
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_IV_V1.uploadProtocolRewriteForbidden).toBe(true);
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_IV_V1.storageBackendRewriteForbidden).toBe(true);
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_IV_V1.canonicalFlow).toEqual([
      "CAMERA_OR_GALLERY",
      "PRODUCT_INTEGRATION",
      "SMART_MULTI_CAMERA_SESSION",
      "SMART_MOBILE_IMAGE_PIPELINE",
      "DRAFT",
      "UPLOAD_PREPARATION",
      "UPLOAD_CLIENT",
      "STORAGE",
      "PUBLISH",
    ]);
    expect(PHOTO_SYSTEM_PRODUCT_OWNERSHIP.uploadOrchestration).toContain("UPLOAD_ORCHESTRATION");
    expect(PHOTO_SYSTEM_PRODUCT_OWNERSHIP.uploadClientTransport).toContain("TRANSPORT_ONLY");
    expect(PHOTO_SYSTEM_PRODUCT_OWNERSHIP.sellStorageEngineCompat).toContain("DELEGATE_ONLY");
  });

  it("upload preparation skips full-image recompress when already pipeline-prepared", async () => {
    const file = new File([Uint8Array.from([1, 2, 3])], "ready.jpg", { type: "image/jpeg" });
    const thumb = new File([Uint8Array.from([4])], "thumb.jpg", { type: "image/jpeg" });
    const compressSpy = vi
      .spyOn(clientImages, "compressListingImage")
      .mockResolvedValue(file);
    const thumbSpy = vi
      .spyOn(clientImages, "createListingThumbnail")
      .mockResolvedValue(thumb);

    const prepared = await prepareSellListingUpload(file, { alreadyPipelinePrepared: true });
    expect(compressSpy).not.toHaveBeenCalled();
    expect(thumbSpy).toHaveBeenCalledTimes(1);
    expect(prepared.file).toBe(file);
    expect(prepared.thumbnail).toBe(thumb);
  });

  it("upload orchestration uses prepared transport (no duplicate full compress)", async () => {
    const file = new File([Uint8Array.from([1, 2, 3])], "ready.jpg", { type: "image/jpeg" });
    const thumb = new File([Uint8Array.from([4])], "thumb.jpg", { type: "image/jpeg" });
    vi.spyOn(clientImages, "createListingThumbnail").mockResolvedValue(thumb);
    const compressSpy = vi.spyOn(clientImages, "compressListingImage");
    const transportSpy = vi.spyOn(uploadClient, "uploadPreparedListingImage").mockResolvedValue({
      url: "https://cdn.example/a.jpg",
      thumbnailUrl: "https://cdn.example/a-thumb.jpg",
      storagePath: "path/a.jpg",
      thumbnailStoragePath: "path/a-thumb.jpg",
      sessionId: "session-1",
    });

    const result = await uploadSellListingPhoto({
      file,
      sessionId: "session-1",
      alreadyPipelinePrepared: true,
    });

    expect(compressSpy).not.toHaveBeenCalled();
    expect(transportSpy).toHaveBeenCalledTimes(1);
    expect(transportSpy.mock.calls[0]?.[0].file).toBe(file);
    expect(transportSpy.mock.calls[0]?.[0].thumbnail).toBe(thumb);
    expect(result.storagePath).toBe("path/a.jpg");
  });

  it("delete orchestration delegates to upload-client transport", async () => {
    const deleteSpy = vi.spyOn(uploadClient, "deleteListingImage").mockResolvedValue(undefined);
    await deleteSellListingPhoto({ storagePath: "path/a.jpg", thumbnailStoragePath: "path/t.jpg" });
    expect(deleteSpy).toHaveBeenCalledWith({
      storagePath: "path/a.jpg",
      thumbnailStoragePath: "path/t.jpg",
    });
  });

  it("draft storage orchestration APIs exist and are callable", async () => {
    expect(typeof loadSellDraftPhotosViaProductIntegration).toBe("function");
    expect(typeof saveSellDraftPhotosViaProductIntegration).toBe("function");
    expect(typeof clearSellDraftPhotosViaProductIntegration).toBe("function");
    await expect(clearSellDraftPhotosViaProductIntegration()).resolves.toBeUndefined();
  });

  it("Sell feature surfaces never import upload-client or storage-engine or draft-photo-storage directly", () => {
    const provider = readSource("features/sell/context/SellProvider.tsx");
    expect(provider).toContain("uploadSellListingPhoto");
    expect(provider).toContain("deleteSellListingPhoto");
    expect(provider).toContain("loadSellDraftPhotosViaProductIntegration");
    expect(provider).not.toContain("@/lib/sell/storage-engine");
    expect(provider).not.toContain("@/lib/listings/upload-client");
    expect(provider).not.toContain("@/lib/sell/draft-photo-storage");

    const page = readSource("features/sell/ui/SellPage.tsx");
    expect(page).not.toContain("@/lib/sell/draft-photo-storage");
    expect(page).not.toContain("@/lib/listings/upload-client");

    // Draft clear is owned by Product Integration via draft-storage / new-listing-session
    // (SellPage hosts SellProvider only — never clears drafts directly).
    const draftStorage = readSource("lib/sell/draft-storage.ts");
    expect(draftStorage).toContain("clearSellDraftPhotosViaProductIntegration");
    expect(provider).toContain("clearSellDraft");

    for (const file of walkFiles(path.join(process.cwd(), "features/sell"))) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/from ["']@\/lib\/listings\/upload-client["']/);
      expect(source).not.toMatch(/from ["']@\/lib\/sell\/storage-engine["']/);
      expect(source).not.toMatch(/from ["']@\/lib\/sell\/draft-photo-storage["']/);
    }

    const appSell = walkFiles(path.join(process.cwd(), "app/sell"));
    for (const file of appSell) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/from ["']@\/lib\/listings\/upload-client["']/);
      expect(source).not.toMatch(/from ["']@\/lib\/sell\/storage-engine["']/);
    }
  });

  it("upload-client exposes prepared transport; storage-engine is delegate-only", () => {
    const client = readSource("lib/listings/upload-client.ts");
    expect(client).toContain("uploadPreparedListingImage");
    expect(client).toContain("Transport");

    const engine = readSource("lib/sell/storage-engine.ts");
    expect(engine).toContain("DELEGATE ONLY");
    expect(engine).toContain("upload-storage-orchestration-v1");
  });

  it("upload route protocol unchanged (file + thumbnail FormData)", () => {
    const route = readSource("app/api/listings/upload/route.ts");
    expect(route).toContain('formData.get("file")');
    expect(route).toContain('formData.get("thumbnail")');
    expect(route).toContain("assertValidJpegBuffer");
  });

  it("regression: Phases I–III + certified engines", () => {
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_II_V1.status).toBe("IMPLEMENTATION");
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_III_V1.status).toBe("IMPLEMENTATION");
    expect(SMART_MULTI_CAMERA_SESSION_V1.uiGate).toBe("ACTIVE");
    expect(certifySmartMobileImagePipelineLogicModule().ok).toBe(true);
  });
});
