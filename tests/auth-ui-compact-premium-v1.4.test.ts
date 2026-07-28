import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AUTH_UI_COMPACT_PREMIUM_V1_4 } from "@/lib/auth/auth-ui-compact-premium-v1.4";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("AUTH UI Compact Premium v1.4", () => {
  it("locks Create Account as text link not secondary button", () => {
    expect(AUTH_UI_COMPACT_PREMIUM_V1_4.version).toBe("1.4");
    expect(AUTH_UI_COMPACT_PREMIUM_V1_4.createAccount.style).toBe(
      "centered_text_link",
    );
    expect(AUTH_UI_COMPACT_PREMIUM_V1_4.createAccount.largeButtonForbidden).toBe(
      true,
    );

    const login = readSource("features/auth/components/LoginScreen.tsx");
    expect(login).toContain("New to ROVEXO?");
    expect(login).toContain("Create Account");
    expect(login).toContain("auth-login__register-cta");
    expect(login).not.toContain("SecondaryButton");
    expect(login).not.toContain("auth-secondary-button--platform");
    expect(login).toContain("SECURE SIGN IN");
    expect(login).toContain('data-auth-version="canonical-freeze-v1"');
    expect(login).not.toContain("SocialLogin");
    expect(login).not.toContain("Welcome Back");
  });

  it("keeps Register Cod Sânge — no marketing / secure note clutter", () => {
    const register = readSource("features/auth/components/RegisterScreen.tsx");
    expect(register).toContain("Receive ROVEXO news and offers (OPTIONAL)");
    expect(register).toContain("SECURE REGISTRATION");
    expect(register).not.toContain("SocialLogin");
    expect(register).not.toContain('name="gdpr"');
    expect(register).not.toContain("auth-password-strength");
    expect(register).toContain('data-auth-version="canonical-freeze-v1"');
    expect(register).toContain("Create Free Account");
  });
});
