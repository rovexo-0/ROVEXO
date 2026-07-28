import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AUTH_UI_MASTER_FREEZE_V1_2 } from "@/lib/auth/auth-ui-master-freeze-v1.2";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("AUTH UI Master Freeze v1.2", () => {
  it("locks Owner-approved UI freeze status", () => {
    expect(AUTH_UI_MASTER_FREEZE_V1_2.version).toBe("1.2");
    expect(AUTH_UI_MASTER_FREEZE_V1_2.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(AUTH_UI_MASTER_FREEZE_V1_2.approvedByOwner).toBe(true);
    expect(AUTH_UI_MASTER_FREEZE_V1_2.removedFromUi).toContain(
      "All Social Login UI",
    );
    expect(AUTH_UI_MASTER_FREEZE_V1_2.removedFromUi).toContain("UK GDPR checkbox");
  });

  it("removes social OAuth UI from Login and Register screens", () => {
    const login = readSource("features/auth/components/LoginScreen.tsx");
    const register = readSource("features/auth/components/RegisterScreen.tsx");

    expect(login).not.toContain("SocialLogin");
    expect(login).not.toContain("PREMIUM_SOCIAL");
    expect(login).not.toContain("Welcome Back");
    expect(login).toContain("SECURE SIGN IN");
    expect(login).toContain("auth-platform-theme");
    expect(login).toContain("canonical-freeze-v1");

    expect(register).not.toContain("SocialLogin");
    expect(register).not.toContain('name="gdpr"');
    expect(register).not.toContain("Join ROVEXO Today");
    expect(register).toContain("Receive ROVEXO news and offers (OPTIONAL)");
    expect(register).toContain('name="marketing"');
    expect(register).toContain('name="terms"');
    expect(register).toContain("canonical-freeze-v1");
    expect(register).toContain("auth-platform-theme");
  });

  it("keeps email auth actions and does not rewrite Supabase session paths", () => {
    const login = readSource("features/auth/components/LoginScreen.tsx");
    const register = readSource("features/auth/components/RegisterScreen.tsx");
    const actions = readSource("lib/auth/actions.ts");
    const css = readSource("styles/rovexo/auth-v1.css");

    expect(login).toContain("signIn");
    expect(register).toContain("signUp");
    expect(actions).toContain("signInWithPassword");
    expect(actions).toContain("supabase.auth.signUp");
    expect(css).toContain("AUTH UI MASTER FREEZE v1.2");
    expect(css).toContain("--auth-gradient-cta");
  });
});
