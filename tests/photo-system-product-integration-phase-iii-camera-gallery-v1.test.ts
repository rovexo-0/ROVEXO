/**
 * Product Integration Phase III — Camera & Gallery canonical entry + session host.
 */

import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  PHOTO_SYSTEM_PRODUCT_ENTRY_POINTS,
  PHOTO_SYSTEM_PRODUCT_OWNERSHIP,
  PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_II_V1,
  PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_III_V1,
  SELL_PHOTO_CANONICAL_ENTRIES,
  acquireSellPhotoSession,
  assertSingleActiveSellPhotoSession,
  cancelSellPhotoSession,
  getActiveSellPhotoSessionOwnerId,
  intakeSellPhotoFromCanonicalEntry,
  prepareSellCameraEntry,
  prepareSellGalleryEntry,
  removeSellPhotoViaCanonicalEntry,
  reorderSellPhotosViaCanonicalEntry,
  resetSellPhotoSession,
  resumeSellDraftPhotosIntoSession,
  resumeSellPhotoSession,
} from "@/lib/product-integration";
import { certifySmartMobileImagePipelineLogicModule } from "@/lib/media/smart-mobile-image-pipeline/integration-certification-v1";
import { SMART_MULTI_CAMERA_SESSION_V1 } from "@/lib/media/smart-multi-camera-session-v1";
import type { SellPhoto } from "@/features/sell/types";

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

