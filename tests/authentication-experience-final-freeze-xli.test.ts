import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  SUPREME_BLOOD_LAW_XLI_AUTHENTICATION_EXPERIENCE_FINAL_FREEZE_V1,
  certifyAuthenticationExperienceFinalFreezeXli,
  assertAuthenticationExperienceFinalFreezeOrBlock,
} from "@/lib/supreme-blood-law-xli-authentication-experience-final-freeze-v1";

describe("Absolute Blood Law XLI — Authentication Experience Final Freeze", () => {
  it("locks supreme final authentication experience contract", () => {
    const law = SUPREME_BLOOD_LAW_XLI_AUTHENTICATION_EXPERIENCE_FINAL_FREEZE_V1;
    expect(law.bloodLaw).toBe("XLI");
    expect(law.status).toBe("SUPREME_LOCKED_CERTIFIED_FINAL_PRODUCTION_READY");
    expect(law.supreme).toBe(true);
    expect(law.final).toBe(true);
    expect(law.frozenUntil).toBe("ROVEXO_v2.0");
    expect(law.certifiedPages).toEqual(["homepage", "login", "register"]);
    expect(law.certifiedBranding.homepage.certifiedHeightPx).toBe(28);
    expect(law.certifiedBranding.login.certifiedWidthPx).toBe(180);
    expect(law.certifiedBranding.register.certifiedWidthPx).toBe(180);
    expect(law.certifiedBranding.register.certifiedVerticalOffsetPx).toBe(10);
  });

  it("stamps Homepage / Login / Register surfaces with XLI", () => {
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
    expect(login).toContain('data-auth-experience-freeze="XLI"');
    expect(register).toContain('data-auth-experience-freeze="XLI"');
    expect(brand).toContain('data-auth-experience-freeze="XLI"');
    expect(header).toContain('data-auth-experience-freeze="XLI"');
  });

  it("passes final freeze certification including parent XXXIX + XL", () => {
    const report = certifyAuthenticationExperienceFinalFreezeXli();
    expect(report.ok, report.errors.join("; ")).toBe(true);
    expect(report.final).toBe(true);
    expect(() => assertAuthenticationExperienceFinalFreezeOrBlock()).not.toThrow();
    const instrumentation = readFileSync(
      path.join(process.cwd(), "instrumentation.ts"),
      "utf8",
    );
    expect(instrumentation).toContain("assertAuthenticationExperienceFinalFreezeOrBlock");
  });
});
