/**
 * OPT-P0-LOGO-01 — Header App Icon display-asset isolation.
 * Header chrome must not fetch the 2048×2048 master PNG.
 */
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  OFFICIAL_BRAND_APP_ICON,
  OFFICIAL_BRAND_HEADER_DISPLAY_ASSET,
} from "@/lib/brand/official-brand-application-v1";

const ROOT = process.cwd();
const MASTER_PUBLIC = "brand/canonical-rx/app-icon-v1.png";
const MASTER_PATH = `/brand/canonical-rx/app-icon-v1.png`;
/** Pre-implementation SHA-256 of the untouched master PNG (OPT-P0-LOGO-01 baseline). */
const MASTER_SHA256 =
  "d5fcaef5b14f135bfa5f3f54c2ce94e18e1cfa27cde92f8eac44b57a294c2123";
const MASTER_BYTES = 2_656_168;

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

describe("OPT-P0-LOGO-01 Header display asset isolation", () => {
  it("keeps OFFICIAL_BRAND_APP_ICON pointing at the master PNG only", () => {
    expect(OFFICIAL_BRAND_APP_ICON).toBe(MASTER_PATH);
    expect(OFFICIAL_BRAND_HEADER_DISPLAY_ASSET).not.toBe(OFFICIAL_BRAND_APP_ICON);
    expect(OFFICIAL_BRAND_HEADER_DISPLAY_ASSET).toContain("app-icon-header-display-v1");
  });

  it("does not redefine the master constant in the brand registry file", () => {
    const registry = read("lib/brand/official-brand-application-v1.ts");
    expect(registry).toContain(
      `export const OFFICIAL_BRAND_APP_ICON = "${MASTER_PATH}" as const;`,
    );
    expect(registry).toContain("OFFICIAL_BRAND_HEADER_DISPLAY_ASSET");
    expect(registry).toContain(OFFICIAL_BRAND_HEADER_DISPLAY_ASSET);
  });

  it("ships a sized header-only display asset within the agreed byte budget", () => {
    const rel = OFFICIAL_BRAND_HEADER_DISPLAY_ASSET.replace(/^\//, "");
    const abs = path.join(ROOT, "public", rel);
    expect(existsSync(abs), abs).toBe(true);
    const bytes = statSync(abs).size;
    expect(bytes).toBeGreaterThan(1_000);
    expect(bytes).toBeLessThanOrEqual(40_960);
    expect(OFFICIAL_BRAND_HEADER_DISPLAY_ASSET.endsWith(".webp")).toBe(true);
  });

  it("leaves the master PNG bytes unchanged", () => {
    const abs = path.join(ROOT, "public", MASTER_PUBLIC);
    expect(existsSync(abs)).toBe(true);
    const buf = readFileSync(abs);
    expect(buf.byteLength).toBe(MASTER_BYTES);
    expect(createHash("sha256").update(buf).digest("hex")).toBe(MASTER_SHA256);
  });

  it("wires RovexoHeaderV2 to the display asset — not the master PNG path", () => {
    const header = read("components/header/RovexoHeaderV2.tsx");
    expect(header).toContain("OFFICIAL_BRAND_HEADER_DISPLAY_ASSET");
    expect(header).toContain("src={OFFICIAL_BRAND_HEADER_DISPLAY_ASSET}");
    expect(header).not.toContain(MASTER_PATH);
    expect(header).not.toContain("app-icon-v1.png");
    expect(header).toContain("OFFICIAL_BRAND_APP_ICON");
    expect(header).toContain('width={28}');
    expect(header).toContain("height={28}");
    expect(header).toContain('className="rx-h2__logo-img"');
    expect(header).not.toContain("unoptimized");
    expect(header).not.toContain("quality={100}");
  });

  it("does not alter SafeImage, ListingCard, manifest, or SEO Wave 1 owners", () => {
    expect(read("components/ui/SafeImage.tsx")).not.toContain("HEADER_DISPLAY");
    expect(read("components/ui/ListingCard.tsx")).not.toContain("HEADER_DISPLAY");
    expect(read("app/manifest.ts")).toContain("CANONICAL_RX_APP_ICON");
    expect(read("app/manifest.ts")).not.toContain("HEADER_DISPLAY");
    expect(read("lib/seo/home-jsonld.ts")).not.toContain("HEADER_DISPLAY");
    expect(existsSync(path.join(ROOT, "public/icons/icon-192.png"))).toBe(true);
  });

  it("does not modify the canonical RX 3D logo freeze SSOT", () => {
    const freeze = read("lib/brand/canonical-rx-3d-logo-freeze-v1.ts");
    expect(freeze).toContain('"/brand/canonical-rx/app-icon-v1.png"');
    expect(freeze).not.toContain("HEADER_DISPLAY");
    expect(freeze).not.toContain("app-icon-header-display-v1");
  });
});
