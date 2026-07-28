import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  SUPREME_BLOOD_LAW_XXXIX_AUTHENTICATION_BRAND_FREEZE_V1,
  AUTH_BRAND_PRIMARY_EMBLEM_CERTIFIED_WIDTH_PX,
  HOMEPAGE_HEADER_APP_ICON_CERTIFIED_HEIGHT_PX,
  certifyAuthenticationBrandFreezeXxxix,
  assertAuthenticationBrandFreezeOrBlock,
} from "@/lib/supreme-blood-law-xxxix-authentication-brand-freeze-v1";
import {
  OFFICIAL_BRAND_APP_ICON,
  OFFICIAL_BRAND_PRIMARY_EMBLEM,
  getOfficialBrandAssetForSurface,
} from "@/lib/brand/official-brand-application-v1";

describe("Absolute Blood Law XXXIX — Authentication Brand Freeze", () => {
  it("locks authentication brand freeze contract", () => {
    const law = SUPREME_BLOOD_LAW_XXXIX_AUTHENTICATION_BRAND_FREEZE_V1;
    expect(law.bloodLaw).toBe("XXXIX");
    expect(law.status).toBe("LOCKED_CERTIFIED_FROZEN_PRODUCTION_READY");
    expect(law.locked).toBe(true);
    expect(law.frozen).toBe(true);
    expect(law.frozenPages).toEqual(["login", "register"]);
    expect(AUTH_BRAND_PRIMARY_EMBLEM_CERTIFIED_WIDTH_PX).toBe(180);
    expect(HOMEPAGE_HEADER_APP_ICON_CERTIFIED_HEIGHT_PX).toBe(28);
    expect(getOfficialBrandAssetForSurface("login")).toBe(OFFICIAL_BRAND_PRIMARY_EMBLEM);
    expect(getOfficialBrandAssetForSurface("register")).toBe(OFFICIAL_BRAND_PRIMARY_EMBLEM);
    expect(getOfficialBrandAssetForSurface("header")).toBe(OFFICIAL_BRAND_APP_ICON);
  });

  it("keeps certified transparent assets on disk", () => {
    expect(
      existsSync(path.join(process.cwd(), "public", OFFICIAL_BRAND_PRIMARY_EMBLEM.replace(/^\//, ""))),
    ).toBe(true);
    expect(
      existsSync(path.join(process.cwd(), "public", OFFICIAL_BRAND_APP_ICON.replace(/^\//, ""))),
    ).toBe(true);
  });

  it("stamps Login / Register / Header / BrandLogo with XXXIX", () => {
    const login = readFileSync(
      path.join(process.cwd(), "features/auth/components/LoginScreen.tsx"),
      "utf8",
    );
    const register = readFileSync(
      path.join(process.cwd(), "features/auth/components/RegisterScreen.tsx"),
      "utf8",
    );
    const brand = readFileSync(
      path.join(process.cwd(), "components/branding/RovexoBrandLogo.tsx"),
      "utf8",
    );
    const header = readFileSync(
      path.join(process.cwd(), "components/header/RovexoHeaderV2.tsx"),
      "utf8",
    );
    expect(login).toContain('data-auth-brand-freeze="XXXIX"');
    expect(register).toContain('data-auth-brand-freeze="XXXIX"');
    expect(brand).toContain('data-auth-brand-freeze="XXXIX"');
    expect(header).toContain('data-auth-brand-freeze="XXXIX"');
    expect(header).toContain("OFFICIAL_BRAND_APP_ICON");
    expect(brand).toContain("OFFICIAL_BRAND_PRIMARY_EMBLEM");
  });

  it("passes authentication brand freeze certification and startup gate", () => {
    const report = certifyAuthenticationBrandFreezeXxxix();
    expect(report.ok, report.errors.join("; ")).toBe(true);
    expect(() => assertAuthenticationBrandFreezeOrBlock()).not.toThrow();
    const instrumentation = readFileSync(
      path.join(process.cwd(), "instrumentation.ts"),
      "utf8",
    );
    expect(instrumentation).toContain("assertAuthenticationBrandFreezeOrBlock");
  });
});
