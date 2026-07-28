import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SUPREME_BLOOD_CODE_V1,
  isDailyManualOperationForbidden,
  isHumanInterventionException,
} from "@/lib/supreme-blood-code-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code v1.0", () => {
  it("locks permanent freeze markers", () => {
    expect(SUPREME_BLOOD_CODE_V1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(SUPREME_BLOOD_CODE_V1.frozen).toBe(true);
    expect(SUPREME_BLOOD_CODE_V1.permanent).toBe(true);
    expect(SUPREME_BLOOD_CODE_V1.approvedByOwner).toBe(true);
    expect(SUPREME_BLOOD_CODE_V1.maximumAutomationTarget).toBe("100%");
    expect(SUPREME_BLOOD_CODE_V1.mission.platformWorksForOwners).toBe(true);
    expect(SUPREME_BLOOD_CODE_V1.mission.ownersNeverWorkForPlatform).toBe(true);
  });

  it("defines Super Admin as Control Center only", () => {
    expect(SUPREME_BLOOD_CODE_V1.superAdmin.role).toBe("ROVEXO_CONTROL_CENTER");
    expect(SUPREME_BLOOD_CODE_V1.superAdmin.nothingMore).toBe(true);
    expect(SUPREME_BLOOD_CODE_V1.superAdmin.allowedControls).toContain("FREEZE");
    expect(SUPREME_BLOOD_CODE_V1.superAdmin.allowedControls).toContain("EMERGENCY_CONTROLS");
    expect(SUPREME_BLOOD_CODE_V1.superAdmin.isNot).toContain("daily_manager");
  });

  it("keeps Admin Center optional and never required for money paths", () => {
    expect(SUPREME_BLOOD_CODE_V1.adminCenter.optional).toBe(true);
    expect(SUPREME_BLOOD_CODE_V1.adminCenter.neverRequiredFor).toContain("Payments");
    expect(SUPREME_BLOOD_CODE_V1.adminCenter.neverRequiredFor).toContain("Wallet");
    expect(SUPREME_BLOOD_CODE_V1.adminCenter.neverRequiredFor).toContain("Escrow");
    expect(SUPREME_BLOOD_CODE_V1.adminCenter.neverRequiredFor).toContain("HMRC");
  });

  it("forbids daily manual ops and allows only legal/fraud/security exceptions", () => {
    expect(isDailyManualOperationForbidden("daily manual refunds")).toBe(true);
    expect(isDailyManualOperationForbidden("wallet_operations")).toBe(true);
    expect(isHumanInterventionException("FRAUD")).toBe(true);
    expect(SUPREME_BLOOD_CODE_V1.humanInterventionAllowedOnlyWhen).toContain("LAW");
    expect(SUPREME_BLOOD_CODE_V1.goldenRule.exceptions).toBe("NONE");
  });

  it("requires platform independence when Super Admin is offline", () => {
    expect(SUPREME_BLOOD_CODE_V1.platformIndependence.mandatory).toBe(true);
    expect(SUPREME_BLOOD_CODE_V1.platformIndependence.continueIfSuperAdminOfflineFor).toEqual([
      "1_DAY",
      "1_WEEK",
      "1_MONTH",
      "6_MONTHS",
    ]);
  });

  it("wires into Constitution and Absolute Master Freeze child laws", () => {
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCode: "lib/supreme-blood-code-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCode: "lib/supreme-blood-code-v1.ts",
    });
  });

  it("keeps always-apply Cursor rule and engineering doc in sync", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_V1.md");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("The platform works for its owners");
    expect(rule).toContain("lib/supreme-blood-code-v1.ts");
    expect(doc).toContain("PERMANENT FREEZE");
    expect(doc).toContain("100% automation");
    expect(SUPREME_BLOOD_CODE_V1.finalRules[0]).toContain("PLATFORM WORKS FOR ITS OWNERS");
    expect(SUPREME_BLOOD_CODE_V1.finalRules).toHaveLength(2);
  });
});
