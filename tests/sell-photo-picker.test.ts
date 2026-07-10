import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  NATIVE_IMAGE_ACCEPT,
  nativeImageFileInputOverlayClassName,
  sanitizeNativeImagePickerId,
} from "@/lib/media/native-image-picker";
import { SELL_PHOTO_MAX } from "@/features/sell/types";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("sell photo picker (Android / Samsung)", () => {
  it("uses broad image accept for native gallery and camera", () => {
    expect(NATIVE_IMAGE_ACCEPT).toBe("image/*");
  });

  it("does not hide the file input from assistive tech or Samsung taps", () => {
    const source = readSource("components/ui/NativeImageFileInput.tsx");
    expect(source).not.toContain("aria-hidden");
    expect(source).not.toContain("tabIndex={-1}");
    expect(source).not.toContain("capture=");
    expect(source).toContain('type="file"');
    expect(source).toContain("accept={accept}");
  });

  it("nests overlay file inputs inside sell labels for direct touch", () => {
    const source = readSource("features/sell/ui/SellPhotoRail.tsx");
    expect(source).toContain('placement="overlay"');
    expect(source).toContain("<label");
    expect(source).not.toContain("htmlFor=");
    expect(source).not.toContain(".click()");
    expect(source).toContain("multiple");
    expect(source).toContain("touch-manipulation");
  });

  it("uses overlay picker in auction PhotoUploader fallback", () => {
    const source = readSource("features/sell/components/PhotoUploader.tsx");
    expect(source).toContain('placement="overlay"');
    expect(source).not.toContain("htmlFor=");
    expect(source).not.toContain(".click()");
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
