import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SUPREME_BLOOD_CODE_XVII_V1,
  isOwnerEngineeringRoleForbidden,
  resolveBloodXviiAutomaticCertificationGate,
  canPresentToOwnerForCertification,
  resolveBloodXviiFreezeChain,
  isForbiddenOwnerHandoffProduct,
} from "@/lib/supreme-blood-code-xvii-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_XVI_V1 } from "@/lib/supreme-blood-code-xvi-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code XVII — Automatic Certification Master Law", () => {
  it("locks permanent Automatic Certification constitutional markers", () => {
    expect(SUPREME_BLOOD_CODE_XVII_V1.codename).toBe(
      "AUTOMATIC_CERTIFICATION_MASTER_LAW",
    );
    expect(SUPREME_BLOOD_CODE_XVII_V1.status).toBe("PERMANENT_LAW");
    expect(SUPREME_BLOOD_CODE_XVII_V1.chainPermanentlyLocked).toBe(true);
    expect(SUPREME_BLOOD_CODE_XVII_V1.permanentConstitutionalLaw).toBe(true);
    expect(SUPREME_BLOOD_CODE_XVII_V1.noPartialCertifications).toBe(true);
    expect(SUPREME_BLOOD_CODE_XVII_V1.masterDevice).toBe("IPHONE_17_PRO_MAX");
    expect(SUPREME_BLOOD_CODE_XVII_V1.localhostLaw.official).toBe(
      "http://localhost:3000",
    );
    expect(
      SUPREME_BLOOD_CODE_XVII_V1.automaticCertificationLaw
        .withoutAutomaticCertificationPass,
    ).toBe("PRODUCT_FAIL");
  });

  it("forbids Owner engineering/tester roles; allows product certification only", () => {
    expect(isOwnerEngineeringRoleForbidden("QA ENGINEER")).toBe(true);
    expect(isOwnerEngineeringRoleForbidden("TypeScript Engineer")).toBe(true);
    expect(isOwnerEngineeringRoleForbidden("Regression Tester")).toBe(true);
    expect(isOwnerEngineeringRoleForbidden("Accessibility Tester")).toBe(true);
    expect(
      SUPREME_BLOOD_CODE_XVII_V1.absoluteOwnerRoleLaw.ownerResponsibleOnlyFor,
    ).toContain("FINAL APPROVAL");
    expect(
      SUPREME_BLOOD_CODE_XVII_V1.absoluteOwnerRoleLaw.ownerResponsibleOnlyFor,
    ).toContain("PRODUCT CERTIFICATION");
  });

  it("places AUTOMATIC CERTIFICATION before OWNER CERTIFICATION in the chain", () => {
    const chain = SUPREME_BLOOD_CODE_XVII_V1.masterDevelopmentChain;
    const autoIdx = chain.indexOf("AUTOMATIC_CERTIFICATION_PASS");
    const ownerIdx = chain.indexOf("OWNER_CERTIFICATION_PASS");
    const regressionIdx = chain.indexOf("NO_REGRESSION_QA_PASS");
    expect(autoIdx).toBeGreaterThan(-1);
    expect(ownerIdx).toBeGreaterThan(autoIdx);
    expect(autoIdx).toBeGreaterThan(regressionIdx);
  });

  it("Automatic Certification FAIL / regression / localhost FAIL blocks handoff", () => {
    expect(
      resolveBloodXviiAutomaticCertificationGate({
        automaticCertificationPass: false,
        localhostCertificationPass: true,
        noRegressionQaPass: true,
        regressionDetected: false,
      }),
    ).toBe("PRODUCT_FAIL");
    expect(
      resolveBloodXviiAutomaticCertificationGate({
        automaticCertificationPass: true,
        localhostCertificationPass: false,
        noRegressionQaPass: true,
        regressionDetected: false,
      }),
    ).toBe("PRODUCT_FAIL");
    expect(
      resolveBloodXviiAutomaticCertificationGate({
        automaticCertificationPass: true,
        localhostCertificationPass: true,
        noRegressionQaPass: true,
        regressionDetected: true,
      }),
    ).toBe("PRODUCT_FAIL");
    expect(
      resolveBloodXviiAutomaticCertificationGate({
        automaticCertificationPass: true,
        localhostCertificationPass: true,
        noRegressionQaPass: true,
        regressionDetected: false,
      }),
    ).toBe("AUTOMATIC_CERTIFICATION_PASS");
  });

  it("Owner receives only fully certified 100% products", () => {
    expect(isForbiddenOwnerHandoffProduct("Beta Products")).toBe(true);
    expect(isForbiddenOwnerHandoffProduct("95% Products")).toBe(true);
    expect(isForbiddenOwnerHandoffProduct("Untested Products")).toBe(true);
    expect(
      canPresentToOwnerForCertification({
        automaticCertificationPass: true,
        qaCertified: true,
        regressionCertified: true,
        productionReady: true,
        complete100: false,
      }),
    ).toBe(false);
    expect(
      canPresentToOwnerForCertification({
        automaticCertificationPass: true,
        qaCertified: true,
        regressionCertified: true,
        productionReady: true,
        complete100: true,
      }),
    ).toBe(true);
  });

  it("constitutional freeze chain blocks next sprint without auto → owner → 100 → freeze", () => {
    expect(
      resolveBloodXviiFreezeChain({
        automaticCertificationPass: false,
        ownerCertificationPass: true,
        complete100: true,
        permanentFreeze: true,
      }),
    ).toBe("NO_OWNER_CERTIFICATION");
    expect(
      resolveBloodXviiFreezeChain({
        automaticCertificationPass: true,
        ownerCertificationPass: false,
        complete100: true,
        permanentFreeze: true,
      }),
    ).toBe("NO_100_COMPLETE");
    expect(
      resolveBloodXviiFreezeChain({
        automaticCertificationPass: true,
        ownerCertificationPass: true,
        complete100: false,
        permanentFreeze: true,
      }),
    ).toBe("NO_PERMANENT_FREEZE");
    expect(
      resolveBloodXviiFreezeChain({
        automaticCertificationPass: true,
        ownerCertificationPass: true,
        complete100: true,
        permanentFreeze: false,
      }),
    ).toBe("NO_NEXT_SPRINT");
    expect(
      resolveBloodXviiFreezeChain({
        automaticCertificationPass: true,
        ownerCertificationPass: true,
        complete100: true,
        permanentFreeze: true,
      }),
    ).toBe("NEXT_SPRINT_ALLOWED");
  });

  it("trinity is mandatory with XVI Zero Regression parent", () => {
    expect(SUPREME_BLOOD_CODE_XVII_V1.masterConstitutionTrinity.allThreeMandatory).toBe(
      true,
    );
    expect(
      SUPREME_BLOOD_CODE_XVII_V1.masterConstitutionTrinity.automaticCertificationProtects,
    ).toBe("THE_FUTURE");
    expect(SUPREME_BLOOD_CODE_XVI_V1.permanentConstitutionalLaw).toBe(true);
    expect(SUPREME_BLOOD_CODE_XVII_V1.zeroRegressionViaAutoCert.IV).toEqual([
      "I",
      "II",
      "III",
    ]);
  });

  it("wires into Blood I/XVI, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      automaticCertificationMasterLaw: "lib/supreme-blood-code-xvii-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeXvii: "lib/supreme-blood-code-xvii-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeXvii: "lib/supreme-blood-code-xvii-v1.ts",
    });
  });

  it("persists rule and doc", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-xvii-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_XVII_V1.md");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("AUTOMATIC CERTIFICATION");
    expect(rule).toContain("NO AUTO CERT = NO OWNER CERT");
    expect(rule).toContain("http://localhost:3000");
    expect(doc).toContain("Automatic Certification Master Law");
    expect(doc).toContain("iPhone 17 Pro Max");
  });
});
