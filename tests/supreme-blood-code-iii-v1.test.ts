import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SUPREME_BLOOD_CODE_III_V1,
  isPartialOrAlmostClaimForbidden,
  resolveProductPass,
  resolveViewGate,
} from "@/lib/supreme-blood-code-iii-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_II_V1 } from "@/lib/supreme-blood-code-ii-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code III — Preview View Certification", () => {
  it("locks permanent freeze markers", () => {
    expect(SUPREME_BLOOD_CODE_III_V1.codename).toBe("PREVIEW_VIEW_CERTIFICATION");
    expect(SUPREME_BLOOD_CODE_III_V1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(SUPREME_BLOOD_CODE_III_V1.frozen).toBe(true);
    expect(SUPREME_BLOOD_CODE_III_V1.neverRemove).toBe(true);
    expect(SUPREME_BLOOD_CODE_III_V1.viewResultsOnly).toEqual(["VIEW_PASS", "VIEW_FAIL"]);
    expect(SUPREME_BLOOD_CODE_III_V1.firstPrinciple.ifUserCannotSeeIt).toBe("IT_DOES_NOT_EXIST");
  });

  it("fails view when Owner cannot see or UI is broken", () => {
    expect(
      resolveViewGate({
        visuallyVisible: true,
        ownerCanVerify: true,
        whiteScreen: false,
        brokenUi: false,
        previewFailed: false,
      }),
    ).toBe("VIEW_PASS");
    expect(
      resolveViewGate({
        visuallyVisible: true,
        ownerCanVerify: false,
        whiteScreen: false,
        brokenUi: false,
        previewFailed: false,
      }),
    ).toBe("VIEW_FAIL");
    expect(
      resolveViewGate({
        visuallyVisible: true,
        ownerCanVerify: true,
        whiteScreen: true,
        brokenUi: false,
        previewFailed: false,
      }),
    ).toBe("VIEW_FAIL");
  });

  it("requires full product formula — code alone is not product PASS", () => {
    expect(
      resolveProductPass({
        codePass: true,
        testPass: true,
        previewPass: true,
        visualPass: true,
        ownerPass: true,
        zeroRegressionPass: true,
        certificationPass: true,
      }),
    ).toBe("PASS");
    expect(
      resolveProductPass({
        codePass: true,
        testPass: true,
        previewPass: true,
        visualPass: false,
        ownerPass: true,
        zeroRegressionPass: true,
        certificationPass: true,
      }),
    ).toBe("FAIL");
    expect(SUPREME_BLOOD_CODE_III_V1.absoluteLaws.codePassDoesNotMeanProductPass).toBe(true);
    expect(isPartialOrAlmostClaimForbidden("almost ready")).toBe(true);
    expect(isPartialOrAlmostClaimForbidden("95% done")).toBe(true);
  });

  it("locks automatic sprint-fail triggers and preview display contract", () => {
    expect(SUPREME_BLOOD_CODE_III_V1.automaticSprintFailIf).toContain("WHITE_SCREEN");
    expect(SUPREME_BLOOD_CODE_III_V1.automaticSprintFailIf).toContain("PAY_NOW_WRONG");
    expect(SUPREME_BLOOD_CODE_III_V1.previewMustDisplay).toContain("PAY_NOW");
    expect(SUPREME_BLOOD_CODE_III_V1.previewMustDisplay).toContain("TRACKING");
    expect(SUPREME_BLOOD_CODE_III_V1.zeroRegressionLaw.newCodeMustNotBreakOldCode).toBe(true);
  });

  it("wires into Blood I/II, Constitution, and Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      previewViewCertification: "lib/supreme-blood-code-iii-v1.ts",
    });
    expect(SUPREME_BLOOD_CODE_II_V1.childLaws).toMatchObject({
      previewViewCertification: "lib/supreme-blood-code-iii-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeIii: "lib/supreme-blood-code-iii-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeIii: "lib/supreme-blood-code-iii-v1.ts",
    });
  });

  it("keeps always-apply Cursor rule and engineering doc in sync", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-iii-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_III_V1.md");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("PREVIEW VIEW CERTIFICATION");
    expect(rule).toContain("lib/supreme-blood-code-iii-v1.ts");
    expect(doc).toContain("NEVER REMOVE");
    expect(doc).toContain("CERTIFICATION = FAIL");
    expect(SUPREME_BLOOD_CODE_III_V1.absoluteLawOfRovexo).toContain("OWNER CANNOT SEE IT");
  });
});
