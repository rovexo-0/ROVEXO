import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DEPLOYMENT_GOLDEN_LAW_V1 } from "@/lib/deployment-golden-law-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Deployment Golden Law v1.0 — LEVEL 8", () => {
  it("locks Owner-approved deploy status and zero exceptions", () => {
    expect(DEPLOYMENT_GOLDEN_LAW_V1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(DEPLOYMENT_GOLDEN_LAW_V1.approvedByOwner).toBe(true);
    expect(DEPLOYMENT_GOLDEN_LAW_V1.freezeLocked).toBe(true);
    expect(DEPLOYMENT_GOLDEN_LAW_V1.level).toBe(8);
    expect(DEPLOYMENT_GOLDEN_LAW_V1.firstDeployLaw.exactPassRequired).toBe(
      "100/100",
    );
    expect(DEPLOYMENT_GOLDEN_LAW_V1.firstDeployLaw.zeroExceptions).toBe(true);
    expect(DEPLOYMENT_GOLDEN_LAW_V1.firstDeployLaw.oneFail).toBe("NO DEPLOY");
    expect(DEPLOYMENT_GOLDEN_LAW_V1.masterCertification.zeroExceptions).toBe(
      true,
    );
  });

  it("locks failure domains and required pass categories", () => {
    expect(
      DEPLOYMENT_GOLDEN_LAW_V1.secondDeployLaw.anyFailureForbidsDeploy,
    ).toContain("Constitution");
    expect(
      DEPLOYMENT_GOLDEN_LAW_V1.secondDeployLaw.anyFailureForbidsDeploy,
    ).toContain("Payments");
    expect(
      DEPLOYMENT_GOLDEN_LAW_V1.thirdDeployLaw.requiresHundredPercentPassOf,
    ).toContain("Freeze Rules");
    expect(
      DEPLOYMENT_GOLDEN_LAW_V1.thirdDeployLaw.requiresHundredPercentPassOf,
    ).toContain("Constitution Rules");
  });

  it("forbids hot-fix / deploy-anyway vocabulary", () => {
    expect(
      DEPLOYMENT_GOLDEN_LAW_V1.fourthDeployLaw.permanentlyForbiddenWords,
    ).toContain("hot fix");
    expect(
      DEPLOYMENT_GOLDEN_LAW_V1.fourthDeployLaw.permanentlyForbiddenWords,
    ).toContain("deploy anyway");
    expect(
      DEPLOYMENT_GOLDEN_LAW_V1.fourthDeployLaw.permanentlyForbiddenWords,
    ).toContain("good enough");
    expect(
      DEPLOYMENT_GOLDEN_LAW_V1.fourthDeployLaw
        .onlyCanonicalImplementationsAllowed,
    ).toBe(true);
  });

  it("locks pre-deploy checklist and order", () => {
    expect(DEPLOYMENT_GOLDEN_LAW_V1.fifthDeployLaw.verifyBeforeDeploy).toHaveLength(
      9,
    );
    expect(
      DEPLOYMENT_GOLDEN_LAW_V1.fifthDeployLaw.deployForbiddenWhenQuestion9IsNo,
    ).toBe(true);
    expect(DEPLOYMENT_GOLDEN_LAW_V1.seventhDeployLaw.order[0]).toBe("BUILD");
    expect(DEPLOYMENT_GOLDEN_LAW_V1.seventhDeployLaw.order.at(-2)).toBe(
      "PRODUCTION DEPLOY",
    );
    expect(
      DEPLOYMENT_GOLDEN_LAW_V1.seventhDeployLaw.buildDeployFixAfterForbidden,
    ).toBe(true);
  });

  it("locks deploy purpose and evolution through audits not production failures", () => {
    expect(DEPLOYMENT_GOLDEN_LAW_V1.sixthDeployLaw.deployMayNeverBeUsedTo).toContain(
      "validate experiments",
    );
    expect(DEPLOYMENT_GOLDEN_LAW_V1.eighthDeployLaw.neverEvolveThrough).toBe(
      "FAILURES IN PRODUCTION",
    );
    expect(DEPLOYMENT_GOLDEN_LAW_V1.goldenEquation).toContain("100 / 100");
  });

  it("links Constitution and cursor rule on disk", () => {
    expect(ROVEXO_CONSTITUTION_V1.fifthPrinciple.productionDeployRequires).toBe(
      "100/100",
    );
    expect(existsSync(join(process.cwd(), DEPLOYMENT_GOLDEN_LAW_V1.ssot.law))).toBe(
      true,
    );
    expect(
      existsSync(join(process.cwd(), DEPLOYMENT_GOLDEN_LAW_V1.ssot.constitution)),
    ).toBe(true);
    const rule = readSource(".cursor/rules/deployment-golden-law-v1.mdc");
    expect(rule).toContain("100/100");
    expect(rule).toContain("ZERO EXCEPTIONS");
  });
});
