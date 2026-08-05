import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AUTH_SENIOR_AUDIT_V1 } from "@/lib/auth/auth-senior-audit-v1";
import { ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1 } from "@/lib/auth/oauth-configuration-golden-law-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Auth Senior Audit v1.0 — LEVEL 5 VERDICT · P10.6R", () => {
  it("locks verdict: code correct, no code changes, live Google awaiting", () => {
    expect(AUTH_SENIOR_AUDIT_V1.status).toBe("OWNER_AUDIT_RECORDED_LOCKED");
    expect(AUTH_SENIOR_AUDIT_V1.verdict.codeIsCorrect).toBe(true);
    expect(AUTH_SENIOR_AUDIT_V1.verdict.architectureIsCorrect).toBe(true);
    expect(AUTH_SENIOR_AUDIT_V1.verdict.buttonsAreCorrect).toBe(true);
    expect(AUTH_SENIOR_AUDIT_V1.verdict.rootCause).toBe(
      "AWAITING_OWNER_LIVE_GOOGLE_CONFIRMATION",
    );
    expect(AUTH_SENIOR_AUDIT_V1.verdict.noCodeChangesRequired).toBe(true);
  });

  it("locks platform PASS · Google live awaiting · Apple/FB deferred", () => {
    expect(AUTH_SENIOR_AUDIT_V1.authSystem.emailLogin).toBe("PASS");
    expect(AUTH_SENIOR_AUDIT_V1.authSystem.header).toBe("PASS");
    expect(AUTH_SENIOR_AUDIT_V1.authSystem.googleOpsConfigured).toBe("PASS");
    expect(AUTH_SENIOR_AUDIT_V1.authSystem.googleLogin).toBe(
      "AWAITING_OWNER_LIVE_CONFIRMATION",
    );
    expect(AUTH_SENIOR_AUDIT_V1.authSystem.appleLogin).toBe(
      "DEFERRED_V2_NOT_BLOCKING",
    );
    expect(AUTH_SENIOR_AUDIT_V1.authSystem.facebookLogin).toBe(
      "DEFERRED_V2_NOT_BLOCKING",
    );
    expect(AUTH_SENIOR_AUDIT_V1.codeAudit.oauthButtons).toBe("PASS");
    expect(AUTH_SENIOR_AUDIT_V1.supabaseAudit.googleEnabled).toBe(
      "PASS_OPS_CONFIGURED",
    );
  });

  it("locks root-cause checklist and smallest fix", () => {
    expect(AUTH_SENIOR_AUDIT_V1.rootCauseChecklist.code).toBe(false);
    expect(AUTH_SENIOR_AUDIT_V1.rootCauseChecklist.supabaseConfiguration).toBe(
      false,
    );
    expect(
      AUTH_SENIOR_AUDIT_V1.rootCauseChecklist.awaitingOwnerLiveGoogleConfirmation,
    ).toBe(true);
    expect(AUTH_SENIOR_AUDIT_V1.smallestFix).toContain(
      "OWNER LIVE GOOGLE LOGIN CONFIRMATION",
    );
    expect(AUTH_SENIOR_AUDIT_V1.productionGate.ifGoogleLiveFails).toBe(
      "NO DEPLOY",
    );
    expect(AUTH_SENIOR_AUDIT_V1.productionGate.ifAppleDeferred).toBe(
      "DO NOT BLOCK V1",
    );
    expect(
      AUTH_SENIOR_AUDIT_V1.productionGate.ifGoogleOrAppleOrFacebookFail,
    ).toBe("SUPERSEDED_BY_GOOGLE_LIVE_ONLY");
  });

  it("aligns with OAuth Configuration Golden Law and roadmap", () => {
    expect(
      ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.ROOT_CAUSE.SUPABASE_CONFIGURATION,
    ).toBe(false);
    expect(
      ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.ROOT_CAUSE
        .AWAITING_OWNER_LIVE_GOOGLE_CONFIRMATION,
    ).toBe(true);
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.ROOT_CAUSE.CODE).toBe(false);
    expect(AUTH_SENIOR_AUDIT_V1.authenticationRoadmap.googleOauth).toBe(
      "REQUIRED_V1",
    );
    expect(AUTH_SENIOR_AUDIT_V1.authenticationRoadmap.appleOauth).toBe(
      "DEFERRED_V2_NOT_BLOCKING",
    );
    const rule = readSource(".cursor/rules/auth-senior-audit-v1.mdc");
    expect(rule).toContain("NO CODE CHANGES REQUIRED");
    expect(rule).toContain("DEFERRED_V2_NOT_BLOCKING");
  });
});
