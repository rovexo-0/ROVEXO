import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CANONICAL_LOGO_ENGINE_V1,
  CANONICAL_RX_FORBIDDEN_ASSET,
  CANONICAL_RX_PWA_SIZES,
  CANONICAL_RX_3D_SURFACES,
} from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Canonical Logo Engine v1.0", () => {
  it("locks one transparent logo law", () => {
    expect(CANONICAL_LOGO_ENGINE_V1.background).toBe("ABSOLUTE_TRANSPARENT");
    expect(CANONICAL_LOGO_ENGINE_V1.display).toEqual(["RX", "BUY • SELL • GROW"]);
    expect(CANONICAL_LOGO_ENGINE_V1.freezeLocked).toBe(true);
    expect(CANONICAL_LOGO_ENGINE_V1.status).toBe("LOCKED_FROZEN_CERTIFIED");
    expect(CANONICAL_RX_3D_SURFACES.login.display).toEqual(["RX", "Protective Hands"]);
    expect(CANONICAL_RX_FORBIDDEN_ASSET).toContain("BLACK_BACKGROUND");
    expect(CANONICAL_RX_FORBIDDEN_ASSET).toContain("FRAMES");
  });

  it("requires Owner transparent PNG assets + icon matrix on disk", () => {
    expect(existsSync(join(process.cwd(), "public/brand/canonical-rx/logo-full-v3.png"))).toBe(true);
    expect(existsSync(join(process.cwd(), "public/brand/canonical-rx/rx-mark-v3.png"))).toBe(true);
    expect(existsSync(join(process.cwd(), "public/brand/canonical-rx/splash-2048x2732.png"))).toBe(
      false,
    );
    expect(existsSync(join(process.cwd(), "public/icons/icon-512.png"))).toBe(true);
    expect(existsSync(join(process.cwd(), "public/apple-icon.png"))).toBe(true);
    for (const size of CANONICAL_RX_PWA_SIZES) {
      expect(existsSync(join(process.cwd(), `public/icons/icon-${size}.png`))).toBe(true);
    }
  });

  it("wires Login to Primary Emblem and Homepage header to App Icon", () => {
    const brand = readSource("components/branding/RovexoBrandLogo.tsx");
    const login = readSource("features/auth/components/LoginScreen.tsx");
    const header = readSource("components/header/RovexoHeaderV2.tsx");
    expect(brand).toContain("OFFICIAL_BRAND_PRIMARY_EMBLEM");
    expect(brand).toContain("data-logo-engine");
    expect(login).toContain("RovexoBrandLogo");
    expect(header).toContain("OFFICIAL_BRAND_APP_ICON");
  });

  it("keeps PWA icons on RX path matrix", () => {
    const manifest = readSource("app/manifest.ts");
    expect(manifest).toContain("CANONICAL_RX_PWA_SIZES");
    expect(manifest).toContain("/icons/icon-");
    expect(manifest).toContain("CANONICAL_RX_APP_ICON");
    expect(manifest).not.toContain("/favicon.svg");
  });
});
