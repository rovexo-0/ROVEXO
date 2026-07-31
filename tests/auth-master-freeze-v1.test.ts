import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AUTH_MASTER_FREEZE_V1 } from "@/lib/auth/auth-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("AUTH Master Freeze v1.0 — OWNER LOCKED", () => {
  it("locks Owner-approved Supabase Auth singularity", () => {
    expect(AUTH_MASTER_FREEZE_V1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(AUTH_MASTER_FREEZE_V1.approvedByOwner).toBe(true);
    expect(AUTH_MASTER_FREEZE_V1.freezeLocked).toBe(true);
    expect(AUTH_MASTER_FREEZE_V1.ssotReady).toBe(true);
    expect(AUTH_MASTER_FREEZE_V1.canonicalAuthSystem).toBe("SUPABASE_AUTH");
    expect(AUTH_MASTER_FREEZE_V1.singularity.oneAuthSystem).toBe("SUPABASE_AUTH");
    expect(AUTH_MASTER_FREEZE_V1.singularity.oneSessionOwner).toBe("SUPABASE_AUTH");
    expect(AUTH_MASTER_FREEZE_V1.singularity.oneCookieOwner).toBe("SUPABASE_AUTH");
    expect(AUTH_MASTER_FREEZE_V1.singularity.oneUserOwner).toBe("SUPABASE_AUTH");
    expect(AUTH_MASTER_FREEZE_V1.singularity.oneCallbackOwner).toBe("SUPABASE_AUTH");
  });

  it("locks login and register methods", () => {
    expect(AUTH_MASTER_FREEZE_V1.loginMethods.email).toBe("ACTIVE");
    expect(AUTH_MASTER_FREEZE_V1.loginMethods.google).toBe("ACTIVE");
    expect(AUTH_MASTER_FREEZE_V1.loginMethods.apple).toBe("ACTIVE");
    expect(AUTH_MASTER_FREEZE_V1.loginMethods.facebook).toBe("OPTIONAL");
    expect(AUTH_MASTER_FREEZE_V1.registerMethods.email).toBe("ACTIVE");
    expect(AUTH_MASTER_FREEZE_V1.registerMethods.google).toBe("ACTIVE");
    expect(AUTH_MASTER_FREEZE_V1.registerMethods.apple).toBe("ACTIVE");
    expect(AUTH_MASTER_FREEZE_V1.registerMethods.facebook).toBe("OPTIONAL");
  });

  it("locks Owner-approved callback origins", () => {
    expect(AUTH_MASTER_FREEZE_V1.allowedOrigins.localDevelopment).toBe(
      "http://localhost:3000",
    );
    expect(AUTH_MASTER_FREEZE_V1.allowedOrigins.production).toBe("https://www.rovexo.co.uk");
    expect(AUTH_MASTER_FREEZE_V1.allowedOrigins.stagingOptional).toBe(
      "https://staging.rovexo.com",
    );
    expect(AUTH_MASTER_FREEZE_V1.callbackPath).toBe("/auth/callback");
  });

  it("locks required and production gates at PASS", () => {
    for (const value of Object.values(AUTH_MASTER_FREEZE_V1.requiredGates)) {
      expect(value).toBe("PASS");
    }
    for (const value of Object.values(AUTH_MASTER_FREEZE_V1.productionGates)) {
      expect(value).toBe("PASS");
    }
  });

  it("keeps single Supabase Auth implementation surfaces", () => {
    const actions = readSource("lib/auth/actions.ts");
    expect(actions).toContain("supabase.auth.signInWithPassword");
    expect(actions).toContain("supabase.auth.signInWithOAuth");
    expect(actions).toContain("supabase.auth.signUp");
    expect(actions).toContain("supabase.auth.signOut");

    const callback = readSource("app/auth/callback/route.ts");
    expect(callback).toContain("exchangeCodeForSession");

    const freezeRule = readSource(".cursor/rules/auth-master-freeze-v1.mdc");
    expect(freezeRule).toContain("Supabase Auth");
    expect(freezeRule).toContain("http://localhost:3000");
  });

  it("aligns local supabase redirect allowlist to Owner local origin", () => {
    const config = readSource("supabase/config.toml");
    expect(config).toContain("http://localhost:3000");
    expect(config).toContain("http://localhost:3000/auth/callback");
    expect(config).not.toContain("http://localhost:3010/auth/callback");
  });
});
