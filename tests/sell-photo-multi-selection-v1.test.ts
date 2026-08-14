import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  capSellPhotoSelection,
  SELL_PHOTO_MAX,
} from "@/features/sell/types";
import {
  resolveNativeImageAccept,
  resolveNativeImageCapture,
} from "@/lib/media/native-image-picker";

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

describe("Sell Photo Picker — Multi Photo Selection V1", () => {
  it("gallery accept is image/*", () => {
    expect(resolveNativeImageAccept("gallery")).toBe("image/*");
    const input = readSource("features/sell/ui/SellPhotoFileInput.tsx");
    expect(input).toContain("resolveNativeImageAccept(intent)");
  });

  it("gallery input has multiple and does NOT set capture", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    const input = readSource("features/sell/ui/SellPhotoFileInput.tsx");

    expect(rail).toContain('intent="gallery"');
    expect(rail).toMatch(/intent="gallery"[\s\S]*?multiple/);
    expect(resolveNativeImageCapture("gallery")).toBeUndefined();
    expect(input).toContain("...(capture ? { capture } : {})");
    expect(input).toContain('intent === "camera" ? false : Boolean(multiple)');
    expect(input).toContain('data-sell-photo-multiple={allowMultiple ? "true" : "false"}');
  });

  it("Add Photo gallery stays multi without capture; camera is a separate path", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    expect(rail).toContain("Add Photo");
    expect(rail).toContain('intent="camera"');
    expect(rail).not.toContain("SellCameraMultiPhotoSession");
    expect(resolveNativeImageCapture("gallery")).toBeUndefined();
    expect(resolveNativeImageCapture("camera")).toBe("environment");
  });

  it("multiple selected files are passed to SellProvider.addPhotos", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    const provider = readSource("features/sell/context/SellProvider.tsx");
    expect(rail).toContain("void addPhotos(files)");
    expect(rail).toContain("handleFilesSelected");
    expect(provider).toContain("const addPhotos = useCallback(async (files: FileList | File[])");
    expect(provider).toContain("capSellPhotoSelection");
  });

  it("SELL_PHOTO_MAX remains 10 — no second maximum constant", () => {
    expect(SELL_PHOTO_MAX).toBe(10);
    const types = readSource("features/sell/types.ts");
    expect(types).toMatch(/export const SELL_PHOTO_MAX = 10/);
    expect(types).not.toMatch(/SELL_PHOTO_MAX_PER_SELECTION|PHOTO_SELECT_MAX|GALLERY_MAX/);
  });

  it("existing + new selection is capped correctly against SELL_PHOTO_MAX", () => {
    const ten = Array.from({ length: 10 }, (_, i) => `n${i}`);
    const seven = Array.from({ length: 7 }, (_, i) => `n${i}`);
    const four = Array.from({ length: 4 }, (_, i) => `n${i}`);

    expect(capSellPhotoSelection(0, ten)).toHaveLength(10);
    expect(capSellPhotoSelection(3, seven)).toHaveLength(7);
    expect(capSellPhotoSelection(9, four)).toHaveLength(1);
    expect(capSellPhotoSelection(10, ten)).toHaveLength(0);
    expect(capSellPhotoSelection(10, ["a"])).toEqual([]);
    // Order preserved.
    expect(capSellPhotoSelection(8, ["a", "b", "c"])).toEqual(["a", "b"]);
  });

  it("provider uses capSellPhotoSelection — order preserved into placeholders", () => {
    const provider = readSource("features/sell/context/SellProvider.tsx");
    expect(provider).toContain("capSellPhotoSelection");
    expect(provider).toContain("Array.from(files)");
    expect(provider).toContain("selected.map((file)");
  });

  it("exactly one file-input uploader exists under features/sell", () => {
    const sellRoot = path.join(process.cwd(), "features/sell");
    const relative = walkTsFiles(sellRoot)
      .filter((file) => /type=["']file["']/.test(readFileSync(file, "utf8")))
      .map((file) => path.relative(process.cwd(), file).replace(/\\/g, "/"));
    expect(relative).toEqual(["features/sell/ui/SellPhotoFileInput.tsx"]);
  });

  it("keeps one Add Photo card — compact source choice, no Action Sheet component", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    expect(rail).toContain("Add Photo");
    expect(rail).toContain('data-sell-photo-source-choice="v1"');
    expect(rail).not.toMatch(/\bTake Photos\b/);
    expect(rail).not.toContain("ActionSheet");
    expect(rail).not.toContain("BottomSheet");
    expect(rail).not.toContain("UniversalPhotoPickerSheet");
  });
});
