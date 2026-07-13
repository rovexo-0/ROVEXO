import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_MASTER_SPEC, AUTH_MASTER_SPEC_VERSION } from "@/lib/auth/master-spec";
import { AUTH_ROUTES } from "@/lib/auth/canonical";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("AUTH_MASTER_SPEC v1.0 — register screen", () => {
  it("locks register copy, routes, and fade timing", () => {
    expect(AUTH_MASTER_SPEC_VERSION).toBe("v1.0");
    expect(AUTH_ROUTES.register).toBe("/register");
    expect(AUTH_MASTER_SPEC.register.fadeDurationMs).toBe(225);
    expect(AUTH_MASTER_SPEC.register.presentation.background).toBe("#ffffff");
    expect(AUTH_MASTER_SPEC.register.copy.title).toBe("Join ROVEXO today 🚀");
    expect(AUTH_MASTER_SPEC.register.copy.fullNameLabel).toBe("Full Name");
    expect(AUTH_MASTER_SPEC.register.copy.submit).toBe("Create Free Account");
    expect(AUTH_MASTER_SPEC.register.socialProviders).toEqual(["apple", "google", "facebook"]);
  });

  it("implements register screen with approved auth components", () => {
    const page = readSource("app/(auth)/register/page.tsx");
    const screen = readSource("features/auth/components/RegisterScreen.tsx");
    const layout = readSource("app/(auth)/register/layout.tsx");

    expect(page).toContain("RegisterScreen");
    expect(page).toContain("redirectIfAuthenticated");
    expect(screen).toContain("AuthOfficialLogo");
    expect(screen).toContain("AuthBackButton");
    expect(screen).toContain("AuthIconInput");
    expect(screen).toContain("AuthPasswordInput");
    expect(screen).toContain('name="fullName"');
    expect(screen).toContain("auth-password-strength");
    expect(screen).toContain("PrimaryButton");
    expect(screen).toContain("SocialLogin");
    expect(screen).toContain('data-auth-version="v1.0-legal-lock"');
    expect(layout).toContain("auth-register-route");
  });

  it("uses fade-only register CSS without scale or bounce", () => {
    const css = readSource("styles/rovexo/auth-v1.css");
    expect(css).toContain("auth-register-route");
    expect(css).toContain("--auth-gradient-cta");
    expect(css).toContain("auth-colored-tagline");
    expect(css).not.toMatch(/auth-register[^{]*\{[^}]*scale\(/);
    expect(css).not.toMatch(/bounce/);
  });

  it("bypasses AuthShell on register route", () => {
    const routeLayout = readSource("components/auth/AuthRouteLayout.tsx");
    expect(routeLayout).toContain("AUTH_ROUTES.register");
  });

  it("registers with full name in signUp action", () => {
    const actions = readSource("lib/auth/actions.ts");
    expect(actions).toContain('fullName: formData.get("fullName")');
    expect(actions).not.toContain('formData.get("firstName")');
  });
});
