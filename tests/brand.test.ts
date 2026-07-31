import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  CANONICAL_LOGO_ENGINE_V1,
  CANONICAL_RX_PWA_SIZES,
  CANONICAL_RX_FAVICON_SIZES,
} from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";

describe("Official ROVEXO canonical logo engine", () => {
  it("uses App Icon in header chrome (Law XXXVIII)", () => {
    const logo = readFileSync(path.join(process.cwd(), "components/brand/RovexoLogo.tsx"), "utf8");
    const header = readFileSync(
      path.join(process.cwd(), "components/header/RovexoHeaderV2.tsx"),
      "utf8",
    );
    expect(logo).toContain("OFFICIAL_BRAND_APP_ICON");
    expect(logo).toContain("SafeImage");
    expect(header).toContain("OFFICIAL_BRAND_APP_ICON");
    expect(header).not.toContain("rx-h2__logo-text");
    expect(header).not.toContain("OFFICIAL_BRAND_PRIMARY_EMBLEM");
  });

  it("ships transparent master + full PWA / favicon matrix", () => {
    expect(existsSync(path.join(process.cwd(), "public/brand/canonical-rx/logo-full-v3.png"))).toBe(
      true,
    );
    expect(existsSync(path.join(process.cwd(), "public/brand/canonical-rx/master-emblem-v1.png"))).toBe(
      true,
    );
    expect(existsSync(path.join(process.cwd(), "public/brand/canonical-rx/splash-2048x2732.png"))).toBe(
      false,
    );
    expect(existsSync(path.join(process.cwd(), "public/apple-icon.png"))).toBe(true);
    expect(existsSync(path.join(process.cwd(), "public/favicon.ico"))).toBe(true);
    for (const size of CANONICAL_RX_PWA_SIZES) {
      expect(existsSync(path.join(process.cwd(), `public/icons/icon-${size}.png`)), `icon-${size}`).toBe(
        true,
      );
    }
    for (const size of CANONICAL_RX_FAVICON_SIZES) {
      expect(
        existsSync(path.join(process.cwd(), `public/icons/favicon-${size}.png`)),
        `favicon-${size}`,
      ).toBe(true);
    }
  });

  it("wires manifest + layout to official RX icons only", () => {
    const layout = readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8");
    const manifest = readFileSync(path.join(process.cwd(), "app/manifest.ts"), "utf8");
    expect(layout).toContain("/brand/og-image.png");
    expect(layout).toContain("/brand/canonical-rx/app-icon-v1.png");
    expect(layout).not.toContain("/brand/canonical-rx/rx-mark-v3.png");
    expect(manifest).toContain("CANONICAL_RX_PWA_SIZES");
    expect(manifest).toContain("CANONICAL_RX_APP_ICON");
    expect(manifest).toContain("icon-maskable-512.png");
    expect(CANONICAL_LOGO_ENGINE_V1.background).toBe("ABSOLUTE_TRANSPARENT");
    expect(CANONICAL_LOGO_ENGINE_V1.freezeLocked).toBe(true);
  });
});
