import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SUPREME_BLOOD_CODE_XVIII_V1,
  isBloodXviiiSellRouteAllowed,
  isBloodXviiiForbiddenEntryPoint,
  resolveBloodXviiiScopePolicy,
  resolveBloodXviiiPermanentFreeze,
  canStartSprintViCheckout,
} from "@/lib/supreme-blood-code-xviii-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_XI_V1 } from "@/lib/supreme-blood-code-xi-v1";
import { SUPREME_BLOOD_CODE_XIV_V1, isSprintVSellForbidden } from "@/lib/supreme-blood-code-xiv-v1";
import { SUPREME_BLOOD_CODE_XV_V1 } from "@/lib/supreme-blood-code-xv-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";
import { isHomepageSearchBarRoute } from "@/lib/header/homepage-search-bar-only-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code XVIII — Sprint V Sell", () => {
  it("locks APPROVED TO START · IN DEVELOPMENT (not invent 100%/freeze)", () => {
    expect(SUPREME_BLOOD_CODE_XVIII_V1.codename).toBe(
      "SPRINT_V_SELL_APPROVED_TO_START",
    );
    expect(SUPREME_BLOOD_CODE_XVIII_V1.status).toBe("APPROVED_TO_START");
    expect(SUPREME_BLOOD_CODE_XVIII_V1.developmentStatus).toBe(
      "100_COMPLETE_OWNER_CERTIFIED_PERMANENT_FREEZE",
    );
    expect(SUPREME_BLOOD_CODE_XVIII_V1.permanentlyFrozen).toBe(true);
    expect(SUPREME_BLOOD_CODE_XVIII_V1.complete100).toBe(true);
    expect(SUPREME_BLOOD_CODE_XVIII_V1.ownerCertified).toBe(true);
    expect(SUPREME_BLOOD_CODE_XVIII_V1.officialRoute).toBe("/sell");
    expect(SUPREME_BLOOD_CODE_XVIII_V1.officialLocalhost).toBe(
      "http://localhost:3000/sell",
    );
    expect(SUPREME_BLOOD_CODE_XVIII_V1.uiLaw.masterDevice).toBe("IPHONE_17_PRO_MAX");
    expect(SUPREME_BLOOD_CODE_XVIII_V1.searchBarLaw.forbiddenOnSell).toBe(true);
  });

  it("allows /sell only and forbids alternate entry points", () => {
    expect(isBloodXviiiSellRouteAllowed("/sell")).toBe(true);
    expect(isBloodXviiiForbiddenEntryPoint("/sell-v2")).toBe(true);
    expect(isBloodXviiiForbiddenEntryPoint("/sell-wizard")).toBe(true);
    expect(isBloodXviiiForbiddenEntryPoint("/sell")).toBe(false);
    expect(resolveBloodXviiiScopePolicy("/sell").allowed).toBe(true);
    expect(resolveBloodXviiiScopePolicy("/wallet").allowed).toBe(false);
    expect(resolveBloodXviiiScopePolicy("/orders").allowed).toBe(false);
    expect(isHomepageSearchBarRoute("/sell")).toBe(false);
  });

  it("live roadmap: I–IV LOCKED · V permanent freeze · VI approved", () => {
    expect(SUPREME_BLOOD_CODE_XVIII_V1.liveSprintStatus.I).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XVIII_V1.liveSprintStatus.IV).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XVIII_V1.liveSprintStatus.V).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XVIII_V1.liveSprintStatus.VI).toBe("IN_DEVELOPMENT");
    expect(SUPREME_BLOOD_CODE_XV_V1.liveSprintStatus.IV).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XV_V1.liveSprintStatus.V).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XI_V1.currentSprint).toBe("VI");
    expect(SUPREME_BLOOD_CODE_XI_V1.currentModule).toBe("CHECKOUT");
    expect(isSprintVSellForbidden()).toBe(false);
    expect(SUPREME_BLOOD_CODE_XIV_V1.developmentStatus).toBe("LOCKED");
  });

  it("permanent freeze and Sprint VI only after full Owner chain", () => {
    expect(
      resolveBloodXviiiPermanentFreeze({
        mobileExperience: true,
        photoExperience: true,
        publishExperience: true,
        responsiveBehaviour: true,
        compactPremiumDesign: true,
        localhostExperience: true,
        productionReadiness: true,
        automaticCertificationPass: true,
        ownerCertificationPass: false,
        complete100: true,
      }),
    ).toBe("NOT_READY");
    expect(
      resolveBloodXviiiPermanentFreeze({
        mobileExperience: true,
        photoExperience: true,
        publishExperience: true,
        responsiveBehaviour: true,
        compactPremiumDesign: true,
        localhostExperience: true,
        productionReadiness: true,
        automaticCertificationPass: true,
        ownerCertificationPass: true,
        complete100: true,
      }),
    ).toBe("PERMANENT_FREEZE");
    expect(
      canStartSprintViCheckout({
        sellOwnerCertified: false,
        sellComplete100: true,
        sellPermanentFreeze: true,
      }),
    ).toBe(false);
    expect(
      canStartSprintViCheckout({
        sellOwnerCertified: true,
        sellComplete100: true,
        sellPermanentFreeze: true,
      }),
    ).toBe(true);
  });

  it("wires into Blood I/XVII parents, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      sprintVSellApprovedToStart: "lib/supreme-blood-code-xviii-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeXviii: "lib/supreme-blood-code-xviii-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeXviii: "lib/supreme-blood-code-xviii-v1.ts",
    });
  });

  it("persists rule and doc; SellPage stamps Blood XVIII", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-xviii-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_XVIII_V1.md");
    const sellPage = readSource("features/sell/ui/SellPage.tsx");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("IN DEVELOPMENT");
    expect(rule).toContain("http://localhost:3000/sell");
    expect(doc).toContain("Sprint V Sell");
    expect(doc).toContain("IN DEVELOPMENT");
    expect(sellPage).toContain('data-blood-code-xviii="18.0"');
    expect(sellPage).toContain('data-sell-sprint="V"');
    expect(sellPage).toContain('data-sell-sprint-status="PERMANENT-FREEZE"');
  });
});
