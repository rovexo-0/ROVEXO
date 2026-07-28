import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AUTH_UI_COMPACT_PREMIUM_V1_3 } from "@/lib/auth/auth-ui-compact-premium-v1.3";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("AUTH UI Compact Premium v1.3", () => {
  it("locks Owner Compact Premium v1.3 status", () => {
    expect(AUTH_UI_COMPACT_PREMIUM_V1_3.version).toBe("1.3");
    expect(AUTH_UI_COMPACT_PREMIUM_V1_3.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(AUTH_UI_COMPACT_PREMIUM_V1_3.emailPasswordOnly).toBe(true);
  });

  it("locks Login trust copy and Create Account as text link (v1.4)", () => {
    const login = readSource("features/auth/components/LoginScreen.tsx");
    expect(login).toContain("SECURE SIGN IN");
    expect(login).toContain("Your data is protected.");
    expect(login).toContain("New to ROVEXO?");
    expect(login).toContain("auth-login__register-cta");
    expect(login).not.toContain("SecondaryButton");
    expect(login).not.toContain("SocialLogin");
    expect(login).toContain('data-auth-version="canonical-freeze-v1"');
  });

  it("locks Register Cod Sânge — no marketing / secure note; contextual validation only", () => {
    const register = readSource("features/auth/components/RegisterScreen.tsx");
    expect(register).toContain("Receive ROVEXO news and offers (OPTIONAL)");
    expect(register).toContain("SECURE REGISTRATION");
    expect(register).toContain("Your account is protected.");
    expect(register).not.toContain("passwordHint");
    expect(register).not.toContain("auth-password-strength");
    expect(register).not.toContain('name="gdpr"');
    expect(register).not.toContain("SocialLogin");
    expect(register).toContain('data-auth-version="canonical-freeze-v1"');
    expect(register).toContain("Invalid email address.");
    expect(register).toContain("Password must contain at least 8 characters.");
    expect(register).toContain("Passwords do not match.");
  });

  it("keeps email auth actions and platform purple CTA CSS", () => {
    const actions = readSource("lib/auth/actions.ts");
    const css = readSource("styles/rovexo/auth-v1.css");
    expect(actions).toContain("signInWithPassword");
    expect(actions).toContain("supabase.auth.signUp");
    expect(css).toContain("AUTH UI COMPACT PREMIUM v1.4");
    expect(css).toContain("--auth-gradient-cta");
  });
});
