import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_MASTER_SPEC, AUTH_MASTER_SPEC_VERSION } from "@/lib/auth/master-spec";
import { AUTH_ROUTES } from "@/lib/auth/canonical";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("AUTH_MASTER_SPEC v1.0 — login screen", () => {
  it("locks login copy, routes, and fade timing", () => {
    expect(AUTH_MASTER_SPEC_VERSION).toBe("v1.0");
    expect(AUTH_ROUTES.login).toBe("/login");
    expect(AUTH_MASTER_SPEC.login.fadeDurationMs).toBe(225);
    expect(AUTH_MASTER_SPEC.login.presentation.background).toBe("#ffffff");
    expect(AUTH_MASTER_SPEC.login.copy.title).toBe("Welcome back 👋");
    expect(AUTH_MASTER_SPEC.login.copy.rememberMe).toBe("Remember Me");
    expect(AUTH_MASTER_SPEC.login.copy.forgotPassword).toBe("Forgot Password");
    expect(AUTH_MASTER_SPEC.login.copy.signIn).toBe("Sign In");
    expect(AUTH_MASTER_SPEC.login.copy.createAccount).toBe("Create Free Account");
    expect(AUTH_MASTER_SPEC.login.socialProviders).toEqual(["apple", "google", "facebook"]);
  });

  it("implements login screen with approved auth components", () => {
    const page = readSource("app/(auth)/login/page.tsx");
    const screen = readSource("features/auth/components/LoginScreen.tsx");
    const layout = readSource("app/(auth)/login/layout.tsx");

    expect(page).toContain("LoginScreen");
    expect(page).toContain("redirectIfAuthenticated");
    expect(screen).toContain("RovexoBrandLogo");
    expect(screen).toContain("AuthBackButton");
    expect(screen).toContain("AuthIconInput");
    expect(screen).toContain("AuthPasswordInput");
    expect(screen).toContain("Checkbox");
    expect(screen).toContain("PrimaryButton");
    expect(screen).toContain("SocialLogin");
    expect(screen).toContain("AuthFooter");
    expect(screen).toContain('name="remember"');
    expect(screen).toContain('href="/forgot-password"');
    expect(screen).toContain('href="/register"');
    expect(screen).toContain('data-auth-version="v1.0-legal-lock"');
    expect(layout).toContain("auth-login-route");
  });

  it("uses fade-only login CSS without scale or bounce", () => {
    const css = readSource("styles/rovexo/auth-v1.css");
    expect(css).toContain("auth-login-fade-in");
    expect(css).toContain("auth-login-route");
    expect(css).toContain("auth-primary-button--gradient");
    expect(css).toContain("auth-icon-field");
    expect(css).not.toMatch(/auth-login[^{]*\{[^}]*scale\(/);
    expect(css).not.toMatch(/bounce/);
  });

  it("bypasses AuthShell on login route", () => {
    const routeLayout = readSource("components/auth/AuthRouteLayout.tsx");
    expect(routeLayout).toContain("AUTH_ROUTES.login");
  });

  it("preserves signIn server action with remember persistence", () => {
    const screen = readSource("features/auth/components/LoginScreen.tsx");
    const actions = readSource("lib/auth/actions.ts");
    expect(screen).toContain("signIn");
    expect(actions).toContain('formData.get("remember")');
  });
});
