import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_MASTER_SPEC, AUTH_MASTER_SPEC_VERSION } from "@/lib/auth/master-spec";
import { AUTH_ROUTES } from "@/lib/auth/canonical";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("AUTH_MASTER_SPEC v1.0 — welcome screen", () => {
  it("locks welcome copy, routes, and fade timing", () => {
    expect(AUTH_MASTER_SPEC_VERSION).toBe("v1.0");
    expect(AUTH_ROUTES.welcome).toBe("/welcome");
    expect(AUTH_MASTER_SPEC.welcome.fadeDurationMs).toBe(225);
    expect(AUTH_MASTER_SPEC.welcome.presentation.background).toBe("#ffffff");
    expect(AUTH_MASTER_SPEC.welcome.copy.tagline).toBe("BUY. SELL. GROW.");
    expect(AUTH_MASTER_SPEC.welcome.copy.signIn).toBe("Sign In");
    expect(AUTH_MASTER_SPEC.welcome.copy.createAccount).toBe("Create Account");
    expect(AUTH_MASTER_SPEC.welcome.socialProviders).toEqual(["apple", "google", "facebook"]);
  });

  it("implements welcome screen with canonical auth components", () => {
    const page = readSource("app/(auth)/welcome/page.tsx");
    const screen = readSource("features/auth/components/WelcomeScreen.tsx");
    const layout = readSource("app/(auth)/welcome/layout.tsx");

    expect(page).toContain("WelcomeScreen");
    expect(page).toContain("redirectIfAuthenticated");
    expect(screen).toContain("RovexoBrandLogo");
    expect(screen).toContain("AuthHeading");
    expect(screen).toContain("PrimaryButton");
    expect(screen).toContain("SecondaryButton");
    expect(screen).toContain("SocialLogin");
    expect(screen).toContain("AuthFooter");
    expect(screen).toContain('href={routes.signIn}');
    expect(screen).toContain('href={routes.register}');
    expect(layout).toContain("auth-welcome-route");
  });

  it("uses fade-only welcome CSS without scale or bounce", () => {
    const css = readSource("styles/rovexo/auth-v1.css");
    expect(css).toContain("auth-welcome-fade-in");
    expect(css).toContain("background-color: #ffffff");
    expect(css).not.toMatch(/auth-welcome[^{]*\{[^}]*scale\(/);
    expect(css).not.toMatch(/bounce/);
  });

  it("bypasses AuthShell on welcome route", () => {
    const routeLayout = readSource("components/auth/AuthRouteLayout.tsx");
    expect(routeLayout).toContain("AUTH_ROUTES.welcome");
  });

  it("supports facebook oauth in auth actions", () => {
    const actions = readSource("lib/auth/actions.ts");
    expect(actions).toContain('"facebook"');
  });
});
