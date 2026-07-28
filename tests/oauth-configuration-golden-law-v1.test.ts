import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1 } from "@/lib/auth/oauth-configuration-golden-law-v1";
import { OAUTH_CONFIGURATION_FREEZE_V1 } from "@/lib/auth/oauth-configuration-freeze-v1";
import { DEPLOYMENT_GOLDEN_LAW_V1 } from "@/lib/deployment-golden-law-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("OAuth Configuration Golden Law v1.0 — LEVEL 8", () => {
  it("locks Owner canonical Object.freeze law", () => {
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.VERSION).toBe("1.0");
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.STATUS).toBe("LOCKED");
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.LEVEL).toBe(8);
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.CANONICAL).toBe(true);
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.APPROVED_BY_OWNER).toBe(
      true,
    );
    expect(Object.isFrozen(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1)).toBe(true);
  });

  it("locks root cause as Supabase configuration only", () => {
    const root = ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.ROOT_CAUSE;
    expect(root.SUPABASE_CONFIGURATION).toBe(true);
    expect(root.CODE).toBe(false);
    expect(root.ARCHITECTURE).toBe(false);
    expect(root.AUTH_SYSTEM).toBe(false);
    expect(root.ERROR).toContain("provider is not enabled");
  });

  it("locks auth core PASS and OAuth FAIL until enabled", () => {
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.AUTH_CORE.EMAIL_LOGIN).toBe(
      true,
    );
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.AUTH_CORE.PRODUCTION_READY).toBe(
      true,
    );
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.OAUTH.GOOGLE).toBe(false);
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.OAUTH.APPLE).toBe(false);
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.OAUTH.FACEBOOK).toBe(false);
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.OAUTH.ROOT_CAUSE).toBe(
      "Provider Disabled",
    );
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.SUCCESS_GATES.PRODUCTION_READY).toBe(
      false,
    );
  });

  it("locks callbacks and provider requirements", () => {
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.CALLBACKS.LOCAL).toBe(
      "http://localhost:3000/auth/callback",
    );
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.CALLBACKS.PRODUCTION).toBe(
      "https://rovexo.com/auth/callback",
    );
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.PROVIDERS.GOOGLE).toBe(
      "MUST BE ENABLED",
    );
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.PROVIDERS.FACEBOOK).toBe(
      "OPTIONAL BUT SUPPORTED",
    );
  });

  it("forbids auth rewrites and allows configuration only", () => {
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.FORBIDDEN).toContain(
      "CODE CHANGES FOR CONFIG ERRORS",
    );
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.FORBIDDEN).toContain(
      "AUTH V2",
    );
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.ALLOWED).toContain(
      "ENABLE GOOGLE",
    );
    expect(
      ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.DEPLOYMENT.IF_CONFIGURATION_FAILS,
    ).toBe("FIX CONFIGURATION ONLY");
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.DEPLOYMENT.IF_99_PERCENT).toBe(
      "NO DEPLOY",
    );
  });

  it("links freeze companion, deployment law, and cursor rule", () => {
    expect(
      OAUTH_CONFIGURATION_FREEZE_V1.ssot.oauthConfigurationGoldenLaw,
    ).toBe("lib/auth/oauth-configuration-golden-law-v1.ts");
    expect(DEPLOYMENT_GOLDEN_LAW_V1.firstDeployLaw.exactPassRequired).toBe(
      "100/100",
    );
    const rule = readSource(
      ".cursor/rules/oauth-configuration-golden-law-v1.mdc",
    );
    expect(rule).toContain("NO CODE CHANGES");
    expect(rule).toContain("provider is not enabled");
  });
});
