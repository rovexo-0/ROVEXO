import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROVEXO_PRODUCTION_CERTIFICATION_V1 } from "@/lib/rovexo-production-certification-v1";
import { DEPLOYMENT_GOLDEN_LAW_V1 } from "@/lib/deployment-golden-law-v1";
import { AUTH_SENIOR_AUDIT_V1 } from "@/lib/auth/auth-senior-audit-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Production Certification Law v1.0 — LEVEL 8 · P10.6R", () => {
  it("locks Owner-approved Object.freeze certification", () => {
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.VERSION).toBe("1.0");
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.STATUS).toBe("LOCKED");
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.LEVEL).toBe(8);
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.CANONICAL).toBe(true);
    expect(Object.isFrozen(ROVEXO_PRODUCTION_CERTIFICATION_V1)).toBe(true);
  });

  it("locks Authentication Roadmap P10.6R", () => {
    expect(
      ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTHENTICATION_ROADMAP.EMAIL_PASSWORD,
    ).toBe("REQUIRED_V1");
    expect(
      ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTHENTICATION_ROADMAP.GOOGLE_OAUTH,
    ).toBe("REQUIRED_V1");
    expect(
      ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTHENTICATION_ROADMAP.APPLE_OAUTH,
    ).toBe("DEFERRED_V2_NOT_BLOCKING");
    expect(
      ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTHENTICATION_ROADMAP.FACEBOOK_OAUTH,
    ).toBe("DEFERRED_V2_NOT_BLOCKING");
  });

  it("locks auth core PASS · Google ops PASS · Google live awaiting · Apple/FB deferred", () => {
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTH.EMAIL_LOGIN).toBe(true);
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTH.GOOGLE_OPS_CONFIGURED).toBe(
      true,
    );
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTH.GOOGLE_LOGIN).toBe(false);
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTH.GOOGLE_LIVE_STATUS).toBe(
      "AWAITING_OWNER_LIVE_CONFIRMATION",
    );
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTH.APPLE_LOGIN).toBe(false);
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTH.APPLE_ROADMAP).toBe(
      "DEFERRED_V2_NOT_BLOCKING",
    );
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTH.FACEBOOK_LOGIN).toBe(false);
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTH.FACEBOOK_ROADMAP).toBe(
      "DEFERRED_V2_NOT_BLOCKING",
    );
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.PRODUCTION_EQUATION.PRODUCTION_READY).toBe(
      false,
    );
  });

  it("locks production blockers — Apple/Facebook not blocking", () => {
    expect(
      ROVEXO_PRODUCTION_CERTIFICATION_V1.PRODUCTION_BLOCKERS_V1.GOOGLE_OAUTH_LIVE,
    ).toBe("REQUIRED");
    expect(
      ROVEXO_PRODUCTION_CERTIFICATION_V1.PRODUCTION_BLOCKERS_V1.APPLE_OAUTH,
    ).toBe("NOT_BLOCKING_DEFERRED_V2");
    expect(
      ROVEXO_PRODUCTION_CERTIFICATION_V1.PRODUCTION_BLOCKERS_V1.FACEBOOK_OAUTH,
    ).toBe("NOT_BLOCKING_DEFERRED_V2");
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.FORBIDDEN).toContain(
      "BLOCK V1 DEPLOY ON APPLE OAUTH",
    );
  });

  it("locks search/header/architecture singularity", () => {
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.SEARCH.CAMERA_SEARCH).toBe(true);
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.HEADER.ONE_HEADER).toBe(true);
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.HEADER.SECOND_API_FETCH).toBe(false);
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.ARCHITECTURE.ONE_AUTH_SYSTEM).toBe(
      true,
    );
  });

  it("locks deployment 100/100 and forbidden paths", () => {
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.DEPLOYMENT.PASS_100).toBe("DEPLOY");
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.DEPLOYMENT.PASS_99).toBe("NO DEPLOY");
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.DEPLOYMENT.ZERO_EXCEPTIONS).toBe(
      true,
    );
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.FORBIDDEN).toContain(
      "DEPLOY AT 99 PERCENT",
    );
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.ORDER[0]).toBe("BUILD");
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.ORDER).toContain("PREVIEW");
  });

  it("locks current status: no deploy until Google live + remaining v1 gates", () => {
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.CURRENT_STATUS.ROOT_CAUSE).toBe(
      "AWAITING_OWNER_LIVE_GOOGLE_AND_REMAINING_V1_GATES",
    );
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.CURRENT_STATUS.PRODUCTION_READY).toBe(
      false,
    );
    expect(
      ROVEXO_PRODUCTION_CERTIFICATION_V1.CURRENT_STATUS.NO_CODE_CHANGES_REQUIRED,
    ).toBe(true);
    expect(
      ROVEXO_PRODUCTION_CERTIFICATION_V1.CURRENT_STATUS.OWNER_LIVE_CONFIRMATION_REQUIRED,
    ).toBe(true);
    expect(
      ROVEXO_PRODUCTION_CERTIFICATION_V1.CURRENT_STATUS.UNTIL_GOOGLE_LIVE_AND_V1_GATES_PASS,
    ).toBe("NO DEPLOY");
    expect(
      ROVEXO_PRODUCTION_CERTIFICATION_V1.CURRENT_STATUS.LEVEL_8_VERDICT.GOOGLE_LIVE,
    ).toBe("AWAITING_OWNER_LIVE_CONFIRMATION");
    expect(
      ROVEXO_PRODUCTION_CERTIFICATION_V1.CURRENT_STATUS.LEVEL_8_VERDICT.APPLE,
    ).toBe("DEFERRED_V2_NOT_BLOCKING");
  });

  it("aligns Deployment Law, Auth Senior Audit, and cursor rule", () => {
    expect(DEPLOYMENT_GOLDEN_LAW_V1.firstDeployLaw.exactPassRequired).toBe(
      "100/100",
    );
    expect(AUTH_SENIOR_AUDIT_V1.verdict.noCodeChangesRequired).toBe(true);
    expect(
      existsSync(join(process.cwd(), "lib/rovexo-production-certification-v1.ts")),
    ).toBe(true);
    const rule = readSource(".cursor/rules/rovexo-production-certification-v1.mdc");
    expect(rule).toContain("NO DEPLOY");
    expect(rule).toContain("PRODUCTION READY: NO");
    expect(rule).toContain("P10.6R");
    expect(rule).toContain("NOT BLOCKING");
  });
});
