import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ENGINEERING_GOLDEN_PRINCIPLE_V1 } from "@/lib/engineering-golden-principle-v1";
import { ROVEXO_GOLDEN_LAW_V1 } from "@/lib/rovexo-golden-law-v1";
import { OAUTH_CONFIGURATION_FREEZE_V1 } from "@/lib/auth/oauth-configuration-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Engineering Golden Principle v1.0 — LEVEL 8", () => {
  it("locks Owner-approved status and code-as-last-suspect", () => {
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.status).toBe(
      "OWNER_APPROVED_LOCKED_FROZEN",
    );
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.approvedByOwner).toBe(true);
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.freezeLocked).toBe(true);
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.level).toBe(8);
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.codeIsAlwaysLastSuspect).toBe(true);
    expect(
      ENGINEERING_GOLDEN_PRINCIPLE_V1.codeModificationForbiddenWhenQuestion8IsNo,
    ).toBe(true);
  });

  it("locks investigation order ending with CODE", () => {
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.investigationOrder).toEqual([
      "CONFIGURATION",
      "STATE",
      "PROVIDERS",
      "NAVIGATION",
      "SERVICES",
      "API",
      "ARCHITECTURE",
      "CODE",
    ]);
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.investigationOrder.at(-1)).toBe(
      "CODE",
    );
    expect(
      ENGINEERING_GOLDEN_PRINCIPLE_V1.mandatoryQuestionsBeforeCodeChange,
    ).toHaveLength(8);
  });

  it("forbids rewrite/v2/Manager reactions to failures", () => {
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.forbiddenReactions).toContain(
      "400 ERROR → rewrite 50 files",
    );
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.forbiddenReactions).toContain(
      "OAuth FAIL → Auth v2",
    );
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.evolutionLaw.forbidden).toContain(
      "Session Manager",
    );
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.evolutionLaw.mayEvolveOnlyBy).toBe(
      "OPTIMIZATION",
    );
  });

  it("locks root cause and deployment laws", () => {
    expect(
      ENGINEERING_GOLDEN_PRINCIPLE_V1.rootCauseLaw
        .everyFailureHasExactlyOneRootCause,
    ).toBe(true);
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.rootCauseLaw.requiredFlow[0]).toBe(
      "ROOT CAUSE FOUND",
    );
    expect(
      ENGINEERING_GOLDEN_PRINCIPLE_V1.deploymentLaw
        .productionDeployForbiddenIfOneGateFails,
    ).toBe(true);
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.deploymentLaw.requireExactPass).toBe(
      "100/100",
    );
  });

  it("locks golden equation and final principle", () => {
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.goldenEquation).toContain(
      "ONE SMALLEST FIX",
    );
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.finalPrinciple.bestFix).toContain(
      "SMALLEST AMOUNT OF CODE",
    );
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.finalPrinciple.alwaysEvolveBy).toEqual(
      ["SIMPLIFYING", "OPTIMIZING", "AUTOMATING", "PRESERVING"],
    );
  });

  it("links Golden Law, OAuth config freeze, and cursor rule", () => {
    expect(ROVEXO_GOLDEN_LAW_V1.freezeLocked).toBe(true);
    expect(OAUTH_CONFIGURATION_FREEZE_V1.mission.onlyConfigurationAllowed).toBe(
      true,
    );
    expect(
      existsSync(join(process.cwd(), ENGINEERING_GOLDEN_PRINCIPLE_V1.ssot.principle)),
    ).toBe(true);
    const rule = readSource(".cursor/rules/engineering-golden-principle-v1.mdc");
    expect(rule).toContain("LAST SUSPECT");
    expect(rule).toContain("100/100");
  });
});
