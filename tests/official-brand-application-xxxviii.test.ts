import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  SUPREME_BLOOD_LAW_XXXVIII_OFFICIAL_BRAND_APPLICATION_V1,
  certifyOfficialBrandApplicationXxxviii,
  assertOfficialBrandApplicationOrBlock,
} from "@/lib/supreme-blood-law-xxxviii-official-brand-application-v1";
import {
  OFFICIAL_BRAND_APP_ICON,
  OFFICIAL_BRAND_ASSET_REGISTRY,
  OFFICIAL_BRAND_LEVEL,
  OFFICIAL_BRAND_PRIMARY_EMBLEM,
  getOfficialBrandAssetForSurface,
} from "@/lib/brand/official-brand-application-v1";
import { CANONICAL_RX_LOGO_LOGIN } from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";

describe("Absolute Blood Law XXXVIII — Official Brand Application", () => {
  it("locks four-level hierarchy and asset registry", () => {
    const law = SUPREME_BLOOD_LAW_XXXVIII_OFFICIAL_BRAND_APPLICATION_V1;
    expect(law.bloodLaw).toBe("XXXVIII");
    expect(law.status).toBe("LOCKED_CERTIFIED_PRODUCTION_READY");
    expect(law.hierarchy).toHaveLength(4);
    expect(law.noSplashScreen).toBe(true);
    expect(getOfficialBrandAssetForSurface("login")).toBe(OFFICIAL_BRAND_PRIMARY_EMBLEM);
    expect(getOfficialBrandAssetForSurface("header")).toBe(OFFICIAL_BRAND_APP_ICON);
    expect(CANONICAL_RX_LOGO_LOGIN).toBe(OFFICIAL_BRAND_PRIMARY_EMBLEM);
    expect(
      OFFICIAL_BRAND_ASSET_REGISTRY.surfaces.login,
    ).toBe(OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM);
  });

  it("keeps hierarchy assets on disk with transparency formats", () => {
    for (const file of [
      "master-emblem-v1.png",
      "primary-emblem-v1.png",
      "app-icon-v1.png",
      "favicon-rx-v1.png",
    ]) {
      expect(existsSync(path.join(process.cwd(), "public/brand/canonical-rx", file))).toBe(true);
    }
  });

  it("wires Primary Emblem to auth and App Icon to headers", () => {
    const brand = readFileSync(
      path.join(process.cwd(), "components/branding/RovexoBrandLogo.tsx"),
      "utf8",
    );
    const header = readFileSync(
      path.join(process.cwd(), "components/header/RovexoHeaderV2.tsx"),
      "utf8",
    );
    expect(brand).toContain("OFFICIAL_BRAND_PRIMARY_EMBLEM");
    expect(brand).toContain('data-blood-law="XXXVIII"');
    expect(header).toContain("OFFICIAL_BRAND_APP_ICON");
    expect(header).not.toContain("OFFICIAL_BRAND_PRIMARY_EMBLEM");
  });

  it("passes brand application certification and startup gate", () => {
    const report = certifyOfficialBrandApplicationXxxviii();
    expect(report.ok, report.errors.join("; ")).toBe(true);
    expect(() => assertOfficialBrandApplicationOrBlock()).not.toThrow();
    const instrumentation = readFileSync(
      path.join(process.cwd(), "instrumentation.ts"),
      "utf8",
    );
    expect(instrumentation).toContain("assertOfficialBrandApplicationOrBlock");
  });
});
