import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SUPREME_BLOOD_CODE_II_V1,
  isExactHundredPercentPass,
  resolveBinaryGateStatus,
  resolveSprintGateResult,
} from "@/lib/supreme-blood-code-ii-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code II — Zero Regression", () => {
  it("locks permanent freeze markers", () => {
    expect(SUPREME_BLOOD_CODE_II_V1.codename).toBe("ZERO_REGRESSION_PRINCIPLE");
    expect(SUPREME_BLOOD_CODE_II_V1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(SUPREME_BLOOD_CODE_II_V1.frozen).toBe(true);
    expect(SUPREME_BLOOD_CODE_II_V1.permanent).toBe(true);
    expect(SUPREME_BLOOD_CODE_II_V1.hardStops.exceptions).toBe("NONE");
    expect(SUPREME_BLOOD_CODE_II_V1.whiteScreenPolicy.exceptions).toBe("NONE");
  });

  it("requires binary PASS/FAIL only and exact 100%", () => {
    expect(SUPREME_BLOOD_CODE_II_V1.binaryGateOnly.allowedStatuses).toEqual(["PASS", "FAIL"]);
    expect(SUPREME_BLOOD_CODE_II_V1.binaryGateOnly.forbiddenStatuses).toContain("Almost PASS");
    expect(isExactHundredPercentPass(100)).toBe(true);
    expect(isExactHundredPercentPass(99.99)).toBe(false);
    expect(isExactHundredPercentPass(95)).toBe(false);
    expect(resolveBinaryGateStatus({ status: "PASS", evidenceVerified: true })).toBe("PASS");
    expect(resolveBinaryGateStatus({ status: "PASS", evidenceVerified: false })).toBe("FAIL");
    expect(resolveBinaryGateStatus({ status: "Almost PASS", evidenceVerified: true })).toBe("FAIL");
  });

  it("applies golden QA — one FAIL fails the sprint", () => {
    expect(resolveSprintGateResult(["PASS", "PASS", "PASS", "FAIL"])).toBe("FAIL");
    expect(resolveSprintGateResult(["PASS", "PASS", "PASS", "PASS"])).toBe("PASS");
    expect(resolveSprintGateResult([])).toBe("FAIL");
    expect(SUPREME_BLOOD_CODE_II_V1.goldenQaRule.example.result).toBe("SPRINT_FAIL");
  });

  it("blocks release actions and certification without preview/UI/owner/mobile", () => {
    expect(SUPREME_BLOOD_CODE_II_V1.releaseForbiddenUnlessAllGatesPass).toContain("COMMIT");
    expect(SUPREME_BLOOD_CODE_II_V1.releaseForbiddenUnlessAllGatesPass).toContain("PUSH");
    expect(SUPREME_BLOOD_CODE_II_V1.certificationBlockedWhen).toContain("NO_PREVIEW");
    expect(SUPREME_BLOOD_CODE_II_V1.certificationBlockedWhen).toContain("NO_OWNER_APPROVAL");
    expect(SUPREME_BLOOD_CODE_II_V1.hardStops.noPreview).toBe("NO_FREEZE");
    expect(SUPREME_BLOOD_CODE_II_V1.hardStops.noPass).toBe("NO_PUSH");
  });

  it("wires into Supreme Blood I, Constitution, and Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      zeroRegression: "lib/supreme-blood-code-ii-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeIi: "lib/supreme-blood-code-ii-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeIi: "lib/supreme-blood-code-ii-v1.ts",
    });
  });

  it("keeps always-apply Cursor rule and engineering doc in sync", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-ii-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_II_V1.md");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("ZERO REGRESSION");
    expect(rule).toContain("lib/supreme-blood-code-ii-v1.ts");
    expect(doc).toContain("PERMANENT FREEZE");
    expect(doc).toContain("it does not exist");
    expect(SUPREME_BLOOD_CODE_II_V1.finalSupremeRule).toContain("IT DOES NOT EXIST");
  });
});
