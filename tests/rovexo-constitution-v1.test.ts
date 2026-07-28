import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";
import { ENGINEERING_GOLDEN_PRINCIPLE_V1 } from "@/lib/engineering-golden-principle-v1";
import { ROVEXO_GOLDEN_LAW_V1 } from "@/lib/rovexo-golden-law-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Constitution v1.0 — LEVEL 8", () => {
  it("locks Owner-approved constitution status", () => {
    expect(ROVEXO_CONSTITUTION_V1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(ROVEXO_CONSTITUTION_V1.approvedByOwner).toBe(true);
    expect(ROVEXO_CONSTITUTION_V1.freezeLocked).toBe(true);
    expect(ROVEXO_CONSTITUTION_V1.canonical).toBe(true);
    expect(ROVEXO_CONSTITUTION_V1.level).toBe(8);
    expect(ROVEXO_CONSTITUTION_V1.certified).toBe(true);
    expect(ROVEXO_CONSTITUTION_V1.fiftyPlusYearsReady).toBe(true);
    expect(ROVEXO_CONSTITUTION_V1.hundredMillionUsersReady).toBe(true);
  });

  it("locks first and second principles", () => {
    expect(ROVEXO_CONSTITUTION_V1.firstPrinciple.alwaysEvolveBy).toContain(
      "simplifying",
    );
    expect(ROVEXO_CONSTITUTION_V1.firstPrinciple.neverEvolveByAdding).toContain(
      "duplicates",
    );
    expect(ROVEXO_CONSTITUTION_V1.secondPrinciple.questionsBeforeCode).toHaveLength(
      8,
    );
    expect(
      ROVEXO_CONSTITUTION_V1.secondPrinciple
        .codeModificationForbiddenWhenQuestion8IsNo,
    ).toBe(true);
  });

  it("locks singularity and root-cause principles", () => {
    expect(ROVEXO_CONSTITUTION_V1.thirdPrinciple.onlyOne).toContain("Header");
    expect(ROVEXO_CONSTITUTION_V1.thirdPrinciple.onlyOne).toContain(
      "Auth System",
    );
    expect(
      ROVEXO_CONSTITUTION_V1.thirdPrinciple.twoOwnersOrTwoImplementationsForbidden,
    ).toBe(true);
    expect(ROVEXO_CONSTITUTION_V1.fourthPrinciple.everyFailureHasOneRootCause).toBe(
      true,
    );
    expect(
      ROVEXO_CONSTITUTION_V1.fourthPrinciple.everyFixHasOneSmallestPossibleFix,
    ).toBe(true);
  });

  it("locks deploy and if-works-do-not-touch", () => {
    expect(ROVEXO_CONSTITUTION_V1.fifthPrinciple.productionDeployRequires).toBe(
      "100/100",
    );
    expect(ROVEXO_CONSTITUTION_V1.fifthPrinciple.onlyExactHundredEqualsDeploy).toBe(
      true,
    );
    expect(ROVEXO_CONSTITUTION_V1.sixthPrinciple.ifWorksDoNotTouch).toContain(
      "Auth",
    );
    expect(ROVEXO_CONSTITUTION_V1.sixthPrinciple.ifWorksDoNotTouch).toContain(
      "Header",
    );
  });

  it("locks evolution and philosophy principles", () => {
    expect(ROVEXO_CONSTITUTION_V1.seventhPrinciple.forbiddenEvolution).toContain(
      "Header v2",
    );
    expect(ROVEXO_CONSTITUTION_V1.seventhPrinciple.onlyAllowedEvolution).toBe(
      "FEATURE → optimized",
    );
    expect(ROVEXO_CONSTITUTION_V1.eighthPrinciple.userMustDoLess).toBe(true);
    expect(ROVEXO_CONSTITUTION_V1.eighthPrinciple.rovexoMustDoMore).toBe(true);
  });

  it("locks golden equation, final law, and child laws on disk", () => {
    expect(ROVEXO_CONSTITUTION_V1.goldenEquation).toContain(
      "ONE CANONICAL IMPLEMENTATION",
    );
    expect(ROVEXO_CONSTITUTION_V1.finalLaw).toContain("SMALLEST AMOUNT OF CODE");
    expect(ABSOLUTE_MASTER_FREEZE_V1.freezeLocked).toBe(true);
    expect(ENGINEERING_GOLDEN_PRINCIPLE_V1.codeIsAlwaysLastSuspect).toBe(true);
    expect(ROVEXO_GOLDEN_LAW_V1.level).toBe(8);
    for (const relativePath of Object.values(ROVEXO_CONSTITUTION_V1.childLaws)) {
      expect(existsSync(join(process.cwd(), relativePath))).toBe(true);
    }
    const rule = readSource(".cursor/rules/rovexo-constitution-v1.mdc");
    expect(rule).toContain("CONSTITUTION");
    expect(rule).toContain("100/100");
  });
});