function minimalJpegFile(name = "phase-iii.jpg"): File {
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

function installFakeImage(): () => void {
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
  // @ts-expect-error test double
  globalThis.Image = FakeImage;
  return () => {
    globalThis.Image = previousImage;
  };
}

describe("Photo System Product Integration — Phase III Camera & Gallery", () => {
  beforeEach(() => {
    cancelSellPhotoSession();
  });

  it("exposes Phase III SSOT and verified entry points", () => {
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_III_V1.status).toBe("IMPLEMENTATION");
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_III_V1.libMediaModificationsForbidden).toBe(true);
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_III_V1.verifiedEntryPoints).toEqual([
      "sell_camera",
      "gallery_picker",
      "add_photo",
      "replace_photo",
      "edit_listing_photo",
    ]);
    expect(PHOTO_SYSTEM_PRODUCT_ENTRY_POINTS.sellCamera.ownership).toBe("PRODUCT_INTEGRATION");
    expect(PHOTO_SYSTEM_PRODUCT_ENTRY_POINTS.galleryPicker.ownership).toBe("PRODUCT_INTEGRATION");
    expect(PHOTO_SYSTEM_PRODUCT_OWNERSHIP.cameraGalleryCanonicalEntry).toContain(
      "CANONICAL_CAMERA_GALLERY_ENTRY",
    );
    expect(SELL_PHOTO_CANONICAL_ENTRIES.sellCamera.convergesTo).toBe("/sell");
  });

  it("camera entry prepares Multi Camera session without hardware", () => {
    const prepared = prepareSellCameraEntry("owner-camera");
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.system.cameraSession.sessionEngine.getSnapshot().status).toBe("CAPTURING");
    expect(getActiveSellPhotoSessionOwnerId()).toBe("owner-camera");
  });

  it("gallery entry uses the same Product Integration session path", () => {
    const prepared = prepareSellGalleryEntry("owner-gallery");
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(assertSingleActiveSellPhotoSession().ownerId).toBe("owner-gallery");
  });

  it("enforces exactly one active photo session across owners", () => {
    acquireSellPhotoSession("owner-a");
    expect(getActiveSellPhotoSessionOwnerId()).toBe("owner-a");
    acquireSellPhotoSession("owner-b");
    expect(getActiveSellPhotoSessionOwnerId()).toBe("owner-b");
    expect(assertSingleActiveSellPhotoSession().ok).toBe(true);
  });

  it("gallery intake and replace go through Session → Pipeline", async () => {
    const restore = installFakeImage();
    try {
      const added = await intakeSellPhotoFromCanonicalEntry({
        ownerId: "owner-intake",
        source: "gallery_picker",
        file: minimalJpegFile("a.jpg"),
      });
      expect(added.ok).toBe(true);
      if (!added.ok) return;

      const replaced = await intakeSellPhotoFromCanonicalEntry({
        ownerId: "owner-intake",
        source: "replace_photo",
        file: minimalJpegFile("b.jpg"),
        photoId: added.photo.id,
        replacePhotoId: added.photo.id,
      });
      expect(replaced.ok).toBe(true);
      if (!replaced.ok) return;
      expect(replaced.photo.id).toBe(added.photo.id);
      expect(replaced.metadataRecord.metadata.identifier).toBe(added.photo.id);
    } finally {
      restore();
    }
  });

  it("remove + reorder keep session/collection aligned", async () => {
    const restore = installFakeImage();
    try {
      const first = await intakeSellPhotoFromCanonicalEntry({
        ownerId: "owner-edit",
        source: "add_photo",
        file: minimalJpegFile("1.jpg"),
      });
      const second = await intakeSellPhotoFromCanonicalEntry({
        ownerId: "owner-edit",
        source: "add_photo",
        file: minimalJpegFile("2.jpg"),
      });
      expect(first.ok && second.ok).toBe(true);
      if (!first.ok || !second.ok) return;

      reorderSellPhotosViaCanonicalEntry("owner-edit", 0, 1);
      const system = acquireSellPhotoSession("owner-edit");
      expect(system.cameraSession.sessionEngine.getSnapshot().photos[0]?.photoId).toBe(
        second.photo.id,
      );

      removeSellPhotoViaCanonicalEntry("owner-edit", second.photo.id);
      expect(system.cameraSession.sessionEngine.getSnapshot().photos).toHaveLength(1);
      expect(system.cameraSession.photoCollection.getSnapshot().photos).toHaveLength(1);
    } finally {
      restore();
    }
  });

  it("draft restore resumes file-backed photos into the session", async () => {
    const restore = installFakeImage();
    try {
      const file = minimalJpegFile("restore.jpg");
      const photos: SellPhoto[] = [
        {
          id: "draft-photo-1",
          file,
          previewUrl: URL.createObjectURL(file),
          uploaded: false,
        },
      ];
      const result = await resumeSellDraftPhotosIntoSession("owner-restore", photos);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.resumed).toBe(1);
      const resumed = resumeSellPhotoSession("owner-restore");
      expect(resumed.ok).toBe(true);
      if (!resumed.ok) return;
      expect(resumed.system.cameraSession.sessionEngine.getSnapshot().photos[0]?.photoId).toBe(
        "draft-photo-1",
      );
    } finally {
      restore();
    }
  });

  it("session cancel clears active host; reset starts fresh for owner", () => {
    const prepared = prepareSellCameraEntry("owner-cancel");
    expect(prepared.ok).toBe(true);
    cancelSellPhotoSession();
    expect(getActiveSellPhotoSessionOwnerId()).toBeNull();

    const reset = resetSellPhotoSession("owner-reset");
    expect(reset.cameraSession.sessionEngine.getSnapshot().status).toBe("IDLE");
  });

  it("Sell entry points wire Product Integration — no client-images / no engine internals", () => {
    const provider = readSource("features/sell/context/SellProvider.tsx");
    expect(provider).toContain("intakeSellPhotoFromCanonicalEntry");
    expect(provider).toContain("prepareSellCameraEntry");
    expect(provider).toContain("resumeSellDraftPhotosIntoSession");
    expect(provider).toContain("cancelSellPhotoSession");
    expect(provider).not.toContain("@/lib/storage/client-images");
    expect(provider).not.toContain("validateClientImage");

    const fileInput = readSource("features/sell/ui/SellPhotoFileInput.tsx");
    expect(fileInput).toContain('data-product-integration-entry="gallery_picker"');

    const cameraPage = readSource("app/(platform)/sell/camera/page.tsx");
    expect(cameraPage).toContain('redirect("/sell")');
    expect(cameraPage).toContain("Product Integration");

    for (const file of walkFiles(path.join(process.cwd(), "features/sell"))) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/from ["']@\/lib\/storage\/client-images["']/);
      expect(source).not.toContain("lib/media/smart-mobile-image-pipeline/validation-engine-v1");
      expect(source).not.toContain("lib/media/smart-multi-camera-session/session-engine-v1");
    }
  });

  it("regression: Phase II intake remains; certified engines untouched / UI gate active", () => {
    expect(PHOTO_SYSTEM_PRODUCT_INTEGRATION_PHASE_II_V1.status).toBe("IMPLEMENTATION");
    expect(SMART_MULTI_CAMERA_SESSION_V1.uiGate).toBe("ACTIVE");
    expect(certifySmartMobileImagePipelineLogicModule().ok).toBe(true);
  });
});
