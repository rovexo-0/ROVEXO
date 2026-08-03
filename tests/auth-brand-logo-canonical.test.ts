import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("AUTH brand logo canonical — Primary Emblem (XXXVIII)", () => {
  it("defines RovexoBrandLogo as the Primary Emblem auth brand", () => {
    const brand = readFileSync(
      path.join(process.cwd(), "components/branding/RovexoBrandLogo.tsx"),
      "utf8",
    );
    expect(brand).toContain("OFFICIAL_BRAND_PRIMARY_EMBLEM");
    expect(brand).toContain("canonical");
    expect(brand).toContain("<img");
    expect(brand).toContain('fetchPriority="high"');
    expect(brand).toContain('data-blood-law="XXXVIII"');
    expect(brand).toContain("II_PRIMARY_EMBLEM");
    expect(brand).not.toContain("SafeImage");
    expect(brand).not.toContain("RovexoAppIconMark");
    expect(brand).not.toContain("rovexo-brand-logo__tagline");
  });

  it("locks auth brand shell for the official asset", () => {
    const css = readFileSync(path.join(process.cwd(), "styles/rovexo/auth-v1.css"), "utf8");
    expect(css).toContain(".rovexo-brand-logo");
    expect(css).toContain("rovexo-brand-logo--canonical");
    expect(css).toContain("rovexo-brand-logo__canonical-img");
  });

  it("wires the canonical logo on Login and Register form screens", () => {
    for (const screen of [
      "features/auth/components/LoginScreen.tsx",
      "features/auth/components/RegisterScreen.tsx",
      "features/auth/components/ForgotPasswordScreen.tsx",
      "features/auth/components/ResetPasswordScreen.tsx",
      "features/auth/components/AuthForm.tsx",
    ]) {
      const source = readFileSync(path.join(process.cwd(), screen), "utf8");
      expect(source).toContain("RovexoBrandLogo");
      expect(source).not.toContain("RovexoAppIconMark");
    }
  });
});
