import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  NATIVE_IMAGE_FALLBACK_ACCEPT,
  NATIVE_IMAGE_GALLERY_ACCEPT,
  NATIVE_IMAGE_SUPPORTED_MIME,
  nativeImageFileInputOverlayClassName,
  resolveNativeImageAccept,
  resolveNativeImageCapture,
  sanitizeNativeImagePickerId,
} from "@/lib/media/native-image-picker";
import { SELL_PHOTO_MAX } from "@/features/sell/types";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function walkTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...walkTsFiles(full));
      continue;
    }
    if (/\.(tsx?|jsx?)$/.test(entry)) files.push(full);
  }
  return files;
}

describe("sell photo picker (Android / Samsung)", () => {
  it("uses accept=image/* so Android opens Gallery / Google Photos providers", () => {
    expect(NATIVE_IMAGE_GALLERY_ACCEPT).toBe("image/*");
    expect(NATIVE_IMAGE_FALLBACK_ACCEPT).toBe("image/*");
    expect(resolveNativeImageAccept("gallery")).toBe("image/*");
    expect(resolveNativeImageAccept("any")).toBe("image/*");
  });

  it("documents supported image MIME types without forcing them into accept", () => {
    expect(NATIVE_IMAGE_SUPPORTED_MIME).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ]);
  });

  it("never forces capture on gallery / sell picker", () => {
    expect(resolveNativeImageCapture("gallery")).toBeUndefined();
    expect(resolveNativeImageCapture("any")).toBeUndefined();
  });

  it("has exactly one file-input photo picker implementation in features/sell", () => {
    const sellRoot = path.join(process.cwd(), "features/sell");
    const files = walkTsFiles(sellRoot);
    const fileInputOwners = files.filter((file) => {
      const source = readFileSync(file, "utf8");
      return /type=["']file["']/.test(source);
    });

    const relative = fileInputOwners.map((file) =>
      path.relative(process.cwd(), file).replace(/\\/g, "/"),
    );

    expect(relative).toEqual(["features/sell/ui/SellPhotoFileInput.tsx"]);
    expect(existsSync(path.join(sellRoot, "ui/SellPhotoFileInput.tsx"))).toBe(true);
  });

  it("bans legacy / duplicate picker names inside the sell module", () => {
    const sellRoot = path.join(process.cwd(), "features/sell");
    const banned = [
      "NativeImageFileInput",
      "PhotoUploader",
      "PhotoPicker",
      "ImagePicker",
      "FilePicker",
      "GalleryPicker",
      "CameraPicker",
      "sourceSheetOpen",
      "ActionSheet",
      "BottomSheet",
      'capture="environment"',
      "capture='environment'",
    ];

    for (const file of walkTsFiles(sellRoot)) {
      const source = readFileSync(file, "utf8");
      const relative = path.relative(process.cwd(), file).replace(/\\/g, "/");
      for (const token of banned) {
        expect(source.includes(token), `${relative} must not contain ${token}`).toBe(false);
      }
    }
  });

  it("sell Add Photos uses only SellPhotoFileInput", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    const input = readSource("features/sell/ui/SellPhotoFileInput.tsx");

    expect(rail).toContain("SellPhotoFileInput");
    expect(rail).not.toContain("NativeImageFileInput");
    expect(rail).not.toContain('intent="camera"');
    expect(rail).not.toContain("capture=");

    expect(input).toContain('type="file"');
    expect(input).toContain('accept="image/*"');
    expect(input).toContain("multiple");
    expect(input).not.toMatch(/\bcapture\b/);
    expect(input).not.toContain("environment");
    expect(input).not.toContain('intent="camera"');
  });

  it("shared NativeImageFileInput omits capture unless camera intent", () => {
    const source = readSource("components/ui/NativeImageFileInput.tsx");
    expect(source).toContain('type="file"');
    expect(source).toContain("...(capture ? { capture } : {})");
    expect(source).not.toContain("aria-hidden");
    expect(source).not.toContain("tabIndex={-1}");
  });

  it("routes auction sell bookmarks to canonical Sell", () => {
    const route = readSource("app/sell/auction/page.tsx");
    expect(route).toContain('redirect("/sell")');
    expect(
      existsSync(path.join(process.cwd(), "features/auctions/sell/AuctionSellPage.tsx")),
    ).toBe(false);
  });

  it("overlay input covers the full label hit target", () => {
    expect(nativeImageFileInputOverlayClassName).toContain("inset-0");
    expect(nativeImageFileInputOverlayClassName).toContain("opacity-0");
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
    const source = readSource("features/sell/ui/SellPhotoFileInput.tsx");
    expect(source).toContain('event.target.value = ""');
  });

  it("caps added photos at SELL_PHOTO_MAX in provider", () => {
    const source = readSource("features/sell/context/SellProvider.tsx");
    expect(source).toContain("SELL_PHOTO_MAX - draftRef.current.photos.length");
    expect(source).toContain(".slice(0, SELL_PHOTO_MAX)");
  });
});
