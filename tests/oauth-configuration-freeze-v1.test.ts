import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { OAUTH_CONFIGURATION_FREEZE_V1 } from "@/lib/auth/oauth-configuration-freeze-v1";
import { AUTH_MASTER_FREEZE_V1 } from "@/lib/auth/auth-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("OAuth Configuration Freeze v1.0 — LEVEL 8", () => {
  it("locks Owner-approved configuration-only mission", () => {
    expect(OAUTH_CONFIGURATION_FREEZE_V1.status).toBe(
      "OWNER_APPROVED_LOCKED_FROZEN",
    );
    expect(OAUTH_CONFIGURATION_FREEZE_V1.approvedByOwner).toBe(true);
    expect(OAUTH_CONFIGURATION_FREEZE_V1.freezeLocked).toBe(true);
    expect(OAUTH_CONFIGURATION_FREEZE_V1.level).toBe(8);
    expect(OAUTH_CONFIGURATION_FREEZE_V1.mission.noCodeChangesRequired).toBe(
      true,
    );
    expect(OAUTH_CONFIGURATION_FREEZE_V1.mission.onlyConfigurationAllowed).toBe(
      true,
    );
  });

  it("locks the single root cause and GoTrue error triad", () => {
    expect(OAUTH_CONFIGURATION_FREEZE_V1.rootCause.onlyOne).toBe(true);
    expect(OAUTH_CONFIGURATION_FREEZE_V1.rootCause.statement).toContain(
      "NOT ENABLED",
    );
    expect(OAUTH_CONFIGURATION_FREEZE_V1.rootCause.error.http).toBe(400);
    expect(OAUTH_CONFIGURATION_FREEZE_V1.rootCause.error.code).toBe(
      "validation_failed",
    );
    expect(OAUTH_CONFIGURATION_FREEZE_V1.rootCause.error.message).toContain(
      "provider is not enabled",
    );
  });

  it("locks current PASS core auth and FAIL social login", () => {
    expect(OAUTH_CONFIGURATION_FREEZE_V1.currentStatus.emailLogin).toBe("PASS");
    expect(OAUTH_CONFIGURATION_FREEZE_V1.currentStatus.sessionRestore).toBe(
      "PASS",
    );
    expect(OAUTH_CONFIGURATION_FREEZE_V1.currentStatus.googleLogin).toBe("FAIL");
    expect(OAUTH_CONFIGURATION_FREEZE_V1.currentStatus.appleLogin).toBe("FAIL");
    expect(OAUTH_CONFIGURATION_FREEZE_V1.currentStatus.facebookLogin).toBe(
      "FAIL",
    );
  });

  it("locks Owner callback origins and path", () => {
    expect(OAUTH_CONFIGURATION_FREEZE_V1.callbackRules.local).toBe(
      "http://localhost:3000",
    );
    expect(OAUTH_CONFIGURATION_FREEZE_V1.callbackRules.production).toBe(
      "https://rovexo.com",
    );
    expect(OAUTH_CONFIGURATION_FREEZE_V1.callbackRules.authCallbackPath).toBe(
      "/auth/callback",
    );
  });

  it("forbids auth rewrites when OAuth fails", () => {
    expect(OAUTH_CONFIGURATION_FREEZE_V1.forbiddenForever).toContain(
      "Auth rewrites",
    );
    expect(OAUTH_CONFIGURATION_FREEZE_V1.forbiddenForever).toContain(
      "GOOGLE FAILS → REWRITE AUTH",
    );
    expect(
      OAUTH_CONFIGURATION_FREEZE_V1.masterFreeze.ifAuthWorksDoNotTouchIt,
    ).toBe(true);
    expect(
      OAUTH_CONFIGURATION_FREEZE_V1.masterFreeze
        .ifConfigurationFailsFixConfigurationOnly,
    ).toBe(true);
    expect(AUTH_MASTER_FREEZE_V1.canonicalAuthSystem).toBe("SUPABASE_AUTH");
  });

  it("keeps single Supabase OAuth call site (no parallel OAuth stack)", () => {
    const actions = readSource("lib/auth/actions.ts");
    expect(actions).toContain("signInWithOAuth");
    expect(actions).not.toContain("Clerk");
    expect(actions).not.toContain("NextAuth");
    expect(existsSync(join(process.cwd(), "app/auth/callback/route.ts"))).toBe(
      true,
    );
    const rule = readSource(".cursor/rules/oauth-configuration-freeze-v1.mdc");
    expect(rule).toContain("ONLY configuration");
    expect(rule).toContain("provider is not enabled");
  });
});
