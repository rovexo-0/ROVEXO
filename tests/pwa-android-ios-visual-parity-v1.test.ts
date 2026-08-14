import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  ROVEXO_PWA_BACKGROUND_COLOR,
  ROVEXO_PWA_DISPLAY,
  ROVEXO_PWA_THEME_COLOR,
  ROVEXO_WHITE_PEARL_FAVICON_CACHE_BUST,
} from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";

function read(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function exists(relativePath: string): boolean {
  return existsSync(path.join(process.cwd(), relativePath));
}

describe("PWA Android / iOS visual parity — Premium Background V1", () => {
  it("locks canonical white/pearl background and ROVEXO purple theme", () => {
    expect(ROVEXO_PWA_BACKGROUND_COLOR).toBe("#FFFFFF");
    expect(ROVEXO_PWA_THEME_COLOR).toBe("#9333ea");
    expect(ROVEXO_PWA_DISPLAY).toBe("standalone");
    expect(ROVEXO_PWA_BACKGROUND_COLOR.toLowerCase()).not.toContain("transparent");
    expect(ROVEXO_PWA_BACKGROUND_COLOR).not.toMatch(/rgba?\(/i);
    expect(ROVEXO_PWA_BACKGROUND_COLOR).not.toBe("#050508");
  });

  it("wires ONE Next.js manifest SSOT with standalone + white splash colours", () => {
    const manifest = read("app/manifest.ts");
    expect(manifest).toContain("ROVEXO_PWA_BACKGROUND_COLOR");
    expect(manifest).toContain("ROVEXO_PWA_THEME_COLOR");
    expect(manifest).toContain("ROVEXO_PWA_DISPLAY");
    expect(manifest).toContain('name: "ROVEXO"');
    expect(manifest).toContain('short_name: "ROVEXO"');
    expect(manifest).toContain("icon-maskable-512.png");
    expect(manifest).not.toContain("#050508");
    expect(manifest).not.toContain("transparent");
    expect(read("app/layout.tsx")).toContain('manifest: "/manifest.webmanifest"');
  });

  it("keeps required icons and white-pearl maskable Android asset", async () => {
    expect(exists("public/icons/icon-192.png")).toBe(true);
    expect(exists("public/icons/icon-512.png")).toBe(true);
    expect(exists("public/icons/icon-maskable-512.png")).toBe(true);
    expect(exists("public/icons/maskable-icon-512.png")).toBe(true);
    expect(exists("public/icons/android-chrome-192x192.png")).toBe(true);
    expect(exists("public/icons/android-chrome-512x512.png")).toBe(true);
    expect(exists("public/apple-touch-icon.png")).toBe(true);

    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp("public/icons/icon-maskable-512.png")
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(info.width).toBe(512);
    expect(info.height).toBe(512);
    // Corner pixels must be opaque white (Android splash / adaptive safe zone).
    expect(data[0]).toBe(255);
    expect(data[1]).toBe(255);
    expect(data[2]).toBe(255);
    expect(data[3]).toBe(255);
  });

  it("preserves iOS apple-touch metadata and does not invent a second splash system", () => {
    const layout = read("app/layout.tsx");
    expect(layout).toContain("appleWebApp");
    expect(layout).toContain('title: "ROVEXO"');
    expect(layout).toContain("/apple-touch-icon.png");
    expect(layout).toContain('msapplication-TileColor": "#FFFFFF"');
    expect(exists("components/pwa/PwaProvider.tsx")).toBe(true);
    // Static site.webmanifest stays colour-aligned with SSOT (not a second product).
    const site = read("public/site.webmanifest");
    expect(site).toContain('"background_color": "#FFFFFF"');
    expect(site).toContain('"theme_color": "#9333ea"');
    expect(site).toContain('"display": "standalone"');
    expect(site).toContain(ROVEXO_WHITE_PEARL_FAVICON_CACHE_BUST);
  });
});
