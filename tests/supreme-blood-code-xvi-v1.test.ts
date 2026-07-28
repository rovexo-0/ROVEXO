import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SUPREME_BLOOD_CODE_XVI_V1,
  isZeroRegressionProtectedLive,
  resolveBloodXviNoRegressionGate,
  canModifyFrozenModule,
  resolveSprintMustNotBreak,
  isForbiddenRegressionType,
} from "@/lib/supreme-blood-code-xvi-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_XV_V1 } from "@/lib/supreme-blood-code-xv-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code XVI — Zero Regression Master Law", () => {
  it("locks permanent Zero Regression constitutional markers", () => {
    expect(SUPREME_BLOOD_CODE_XVI_V1.codename).toBe("ZERO_REGRESSION_MASTER_LAW");
    expect(SUPREME_BLOOD_CODE_XVI_V1.status).toBe("PERMANENT_LAW");
    expect(SUPREME_BLOOD_CODE_XVI_V1.bloodCodeLocked).toBe(true);
    expect(SUPREME_BLOOD_CODE_XVI_V1.permanentConstitutionalLaw).toBe(true);
    expect(SUPREME_BLOOD_CODE_XVI_V1.noCompromises).toBe(true);
    expect(SUPREME_BLOOD_CODE_XVI_V1.appliesToAllFutureVersions).toBe(true);
    expect(SUPREME_BLOOD_CODE_XVI_V1.localhostLaw.official).toBe("http://localhost:3000");
    expect(SUPREME_BLOOD_CODE_XVI_V1.withoutNoRegressionQaPass).toBe("PRODUCT_FAIL");
  });

  it("protects I–V live after Owner certification; VI+ after certification only", () => {
    expect(isZeroRegressionProtectedLive("I")).toBe(true);
    expect(isZeroRegressionProtectedLive("II")).toBe(true);
    expect(isZeroRegressionProtectedLive("III")).toBe(true);
    expect(isZeroRegressionProtectedLive("IV")).toBe(true);
    expect(isZeroRegressionProtectedLive("V")).toBe(true);
    expect(isZeroRegressionProtectedLive("VI")).toBe(false);
    expect(SUPREME_BLOOD_CODE_XVI_V1.protectedModulesLive.V.status).toBe(
      "ZERO_REGRESSION_PROTECTED",
    );
    expect(SUPREME_BLOOD_CODE_XV_V1.liveSprintStatus.IV).toBe("LOCKED");
  });

  it("Sprint IV must never break I–III; VIII must never break I–VII", () => {
    expect(resolveSprintMustNotBreak("IV")).toEqual(["I", "II", "III"]);
    expect(resolveSprintMustNotBreak("V")).toEqual(["I", "II", "III", "IV"]);
    expect(resolveSprintMustNotBreak("VIII")).toEqual([
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
    ]);
  });

  it("NO REGRESSION QA FAIL blocks Product PASS", () => {
    expect(
      resolveBloodXviNoRegressionGate({
        noRegressionQaPass: false,
        ownerCertificationPass: true,
        complete100: true,
      }),
    ).toBe("PRODUCT_FAIL");
    expect(
      resolveBloodXviNoRegressionGate({
        noRegressionQaPass: true,
        ownerCertificationPass: false,
        complete100: true,
      }),
    ).toBe("PRODUCT_FAIL");
    expect(
      resolveBloodXviNoRegressionGate({
        noRegressionQaPass: true,
        ownerCertificationPass: true,
        complete100: true,
      }),
    ).toBe("PRODUCT_PASS_100");
  });

  it("frozen modules allow only critical Owner-approved fixes", () => {
    const frozen = {
      ownerCertified: true,
      complete100: true,
      permanentlyFrozen: true,
    };
    expect(
      canModifyFrozenModule({
        ...frozen,
        changeKind: "UI redesign",
        ownerApproval: true,
      }),
    ).toBe(false);
    expect(
      canModifyFrozenModule({
        ...frozen,
        changeKind: "Critical Security Fixes",
        ownerApproval: false,
      }),
    ).toBe(false);
    expect(
      canModifyFrozenModule({
        ...frozen,
        changeKind: "Critical Security Fixes",
        ownerApproval: true,
      }),
    ).toBe(true);
    expect(
      canModifyFrozenModule({
        ...frozen,
        changeKind: "Critical Production Bugs",
        ownerApproval: true,
      }),
    ).toBe(true);
  });

  it("forbids listed regression types", () => {
    expect(isForbiddenRegressionType("Inbox Regression")).toBe(true);
    expect(isForbiddenRegressionType("Financial Regression")).toBe(true);
    expect(isForbiddenRegressionType("Cross Module Regression")).toBe(true);
    expect(isForbiddenRegressionType("UI Regression")).toBe(true);
  });

  it("wires into Blood I/XV, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      zeroRegressionMasterLaw: "lib/supreme-blood-code-xvi-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeXvi: "lib/supreme-blood-code-xvi-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeXvi: "lib/supreme-blood-code-xvi-v1.ts",
    });
    expect(SUPREME_BLOOD_CODE_XV_V1.parentLaws).not.toBeNull();
  });

  it("persists rule and doc", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-xvi-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_XVI_V1.md");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("ZERO REGRESSION");
    expect(rule).toContain("NO REGRESSION QA");
    expect(rule).toContain("http://localhost:3000");
    expect(doc).toContain("Zero Regression Master Law");
    expect(doc).toContain("PRODUCT FAIL");
  });
});
