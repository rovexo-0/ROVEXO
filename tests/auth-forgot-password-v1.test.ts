import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_MASTER_SPEC, AUTH_MASTER_SPEC_VERSION } from "@/lib/auth/master-spec";
import { AUTH_ROUTES } from "@/lib/auth/canonical";
import { mapAuthErrorMessage } from "@/lib/auth/errors";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("AUTH_MASTER_SPEC v1.0 — forgot password screen", () => {
  it("locks forgot password copy, routes, and fade timing", () => {
    expect(AUTH_MASTER_SPEC_VERSION).toBe("v1.0");
    expect(AUTH_ROUTES.forgotPassword).toBe("/forgot-password");
    expect(AUTH_MASTER_SPEC.forgotPassword.fadeDurationMs).toBe(225);
    expect(AUTH_MASTER_SPEC.forgotPassword.presentation.background).toBe("#ffffff");
    expect(AUTH_MASTER_SPEC.forgotPassword.copy.title).toBe("Forgot your password?");
    expect(AUTH_MASTER_SPEC.forgotPassword.copy.submit).toBe("Send Reset Link");
    expect(AUTH_MASTER_SPEC.forgotPassword.copy.successTitle).toBe("Check your email");
    expect(AUTH_MASTER_SPEC.forgotPassword.copy.openEmailApp).toBe("Open Email App");
    expect(AUTH_MASTER_SPEC.forgotPassword.routes.back).toBe("/login");
  });

  it("implements forgot password screen with canonical auth components", () => {
    const page = readSource("app/(auth)/forgot-password/page.tsx");
    const screen = readSource("features/auth/components/ForgotPasswordScreen.tsx");
    const layout = readSource("app/(auth)/forgot-password/layout.tsx");

    expect(page).toContain("ForgotPasswordScreen");
    expect(page).toContain("redirectIfAuthenticated");
    expect(screen).toContain("RovexoBrandLogo");
    expect(screen).toContain("AuthBackButton");
    expect(screen).toContain("AuthIconInput");
    expect(screen).toContain("PrimaryButton");
    expect(screen).toContain("SecondaryButton");
    expect(screen).toContain('autoComplete="email"');
    expect(screen).toContain("autoFocus");
    expect(screen).toContain("auth-forgot-password__success");
    expect(screen).toContain('data-auth-version="v1.0-legal-lock"');
    expect(screen).not.toContain("RovexoAppIconMark");
    expect(layout).toContain("auth-forgot-password-route");
  });

  it("maps reset errors and preserves success confirmation", () => {
    const actions = readSource("lib/auth/actions.ts");
    const screen = readSource("features/auth/components/ForgotPasswordScreen.tsx");

    expect(actions).toContain("requestPasswordReset");
    expect(actions).toContain("No account found for that email address.");
    expect(actions).toContain("Too many reset attempts");
    expect(actions).toContain("Unable to send reset link. Please try again.");
    expect(actions).toContain("mapAuthErrorMessage(error.message)");
    expect(screen).toContain("requestPasswordReset");
    expect(screen).toContain("AuthAlert");
    expect(screen).toContain("offlineError");
    expect(screen).not.toContain("router.push");
    expect(screen).not.toContain("redirect(");
  });

  it("never surfaces JSON-empty Auth messages like \"{}\" to the user", () => {
    const fallback = "Unable to send reset link. Please try again.";
    expect(mapAuthErrorMessage("{}") || fallback).toBe(fallback);
    expect(mapAuthErrorMessage("") || fallback).toBe(fallback);
    expect(mapAuthErrorMessage("   ") || fallback).toBe(fallback);
    expect(mapAuthErrorMessage(null) || fallback).toBe(fallback);
    expect(mapAuthErrorMessage(undefined) || fallback).toBe(fallback);
    expect(mapAuthErrorMessage("[object Object]") || fallback).toBe(fallback);
    expect(mapAuthErrorMessage("{}")).not.toBe("{}");
    expect(mapAuthErrorMessage("Invalid login credentials") || fallback).toBe(
      "Incorrect email or password.",
    );
  });

  it("uses fade-only forgot password CSS without scale or bounce", () => {
    const css = readSource("styles/rovexo/auth-v1.css");
    expect(css).toContain("auth-forgot-password-route");
    expect(css).toContain("auth-forgot-password__success-actions");
    expect(css).not.toMatch(/auth-forgot-password[^{]*\{[^}]*scale\(/);
    expect(css).not.toMatch(/bounce/);
  });

  it("bypasses AuthShell on forgot password route", () => {
    const routeLayout = readSource("components/auth/AuthRouteLayout.tsx");
    expect(routeLayout).toContain("AUTH_ROUTES.forgotPassword");
  });
});
