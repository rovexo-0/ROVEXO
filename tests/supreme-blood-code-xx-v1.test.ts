import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SUPREME_BLOOD_CODE_XX_V1,
  isBloodXxSellRouteAllowed,
  resolveBloodXxScopePolicy,
  resolveBloodXxPermanentFreeze,
  isBloodXxBottomNavVisibleOnSell,
} from "@/lib/supreme-blood-code-xx-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_XV_V1 } from "@/lib/supreme-blood-code-xv-v1";
import { SUPREME_BLOOD_CODE_XVIII_V1 } from "@/lib/supreme-blood-code-xviii-v1";
import { SUPREME_BLOOD_CODE_XIX_V1 } from "@/lib/supreme-blood-code-xix-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";
import { isHomepageSearchBarRoute } from "@/lib/header/homepage-search-bar-only-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code XX — Sprint V Sell Execution Mode", () => {
  it("locks EXECUTION MODE markers (frozen via Blood XXII)", () => {
    expect(SUPREME_BLOOD_CODE_XX_V1.codename).toBe("SPRINT_V_SELL_EXECUTION_MODE");
    expect(SUPREME_BLOOD_CODE_XX_V1.status).toBe(
      "100_COMPLETE_OWNER_CERTIFIED_PERMANENT_FREEZE",
    );
    expect(SUPREME_BLOOD_CODE_XX_V1.mode).toBe("EXECUTION_MODE");
    expect(SUPREME_BLOOD_CODE_XX_V1.executionMode.moreCode).toBe(true);
    expect(SUPREME_BLOOD_CODE_XX_V1.permanentlyFrozen).toBe(true);
    expect(SUPREME_BLOOD_CODE_XX_V1.complete100).toBe(true);
    expect(SUPREME_BLOOD_CODE_XX_V1.sellLaw.officialUrl).toBe(
      "http://localhost:3000/sell",
    );
    expect(SUPREME_BLOOD_CODE_XX_V1.bottomNavigationLaw.visible).toBe(true);
    expect(SUPREME_BLOOD_CODE_XX_V1.searchBarLaw.forbiddenOnSell).toBe(true);
  });

  it("allows /sell only; forbids cross-module; no search bar mount", () => {
    expect(isBloodXxSellRouteAllowed("/sell")).toBe(true);
    expect(resolveBloodXxScopePolicy("/sell").allowed).toBe(true);
    expect(resolveBloodXxScopePolicy("/wallet").allowed).toBe(false);
    expect(resolveBloodXxScopePolicy("/orders").allowed).toBe(false);
    expect(isHomepageSearchBarRoute("/sell")).toBe(false);
    expect(isBloodXxBottomNavVisibleOnSell(false)).toBe(true);
    expect(isBloodXxBottomNavVisibleOnSell(true)).toBe(false);
  });

  it("live roadmap: I–IV LOCKED · V permanent freeze · VI approved", () => {
    expect(SUPREME_BLOOD_CODE_XX_V1.liveSprintStatus.IV).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XX_V1.liveSprintStatus.V).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XX_V1.liveSprintStatus.VI).toBe("IN_DEVELOPMENT");
    expect(SUPREME_BLOOD_CODE_XV_V1.liveSprintStatus.IV).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XV_V1.liveSprintStatus.V).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XVIII_V1.liveSprintStatus.IV).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XIX_V1.liveSprintStatus.IV).toBe("LOCKED");
  });

  it("permanent freeze only after full certification chain", () => {
    expect(
      resolveBloodXxPermanentFreeze({
        automaticCertificationPass: true,
        ownerCertificationPass: false,
        complete100: true,
        noRegressionPass: true,
      }),
    ).toBe("NOT_READY");
    expect(
      resolveBloodXxPermanentFreeze({
        automaticCertificationPass: true,
        ownerCertificationPass: true,
        complete100: true,
        noRegressionPass: true,
      }),
    ).toBe("PERMANENT_FREEZE");
  });

  it("wires into Blood I/XIX parents, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      sprintVSellExecutionMode: "lib/supreme-blood-code-xx-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeXx: "lib/supreme-blood-code-xx-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeXx: "lib/supreme-blood-code-xx-v1.ts",
    });
  });

  it("persists rule/doc; Sell shows bottom nav + Blood XX stamps; success View→Share→Sell Another", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-xx-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_XX_V1.md");
    const sellPage = readSource("features/sell/ui/SellPage.tsx");
    const success = readSource("components/sell/PublishSuccessDialog.tsx");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("EXECUTION MODE");
    expect(rule).toContain("http://localhost:3000/sell");
    expect(doc).toContain("Execution Mode");
    expect(sellPage).toContain('data-blood-code-xx="20.0"');
    expect(sellPage).toContain("showBottomNav={true}");
    const viewIdx = success.lastIndexOf("View Listing");
    const shareBtnIdx = success.lastIndexOf("Share Listing");
    const sellAnotherIdx = success.lastIndexOf("Sell Another Item");
    expect(viewIdx).toBeGreaterThan(-1);
    expect(shareBtnIdx).toBeGreaterThan(viewIdx);
    expect(sellAnotherIdx).toBeGreaterThan(shareBtnIdx);
  });
});
