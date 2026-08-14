import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { capSellPhotoSelection, SELL_PHOTO_MAX } from "@/features/sell/types";
import { NATIVE_PHOTO_PICKER_V1 } from "@/lib/media/universal-photo-picker-v1";
import { resolveNativeImageCapture } from "@/lib/media/native-image-picker";

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

describe("Sell Photo — Android Camera + Gallery Fix V1", () => {
  it("exposes exactly one visible Add Photo card — no permanent Take Photos tile", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    expect(rail).toContain("Add Photo");
    expect(rail).toContain('data-sell-add-photo="v1"');
    expect(rail).toContain('data-native-photo-picker-trigger="add"');
    expect(rail).toContain('data-sell-photo-source-choice="v1"');
    expect(rail).not.toMatch(/\bTake Photos\b/);
    expect(rail).not.toContain("SellCameraMultiPhotoSession");
    expect(rail).not.toContain('data-sell-camera-session-entry');
    expect(rail).not.toContain("ActionSheet");
    expect(rail).not.toContain("BottomSheet");
    // Visible card count: one data-sell-add-photo marker
    expect(rail.match(/data-sell-add-photo="v1"/g)?.length).toBe(1);
  });

  it("camera input uses accept=image/* and capture=environment (single)", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    const input = readSource("features/sell/ui/SellPhotoFileInput.tsx");
    expect(rail).toContain('intent="camera"');
    expect(rail).toMatch(/intent="camera"[\s\S]*?multiple=\{false\}/);
    expect(rail).toContain("Take Photo");
    expect(resolveNativeImageCapture("camera")).toBe("environment");
    expect(input).toContain('type="file"');
    expect(input).toContain("resolveNativeImageAccept");
    expect(input).toContain("resolveNativeImageCapture");
    expect(input).toContain('intent === "camera" ? false : Boolean(multiple)');
    expect(NATIVE_PHOTO_PICKER_V1.cameraCapture).toBe("environment");
  });

  it("gallery input uses accept=image/* multiple with NO capture", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    expect(rail).toContain('intent="gallery"');
    expect(rail).toContain("Choose from Gallery");
    expect(rail).toMatch(/intent="gallery"[\s\S]*?\n\s*multiple\n/);
    expect(resolveNativeImageCapture("gallery")).toBeUndefined();
    expect(NATIVE_PHOTO_PICKER_V1.capture).toBeUndefined();
    expect(NATIVE_PHOTO_PICKER_V1.accept).toBe("image/*");
    expect(NATIVE_PHOTO_PICKER_V1.multiple).toBe(true);
  });

  it("both Camera and Gallery paths call SellProvider.addPhotos", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    expect(rail).toContain("handleFilesSelected");
    expect(rail).toContain("void addPhotos(files)");
    expect(rail).toContain("onFilesSelected={handleFilesSelected}");
    // Both intents share the same handler
    const cameraBlock = rail.indexOf('intent="camera"');
    const galleryBlock = rail.indexOf('intent="gallery"');
    expect(cameraBlock).toBeGreaterThan(-1);
    expect(galleryBlock).toBeGreaterThan(-1);
    expect(rail.slice(cameraBlock, cameraBlock + 200)).toContain("handleFilesSelected");
    expect(rail.slice(galleryBlock, galleryBlock + 200)).toContain("handleFilesSelected");
  });

  it("cancellation closes choice without calling addPhotos on empty selection", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    const input = readSource("features/sell/ui/SellPhotoFileInput.tsx");
    expect(rail).toContain("if (!files.length) return");
    expect(rail).toContain("setSourceChoiceOpen(false)");
    expect(rail).toContain("Cancel");
    // File input only forwards when files.length — cancel is harmless
    expect(input).toContain("if (event.target.files?.length)");
    expect(input).toContain("onFilesSelected(event.target.files)");
  });

  it("canonical photo max is 10 — counter and cap use SELL_PHOTO_MAX only", () => {
    expect(SELL_PHOTO_MAX).toBe(10);
    expect(NATIVE_PHOTO_PICKER_V1.listingMax).toBe(10);
    const types = readSource("features/sell/types.ts");
    expect(types).toMatch(/export const SELL_PHOTO_MAX = 10/);
    expect(types).not.toMatch(/SELL_PHOTO_MAX_PER_SELECTION|PHOTO_SELECT_MAX|GALLERY_MAX/);
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    expect(rail).toContain("{photos.length} / {SELL_PHOTO_MAX}");
  });

  it("caps selection so an 11th photo is rejected", () => {
    const ten = Array.from({ length: 10 }, (_, i) => `n${i}`);
    const eleven = Array.from({ length: 11 }, (_, i) => `n${i}`);
    expect(capSellPhotoSelection(0, ten)).toHaveLength(10);
    expect(capSellPhotoSelection(0, eleven)).toHaveLength(10);
    expect(capSellPhotoSelection(10, ["a"])).toEqual([]);
    expect(capSellPhotoSelection(9, ["a", "b"])).toEqual(["a"]);
  });

  it("keeps ONE file-input uploader and addPhotos pipeline — no second uploader", () => {
    const sellRoot = path.join(process.cwd(), "features/sell");
    const relative = walkTsFiles(sellRoot)
      .filter((file) => /type=["']file["']/.test(readFileSync(file, "utf8")))
      .map((file) => path.relative(process.cwd(), file).replace(/\\/g, "/"));
    expect(relative).toEqual(["features/sell/ui/SellPhotoFileInput.tsx"]);
    const provider = readSource("features/sell/context/SellProvider.tsx");
    expect(provider).toContain("capSellPhotoSelection");
    expect(provider).toContain("const addPhotos = useCallback");
    expect(provider).toContain("uploadPhoto");
    expect(readSource("features/sell/ui/SellPhotoRail.tsx")).toContain("DeletePhotoAction");
  });
});
