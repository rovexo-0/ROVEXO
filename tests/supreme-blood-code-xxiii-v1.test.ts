import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SUPREME_BLOOD_CODE_XXIII_V1,
  isBloodXxiiiCheckoutRouteAllowed,
  resolveBloodXxiiiScopePolicy,
  resolveBloodXxiiiPermanentFreeze,
  isBloodXxiiiBottomNavForbidden,
} from "@/lib/supreme-blood-code-xxiii-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_XI_V1 } from "@/lib/supreme-blood-code-xi-v1";
import { SUPREME_BLOOD_CODE_XV_V1 } from "@/lib/supreme-blood-code-xv-v1";
import { SUPREME_BLOOD_CODE_XXII_V1 } from "@/lib/supreme-blood-code-xxii-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";
import { isHomepageSearchBarRoute } from "@/lib/header/homepage-search-bar-only-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code XXIII — Sprint VI Checkout", () => {
  it("locks OWNER CERTIFIED · PERMANENT FREEZE after Owner visual PASS", () => {
    expect(SUPREME_BLOOD_CODE_XXIII_V1.codename).toBe(
      "SPRINT_VI_CHECKOUT_OWNER_CERTIFIED_PERMANENT_FREEZE",
    );
    expect(SUPREME_BLOOD_CODE_XXIII_V1.status).toBe(
      "100_COMPLETE_OWNER_CERTIFIED_PERMANENT_FREEZE",
    );
    expect(SUPREME_BLOOD_CODE_XXIII_V1.developmentStatus).toBe("PERMANENTLY_FROZEN");
    expect(SUPREME_BLOOD_CODE_XXIII_V1.permanentlyFrozen).toBe(true);
    expect(SUPREME_BLOOD_CODE_XXIII_V1.complete100).toBe(true);
    expect(SUPREME_BLOOD_CODE_XXIII_V1.ownerCertified).toBe(true);
    expect(SUPREME_BLOOD_CODE_XXIII_V1.checkoutLaw.officialUrl).toBe(
      "http://localhost:3000/checkout",
    );
    expect(SUPREME_BLOOD_CODE_XXIII_V1.paymentLaw.oneClickEqualsOnePayment).toBe(true);
    expect(isBloodXxiiiBottomNavForbidden()).toBe(true);
    expect(SUPREME_BLOOD_CODE_XXIII_V1.searchBarLaw.forbiddenOnCheckout).toBe(true);
  });

  it("allows /checkout only; no search bar mount; forbids cross-module", () => {
    expect(isBloodXxiiiCheckoutRouteAllowed("/checkout")).toBe(true);
    expect(isBloodXxiiiCheckoutRouteAllowed("/checkout/abc")).toBe(true);
    expect(resolveBloodXxiiiScopePolicy("/checkout").allowed).toBe(true);
    expect(resolveBloodXxiiiScopePolicy("/sell").allowed).toBe(false);
    expect(resolveBloodXxiiiScopePolicy("/wallet").allowed).toBe(false);
    expect(isHomepageSearchBarRoute("/checkout")).toBe(false);
    expect(isHomepageSearchBarRoute("/checkout/abc/success")).toBe(false);
  });

  it("live roadmap: I–VI LOCKED · VII+ forbidden", () => {
    expect(SUPREME_BLOOD_CODE_XXIII_V1.liveSprintStatus.V).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XXIII_V1.liveSprintStatus.VI).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XXIII_V1.liveSprintStatus.VII).toBe("FORBIDDEN_TO_START");
    expect(SUPREME_BLOOD_CODE_XV_V1.liveSprintStatus.VI).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XXII_V1.liveSprintStatus.VI).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XI_V1.currentSprint).toBe("VI");
    expect(SUPREME_BLOOD_CODE_XI_V1.currentModule).toBe("CHECKOUT");
  });

  it("permanent freeze only after verified + audited + Owner chain", () => {
    expect(
      resolveBloodXxiiiPermanentFreeze({
        verifiedAllPass: true,
        auditedAllPass: true,
        automaticCertificationPass: true,
        ownerCertificationPass: false,
        noRegressionPass: true,
        complete100: true,
      }),
    ).toBe("NOT_READY");
    expect(
      resolveBloodXxiiiPermanentFreeze({
        verifiedAllPass: true,
        auditedAllPass: true,
        automaticCertificationPass: true,
        ownerCertificationPass: true,
        noRegressionPass: true,
        complete100: true,
      }),
    ).toBe("PERMANENT_FREEZE");
  });

  it("wires into Blood I/XXII parents, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      sprintViCheckoutApprovedToStart: "lib/supreme-blood-code-xxiii-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeXxiii: "lib/supreme-blood-code-xxiii-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeXxiii: "lib/supreme-blood-code-xxiii-v1.ts",
    });
  });

  it("persists rule/doc; Checkout hides bottom nav + Blood XXIII stamps", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-xxiii-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_XXIII_V1.md");
    const page = readSource("features/checkout/components/CheckoutPage.tsx");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("PERMANENT FREEZE");
    expect(rule).toContain("ONE CLICK = ONE PAYMENT");
    expect(doc).toContain("Sprint VI Checkout");
    expect(doc).toContain("http://localhost:3000/checkout");
    expect(page).toContain("showBottomNav={false}");
    expect(page).toContain('data-blood-code-xxiii="23.0"');
    expect(page).toContain('data-blood-code-xxiv="24.0"');
    expect(page).toContain('data-absolute-financial-law="1.0"');
    expect(page).toContain('data-checkout-sprint="VI"');
    expect(page).toContain('data-checkout-sprint-status="PERMANENTLY-FROZEN"');
  });
});
