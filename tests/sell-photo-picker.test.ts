import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  NATIVE_IMAGE_FALLBACK_ACCEPT,
  NATIVE_IMAGE_GALLERY_ACCEPT,
  nativeImageFileInputOverlayClassName,
  resolveNativeImageAccept,
  resolveNativeImageCapture,
  sanitizeNativeImagePickerId,
} from "@/lib/media/native-image-picker";
import { SELL_PHOTO_MAX } from "@/features/sell/types";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("sell photo picker (Android / Samsung)", () => {
  it("uses explicit gallery MIME types instead of image/* wildcard", () => {
    expect(NATIVE_IMAGE_GALLERY_ACCEPT).toContain("image/jpeg");
    expect(NATIVE_IMAGE_GALLERY_ACCEPT).toContain("image/png");
    expect(NATIVE_IMAGE_GALLERY_ACCEPT).not.toContain("image/*");
    expect(resolveNativeImageAccept("gallery")).toBe(NATIVE_IMAGE_GALLERY_ACCEPT);
  });

  it("keeps image/* only as explicit fallback intent", () => {
    expect(NATIVE_IMAGE_FALLBACK_ACCEPT).toBe("image/*");
    expect(resolveNativeImageAccept("any")).toBe("image/*");
  });

  it("uses capture only for dedicated camera intent", () => {
    expect(resolveNativeImageCapture("gallery")).toBeUndefined();
    expect(resolveNativeImageCapture("camera")).toBe("environment");
  });

  it("does not hide the file input from assistive tech or Samsung taps", () => {
    const source = readSource("components/ui/NativeImageFileInput.tsx");
    expect(source).not.toContain("aria-hidden");
    expect(source).not.toContain("tabIndex={-1}");
    expect(source).toContain('type="file"');
    expect(source).toContain("resolveNativeImageAccept");
    expect(source).toContain("resolveNativeImageCapture");
  });

  it("routes sell Add Photos to native gallery only", () => {
    const source = readSource("features/sell/ui/SellPhotoRail.tsx");
    expect(source).toContain('intent="gallery"');
    expect(source).not.toContain('intent="camera"');
    expect(source).toContain('placement="overlay"');
    expect(source).toContain("Add Photos");
    expect(source).not.toContain("Take Photo");
  });

  it("routes auction sell through canonical photo rail", () => {
    const source = readSource("features/auctions/sell/AuctionSellPage.tsx");
    expect(source).toContain("SellPhotoRail");
    expect(source).toContain("SellCategoryBlock");
    expect(source).not.toContain("PhotoUploader");
    expect(source).not.toContain("CategoryTreePicker");
  });

  it("overlay input covers the full label hit target", () => {
    expect(nativeImageFileInputOverlayClassName).toContain("inset-0");
    expect(nativeImageFileInputOverlayClassName).toContain("opacity-0");
    expect(nativeImageFileInputOverlayClassName).not.toContain("display:none");
  });

  it("sanitizes React useId values for htmlFor association", () => {
    expect(sanitizeNativeImagePickerId(":r1:photo")).toBe("r1photo");
  });

  it("enforces maximum listing photos", () => {
    expect(SELL_PHOTO_MAX).toBe(8);
  });
});

describe("sell photo upload state", () => {
  it("resets file input value after selection for re-pick", () => {
    const source = readSource("components/ui/NativeImageFileInput.tsx");
    expect(source).toContain('event.target.value = ""');
  });

  it("caps added photos at SELL_PHOTO_MAX in provider", () => {
    const source = readSource("features/sell/context/SellProvider.tsx");
    expect(source).toContain("SELL_PHOTO_MAX - draftRef.current.photos.length");
    expect(source).toContain(".slice(0, SELL_PHOTO_MAX)");
  });
});
