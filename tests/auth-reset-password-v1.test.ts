import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_MASTER_SPEC, AUTH_MASTER_SPEC_VERSION } from "@/lib/auth/master-spec";
import { AUTH_ROUTES } from "@/lib/auth/canonical";
import { scoreResetPassword, validateResetPasswordStrength } from "@/lib/auth/password-strength";

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
    expect(AUTH_MASTER_SPEC.resetPassword.copy.expiredTitle).toBe("Link expired");
  });

  it("implements reset password screen with canonical auth components", () => {
    const page = readSource("app/(auth)/reset-password/page.tsx");
    const screen = readSource("features/auth/components/ResetPasswordScreen.tsx");
    const layout = readSource("app/(auth)/reset-password/layout.tsx");

    expect(page).toContain("ResetPasswordScreen");
    expect(page).toContain("resolveTokenState");
    expect(screen).toContain("RovexoBrandLogo");
    expect(screen).toContain("AuthPasswordInput");
    expect(screen).toContain("auth-password-strength");
    expect(screen).toContain("data-auth-token-state");
    expect(screen).toContain('data-auth-version="v1.0-legal-lock"');
    expect(screen).not.toContain("RovexoAppIconMark");
    expect(layout).toContain("auth-reset-password-route");
  });

  it("scores password strength across five requirements", () => {
    expect(scoreResetPassword("").score).toBe(0);
    expect(scoreResetPassword("Password1!").score).toBe(5);
    expect(validateResetPasswordStrength("short")).toMatch(/8 characters/);
    expect(validateResetPasswordStrength("password1!")).toMatch(/uppercase/);
    expect(validateResetPasswordStrength("PASSWORD1!")).toMatch(/lowercase/);
    expect(validateResetPasswordStrength("Password!")).toMatch(/number/);
    expect(validateResetPasswordStrength("Password1")).toMatch(/special character/);
    expect(validateResetPasswordStrength("Password1!")).toBeNull();
  });

  it("returns success without auto-login redirect", () => {
    const actions = readSource("lib/auth/actions.ts");
    const screen = readSource("features/auth/components/ResetPasswordScreen.tsx");

    expect(actions).toContain("signOut");
    expect(actions).toContain('success: "Password updated successfully."');
    expect(actions).not.toMatch(/updatePassword[\s\S]*redirect\("/account"\)/);
    expect(screen).toContain("Go to Sign In");
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
