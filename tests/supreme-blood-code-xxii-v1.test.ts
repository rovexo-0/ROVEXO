import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SUPREME_BLOOD_CODE_XXII_V1,
  isBloodXxiiSellPermanentlyFrozen,
  canStartSprintViCheckout,
  isBloodXxiiSellModificationAllowed,
} from "@/lib/supreme-blood-code-xxii-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_XI_V1 } from "@/lib/supreme-blood-code-xi-v1";
import { SUPREME_BLOOD_CODE_XV_V1 } from "@/lib/supreme-blood-code-xv-v1";
import { SUPREME_BLOOD_CODE_XVI_V1, isZeroRegressionProtectedLive } from "@/lib/supreme-blood-code-xvi-v1";
import { SUPREME_BLOOD_CODE_XXI_V1 } from "@/lib/supreme-blood-code-xxi-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";
import { isHomepageSearchBarRoute } from "@/lib/header/homepage-search-bar-only-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code XXII — Sprint V Permanent Freeze", () => {
  it("locks Owner-declared 100% · certified · permanent freeze", () => {
    expect(SUPREME_BLOOD_CODE_XXII_V1.codename).toBe(
      "SPRINT_V_SELL_100_COMPLETE_PERMANENT_FREEZE",
    );
    expect(SUPREME_BLOOD_CODE_XXII_V1.status).toBe(
      "100_COMPLETE_OWNER_CERTIFIED_PERMANENT_FREEZE",
    );
    expect(SUPREME_BLOOD_CODE_XXII_V1.permanentlyFrozen).toBe(true);
    expect(SUPREME_BLOOD_CODE_XXII_V1.complete100).toBe(true);
    expect(SUPREME_BLOOD_CODE_XXII_V1.ownerCertified).toBe(true);
    expect(SUPREME_BLOOD_CODE_XXII_V1.zeroRegressionProtected).toBe(true);
    expect(isBloodXxiiSellPermanentlyFrozen()).toBe(true);
    expect(SUPREME_BLOOD_CODE_XXII_V1.officialLocalhost).toBe(
      "http://localhost:3000/sell",
    );
    expect(SUPREME_BLOOD_CODE_XXII_V1.threeSecondLaw.ifUserConfused).toBe(
      "PRODUCT_FAIL",
    );
    expect(isHomepageSearchBarRoute("/sell")).toBe(false);
  });

  it("opens Sprint VI Checkout; forbids VII–VIII; protects Sell from redesign", () => {
    expect(SUPREME_BLOOD_CODE_XXII_V1.liveSprintStatus.V).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XXII_V1.liveSprintStatus.VI).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XXII_V1.liveSprintStatus.VII).toBe("FORBIDDEN_TO_START");
    expect(canStartSprintViCheckout()).toBe(false);
    expect(SUPREME_BLOOD_CODE_XI_V1.currentSprint).toBe("VI");
    expect(SUPREME_BLOOD_CODE_XI_V1.currentModule).toBe("CHECKOUT");
    expect(
      isBloodXxiiSellModificationAllowed({
        changeKind: "UI redesign",
        ownerApproval: true,
      }),
    ).toBe(false);
    expect(
      isBloodXxiiSellModificationAllowed({
        changeKind: "Critical Security Fixes",
        ownerApproval: true,
      }),
    ).toBe(true);
  });

  it("aligns XV/XVI/XXI live freeze + zero regression for Sell", () => {
    expect(SUPREME_BLOOD_CODE_XV_V1.liveSprintStatus.V).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XV_V1.liveSprintStatus.VI).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XXI_V1.liveSprintStatus.V).toBe("LOCKED");
    expect(isZeroRegressionProtectedLive("V")).toBe(true);
    expect(isZeroRegressionProtectedLive("IV")).toBe(true);
    expect(SUPREME_BLOOD_CODE_XVI_V1.protectedModulesLive.V.status).toBe(
      "ZERO_REGRESSION_PROTECTED",
    );
  });

  it("wires into Blood I/XXI parents, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      sprintVSell100CompletePermanentFreeze: "lib/supreme-blood-code-xxii-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeXxii: "lib/supreme-blood-code-xxii-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeXxii: "lib/supreme-blood-code-xxii-v1.ts",
    });
  });

  it("persists rule/doc and Sell permanent freeze stamps", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-xxii-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_XXII_V1.md");
    const sellPage = readSource("features/sell/ui/SellPage.tsx");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("PERMANENT FREEZE");
    expect(rule).toContain("IN DEVELOPMENT");
    expect(doc).toContain("100% COMPLETE");
    expect(doc).toContain("http://localhost:3000/sell");
    expect(sellPage).toContain('data-blood-code-xxii="22.0"');
    expect(sellPage).toContain('data-sell-sprint-status="PERMANENT-FREEZE"');
    expect(sellPage).toContain('data-sell-complete="100"');
    expect(sellPage).toContain('data-sell-owner-certified="true"');
  });
});
