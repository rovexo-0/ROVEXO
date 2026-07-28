import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AUTH_SENIOR_AUDIT_V1 } from "@/lib/auth/auth-senior-audit-v1";
import { ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1 } from "@/lib/auth/oauth-configuration-golden-law-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Auth Senior Audit v1.0 — LEVEL 5 VERDICT", () => {
  it("locks verdict: code correct, config is root cause, no code changes", () => {
    expect(AUTH_SENIOR_AUDIT_V1.status).toBe("OWNER_AUDIT_RECORDED_LOCKED");
    expect(AUTH_SENIOR_AUDIT_V1.verdict.codeIsCorrect).toBe(true);
    expect(AUTH_SENIOR_AUDIT_V1.verdict.architectureIsCorrect).toBe(true);
    expect(AUTH_SENIOR_AUDIT_V1.verdict.buttonsAreCorrect).toBe(true);
    expect(AUTH_SENIOR_AUDIT_V1.verdict.rootCause).toBe(
      "SUPABASE_OAUTH_CONFIGURATION",
    );
    expect(AUTH_SENIOR_AUDIT_V1.verdict.noCodeChangesRequired).toBe(true);
  });

  it("locks platform PASS and OAuth FAIL", () => {
    expect(AUTH_SENIOR_AUDIT_V1.authSystem.emailLogin).toBe("PASS");
    expect(AUTH_SENIOR_AUDIT_V1.authSystem.header).toBe("PASS");
    expect(AUTH_SENIOR_AUDIT_V1.authSystem.googleLogin).toBe("FAIL");
    expect(AUTH_SENIOR_AUDIT_V1.codeAudit.oauthButtons).toBe("PASS");
    expect(AUTH_SENIOR_AUDIT_V1.supabaseAudit.googleEnabled).toBe("FAIL");
  });

  it("locks root-cause checklist and smallest fix", () => {
    expect(AUTH_SENIOR_AUDIT_V1.rootCauseChecklist.code).toBe(false);
    expect(AUTH_SENIOR_AUDIT_V1.rootCauseChecklist.supabaseConfiguration).toBe(
      true,
    );
    expect(AUTH_SENIOR_AUDIT_V1.smallestFix).toContain("ENABLE Google");
    expect(AUTH_SENIOR_AUDIT_V1.smallestFix).toContain(
      "ADD http://localhost:3000/auth/callback",
    );
    expect(AUTH_SENIOR_AUDIT_V1.productionGate.ifGoogleOrAppleOrFacebookFail).toBe(
      "NO DEPLOY",
    );
  });

  it("aligns with OAuth Configuration Golden Law", () => {
    expect(
      ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.ROOT_CAUSE.SUPABASE_CONFIGURATION,
    ).toBe(true);
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.ROOT_CAUSE.CODE).toBe(false);
    const rule = readSource(".cursor/rules/auth-senior-audit-v1.mdc");
    expect(rule).toContain("NO CODE CHANGES REQUIRED");
    expect(rule).toContain("SUPABASE OAUTH CONFIGURATION");
  });
});
