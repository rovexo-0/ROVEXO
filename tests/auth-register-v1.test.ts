import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_MASTER_SPEC, AUTH_MASTER_SPEC_VERSION } from "@/lib/auth/master-spec";
import { AUTH_ROUTES } from "@/lib/auth/canonical";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("AUTH Register — Cod Sânge v1.0", () => {
  it("keeps register routes and core master-spec fields", () => {
    expect(AUTH_MASTER_SPEC_VERSION).toBe("v1.0");
    expect(AUTH_ROUTES.register).toBe("/register");
    expect(AUTH_MASTER_SPEC.register.fadeDurationMs).toBe(225);
    expect(AUTH_MASTER_SPEC.register.copy.fullNameLabel).toBe("Full Name");
    expect(AUTH_MASTER_SPEC.register.copy.submit).toBe("Create Free Account");
  });

  it("implements Cod Sânge register stack only", () => {
    const page = readSource("app/(auth)/register/page.tsx");
    const screen = readSource("features/auth/components/RegisterScreen.tsx");
    const layout = readSource("app/(auth)/register/layout.tsx");

    expect(page).toContain("RegisterScreen");
    expect(page).toContain("redirectIfAuthenticated");
    expect(screen).toContain("RovexoBrandLogo");
    expect(screen).toContain("AuthIconInput");
    expect(screen).toContain("AuthPasswordInput");
    expect(screen).toContain('name="fullName"');
    expect(screen).toContain("Full Name");
    expect(screen).toContain("Email Address");
    expect(screen).toContain("Confirm Password");
    expect(screen).toContain("Terms and Conditions");
    expect(screen).toContain("Create Free Account");
    expect(screen).toContain("Sign In");
    expect(screen).toContain("PrimaryButton");
    expect(screen).toContain('name="terms"');
    expect(screen).toContain('data-auth-version="canonical-freeze-v1"');
    expect(screen).not.toContain("SocialLogin");
    expect(screen).not.toContain('name="gdpr"');
    expect(screen).toContain('name="marketing"');
    expect(screen).not.toContain("Join ROVEXO Today");
    expect(screen).toContain("SECURE REGISTRATION");
    expect(screen).toContain("Your account is protected");
    expect(screen).toContain("Receive ROVEXO news and offers (OPTIONAL)");
    expect(screen).not.toContain("AuthHeading");
    expect(layout).toContain("auth-register-route");

    const actions = readSource("lib/auth/actions.ts");
    expect(actions).toContain("supabase.auth.signUp");
    expect(actions).toContain('terms: z.literal("on"');
    expect(actions).not.toContain("gdpr: z.literal");
    expect(actions).not.toContain('formData.get("gdpr")');
    expect(actions).toContain("marketing_emails");
    expect(actions).toContain('identities?.length === 0');
    expect(actions).toContain("/verify-email");
  });

  it("uses fade-only register CSS without scale or bounce", () => {
    const css = readSource("styles/rovexo/auth-v1.css");
    expect(css).toContain("auth-register-route");
    expect(css).toContain("--auth-gradient-cta");
    expect(css).toContain("rovexo-brand-logo");
    expect(css).not.toMatch(/auth-register[^{]*\{[^}]*scale\(/);
    expect(css).not.toMatch(/bounce/);
  });
});
