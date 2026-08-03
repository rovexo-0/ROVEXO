import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SUPREME_BLOOD_CODE_XV_V1,
  isScoreExactHundredPass,
  isPartialFreezeForbidden,
  canStartNextSprint,
  resolveBloodXvPermanentFreeze,
  resolveBloodXvOwnerVisualPass,
} from "@/lib/supreme-blood-code-xv-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_XIV_V1 } from "@/lib/supreme-blood-code-xiv-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code XV — Owner Certification & Freeze Law", () => {
  it("locks permanent Owner Certification Master Law markers", () => {
    expect(SUPREME_BLOOD_CODE_XV_V1.codename).toBe("OWNER_CERTIFICATION_AND_FREEZE_LAW");
    expect(SUPREME_BLOOD_CODE_XV_V1.status).toBe("PERMANENT_LAW");
    expect(SUPREME_BLOOD_CODE_XV_V1.bloodCodeLocked).toBe(true);
    expect(SUPREME_BLOOD_CODE_XV_V1.permanent).toBe(true);
    expect(SUPREME_BLOOD_CODE_XV_V1.appliesToAllPresentAndFutureSprints).toBe(true);
    expect(SUPREME_BLOOD_CODE_XV_V1.noExceptions).toBe(true);
    expect(SUPREME_BLOOD_CODE_XV_V1.localhostLaw.official).toBe("http://localhost:3000");
    expect(SUPREME_BLOOD_CODE_XV_V1.masterDevice).toBe("IPHONE_17_PRO_MAX");
    expect(SUPREME_BLOOD_CODE_XV_V1.absolutePassLaw.onlyPassScore).toBe(100);
  });

  it("fails every score below exact 100 and forbids partial freezes", () => {
    expect(isScoreExactHundredPass(100)).toBe(true);
    expect(isScoreExactHundredPass(99.99)).toBe(false);
    expect(isScoreExactHundredPass(99)).toBe(false);
    expect(isScoreExactHundredPass(98)).toBe(false);
    expect(isScoreExactHundredPass(95)).toBe(false);
    expect(isPartialFreezeForbidden("95% LOCK")).toBe(true);
    expect(isPartialFreezeForbidden("PARTIAL LOCK")).toBe(true);
    expect(isPartialFreezeForbidden("BETA LOCK")).toBe(true);
    expect(isPartialFreezeForbidden("TEMPORARY LOCK")).toBe(true);
  });

  it("blocks freeze and next sprint without Owner Certification + 100%", () => {
    expect(
      resolveBloodXvPermanentFreeze({
        ownerCertificationPass: false,
        complete100: true,
      }),
    ).toBe("NO_FREEZE");
    expect(
      resolveBloodXvPermanentFreeze({
        ownerCertificationPass: true,
        complete100: false,
      }),
    ).toBe("NO_FREEZE");
    expect(
      resolveBloodXvPermanentFreeze({
        ownerCertificationPass: true,
        complete100: true,
      }),
    ).toBe("PERMANENT_FREEZE");
    expect(
      canStartNextSprint({
        ownerCertificationPass: true,
        complete100: true,
        permanentFreeze: false,
      }),
    ).toBe(false);
    expect(
      canStartNextSprint({
        ownerCertificationPass: true,
        complete100: true,
        permanentFreeze: true,
      }),
    ).toBe(true);
  });

  it("Owner visual PASS requires every certification surface", () => {
    expect(
      resolveBloodXvOwnerVisualPass({
        ui: true,
        ux: true,
        responsive: true,
        functionality: true,
        scroll: true,
        mobileExperience: true,
        compactPremiumDesign: true,
        iphone17ProMaxExperience: true,
        localhostExperience: true,
        productionReadiness: true,
      }),
    ).toBe("PRODUCT_PASS_100");
    expect(
      resolveBloodXvOwnerVisualPass({
        ui: true,
        ux: true,
        responsive: true,
        functionality: true,
        scroll: true,
        mobileExperience: true,
        compactPremiumDesign: true,
        iphone17ProMaxExperience: true,
        localhostExperience: true,
        productionReadiness: false,
      }),
    ).toBe("PRODUCT_FAIL");
  });

  it("keeps live Sprint IV LOCKED; V permanent freeze (Blood XXII); VI approved", () => {
    expect(SUPREME_BLOOD_CODE_XV_V1.liveSprintStatus.I).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XV_V1.liveSprintStatus.II).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XV_V1.liveSprintStatus.III).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XV_V1.liveSprintStatus.IV).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XV_V1.liveSprintStatus.V).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XV_V1.liveSprintStatus.VI).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XIV_V1.developmentStatus).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XV_V1.masterRoadmap.IV.route).toBe("/wallet");
  });

  it("wires into Blood I/XIV, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      ownerCertificationAndFreezeLaw: "lib/supreme-blood-code-xv-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeXv: "lib/supreme-blood-code-xv-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeXv: "lib/supreme-blood-code-xv-v1.ts",
    });
  });

  it("persists rule and doc", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-xv-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_XV_V1.md");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("NO OWNER CERTIFICATION");
    expect(rule).toContain("100% only = PASS");
    expect(doc).toContain("Owner Certification & Freeze Law");
    expect(doc).toContain("http://localhost:3000");
  });
});
