import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_LOGIN_REGISTER_CANONICAL_FREEZE_V1 } from "@/lib/auth/auth-login-register-canonical-freeze-v1";
import { CANONICAL_LOGO_ENGINE_V1 } from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("AUTH Login/Register Canonical Freeze v1", () => {
  it("locks freeze SSOT as Owner certified", () => {
    expect(AUTH_LOGIN_REGISTER_CANONICAL_FREEZE_V1.status).toBe("LOCKED_FROZEN_CERTIFIED");
    expect(AUTH_LOGIN_REGISTER_CANONICAL_FREEZE_V1.ownerCertified).toBe(true);
    expect(AUTH_LOGIN_REGISTER_CANONICAL_FREEZE_V1.freezeLocked).toBe(true);
    expect(AUTH_LOGIN_REGISTER_CANONICAL_FREEZE_V1.score.login).toBe("100%");
    expect(AUTH_LOGIN_REGISTER_CANONICAL_FREEZE_V1.score.register).toBe("100%");
    expect(CANONICAL_LOGO_ENGINE_V1.status).toBe("LOCKED_FROZEN_CERTIFIED");
    expect(CANONICAL_LOGO_ENGINE_V1.freezeLocked).toBe(true);
  });

  it("locks Login mandatory stack without Welcome copy", () => {
    const login = readSource("features/auth/components/LoginScreen.tsx");
    expect(login).toContain('data-auth-freeze="LOCKED_FROZEN_CERTIFIED"');
    expect(login).toContain("RovexoBrandLogo");
    expect(login).toContain("Remember Me");
    expect(login).toContain("Forgot Password?");
    expect(login).toContain("SECURE SIGN IN");
    expect(login).toContain("Create Account");
    expect(login).not.toContain("Welcome Back");
    expect(login).not.toContain("Good to see you again");
  });

  it("locks Register mandatory stack without Join ROVEXO Today", () => {
    const register = readSource("features/auth/components/RegisterScreen.tsx");
    expect(register).toContain('data-auth-freeze="LOCKED_FROZEN_CERTIFIED"');
    expect(register).toContain("RovexoBrandLogo");
    expect(register).toContain("Full Name");
    expect(register).toContain('name="terms"');
    expect(register).toContain('name="marketing"');
    expect(register).toContain("Create Free Account");
    expect(register).toContain("SECURE REGISTRATION");
    expect(register).toContain("Sign In");
    expect(register).not.toContain("Join ROVEXO Today");
  });
});
