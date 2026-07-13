import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_MASTER_SPEC, AUTH_MASTER_SPEC_VERSION } from "@/lib/auth/master-spec";
import { AUTH_ROUTES } from "@/lib/auth/canonical";
import {
  getResetPasswordRequirements,
  mapResetPasswordClientError,
  scoreResetPassword,
  validateResetPasswordStrength,
} from "@/lib/auth/password-strength";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("AUTH_MASTER_SPEC v1.0 — reset password screen", () => {
  it("locks reset password copy, routes, and fade timing", () => {
    expect(AUTH_MASTER_SPEC_VERSION).toBe("v1.0");
    expect(AUTH_ROUTES.resetPassword).toBe("/reset-password");
    expect(AUTH_MASTER_SPEC.resetPassword.fadeDurationMs).toBe(225);
    expect(AUTH_MASTER_SPEC.resetPassword.copy.submit).toBe("Reset Password");
    expect(AUTH_MASTER_SPEC.resetPassword.copy.successTitle).toBe("Password updated successfully");
    expect(AUTH_MASTER_SPEC.resetPassword.copy.invalidTitle).toBe("Invalid link");
    expect(AUTH_MASTER_SPEC.resetPassword.copy.expiredTitle).toBe(
      "Your password reset link has expired.",
    );
    expect(AUTH_MASTER_SPEC.resetPassword.copy.requestNewLink).toBe("Request New Reset Link");
  });

  it("implements reset password screen with canonical auth components", () => {
    const page = readSource("app/(auth)/reset-password/page.tsx");
    const screen = readSource("features/auth/components/ResetPasswordScreen.tsx");
    const layout = readSource("app/(auth)/reset-password/layout.tsx");

    expect(page).toContain("ResetPasswordScreen");
    expect(page).toContain("resolveTokenState");
    expect(screen).toContain("RovexoBrandLogo");
    expect(screen).toContain("AuthPasswordInput");
    expect(screen).toContain("ResetPasswordChecklist");
    expect(screen).toContain("ResetPasswordStrengthMeter");
    expect(screen).toContain("data-auth-token-state");
    expect(screen).toContain('data-auth-version="v1.0-legal-lock"');
    expect(screen).not.toContain("RovexoAppIconMark");
    expect(layout).toContain("auth-reset-password-route");
  });

  it("tracks live password requirements and five strength levels", () => {
    expect(scoreResetPassword("").score).toBe(0);
    expect(scoreResetPassword("a").label).toBe("Very Weak");
    expect(scoreResetPassword("Pass").label).toBe("Weak");
    expect(scoreResetPassword("Password").label).toBe("Medium");
    expect(scoreResetPassword("Password1").label).toBe("Strong");
    expect(scoreResetPassword("Password1!").score).toBe(5);
    expect(scoreResetPassword("Password1!").label).toBe("Excellent");

    const requirements = getResetPasswordRequirements("Password1!");
    expect(requirements.every((item) => item.met)).toBe(true);
    expect(validateResetPasswordStrength("Password1!")).toBeNull();
    expect(validateResetPasswordStrength("short")).toBe(
      AUTH_MASTER_SPEC.resetPassword.copy.errors.weakPassword,
    );
  });

  it("maps granular reset password errors", () => {
    const { errors } = AUTH_MASTER_SPEC.resetPassword.copy;
    expect(mapResetPasswordClientError(errors.passwordsMismatch)).toBe(errors.passwordsMismatch);
    expect(mapResetPasswordClientError(errors.expiredToken)).toBe(errors.expiredToken);
    expect(mapResetPasswordClientError(errors.offline)).toBe(errors.offline);
    expect(mapResetPasswordClientError(errors.tooManyRequests)).toBe(errors.tooManyRequests);
    expect(mapResetPasswordClientError("random failure")).toBe(errors.unknown);
  });

  it("supports password managers and independent visibility toggles", () => {
    const screen = readSource("features/auth/components/ResetPasswordScreen.tsx");
    const input = readSource("components/auth/AuthPasswordInput.tsx");

    expect(screen).toContain('autoComplete="new-password"');
    expect(screen).toContain('autoComplete="on"');
    expect(screen).toContain('inputId="reset-password-new"');
    expect(screen).toContain('inputId="reset-password-confirm"');
    expect(input).toContain("setVisible");
    expect(input).not.toContain("onPaste");
    expect(input).not.toContain('autoComplete="off"');
  });

  it("returns success without auto-login redirect", () => {
    const actions = readSource("lib/auth/actions.ts");
    const screen = readSource("features/auth/components/ResetPasswordScreen.tsx");

    expect(actions).toContain("signOut");
    expect(actions).toContain('success: "Password updated successfully."');
    expect(actions).toContain("errors.tooManyRequests");
    expect(actions).not.toMatch(/updatePassword[\s\S]*redirect\("\/account"\)/);
    expect(screen).toContain("copy.goToSignIn");
    expect(screen).toContain("auth-reset-password__success-icon");
    expect(screen).not.toContain('redirect("/account")');
  });

  it("routes invalid and expired recovery tokens to reset screen", () => {
    const callback = readSource("app/auth/callback/route.ts");
    expect(callback).toContain("/reset-password?error=");
    expect(readSource("lib/supabase/middleware.ts")).not.toContain("reset_session_required");
  });

  it("bypasses AuthShell on reset password route", () => {
    const routeLayout = readSource("components/auth/AuthRouteLayout.tsx");
    expect(routeLayout).toContain("AUTH_ROUTES.resetPassword");
  });
});
