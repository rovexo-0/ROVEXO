import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  accountBusinessEntryHref,
  businessOnboardingHref,
} from "@/lib/business/business-onboarding-contract-v1";
import { BUSINESS_VERIFICATION_ROUTE } from "@/lib/business/access";
import {
  PWA_BUSINESS_MENU_ITEMS,
  PWA_BUSINESS_QUICK_ACTIONS,
} from "@/lib/business/pwa-business-menu-v1";

function src(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("PWA Business experience — Account → Information → Stripe → Home", () => {
  it("opens Business Information from Account with no upgrade intermediary", () => {
    expect(accountBusinessEntryHref(null)).toBe("/business/information");
    expect(accountBusinessEntryHref(undefined)).toBe("/business/information");
    expect(src("features/account-center/components/AccountCenterHome.tsx")).toContain(
      "BusinessUpgradeCard",
    );
    expect(src("lib/business/business-onboarding-contract-v1.ts")).toContain("Upgrade to Business");
    expect(src("lib/business/business-onboarding-contract-v1.ts")).toContain("Switch to Business");
    expect(src("lib/business/business-onboarding-contract-v1.ts")).toContain("Switch to Individual");
    expect(src("lib/business/business-onboarding-contract-v1.ts")).toContain("🚀");
    expect(src("features/business/onboarding/BusinessUpgradeCard.tsx")).toContain(
      "resolveProfileBusinessAction",
    );
    expect(src("features/business/onboarding/BusinessUpgradeCard.tsx")).toContain(
      "requestSellerContextSwitch",
    );
    expect(src("features/business/onboarding/BusinessUpgradeCard.tsx")).toContain(
      "navigateAfterSellerContextSwitch",
    );
    expect(src("lib/business/switch-seller-context-client.ts")).toContain(
      "BUSINESS_DASHBOARD_ROUTE",
    );
    expect(src("features/business/onboarding/BusinessUpgradeCard.tsx")).not.toContain(
      "router.refresh()",
    );
    expect(src("features/business/onboarding/BusinessUpgradeCard.tsx")).toContain("CanonicalMenuRow");
    expect(src("features/business/onboarding/BusinessUpgradeCard.tsx")).not.toContain(
      "Start selling as a business",
    );
    expect(src("app/(platform)/business/information/page.tsx")).toContain("BusinessInformationForm");
    expect(src("app/(platform)/account/page.tsx")).not.toContain("UpgradeToBusiness");
    expect(src("features/business/onboarding/BusinessInformationForm.tsx")).toContain(
      'from "@/lib/business/business-onboarding-contract-v1"',
    );
    expect(src("features/business/onboarding/BusinessInformationForm.tsx")).not.toContain(
      'from "@/lib/business/business-onboarding-v1"',
    );
  });

  it("does not ship a ROVEXO KYC / Proof of Business page", () => {
    expect(src("app/(platform)/business/verification/page.tsx")).toContain(
      'redirect("/business/connect")',
    );
    expect(src("app/(platform)/business/verification/page.tsx")).not.toContain("VerificationHubPage");
    expect(src("features/business/onboarding/BusinessInformationForm.tsx")).not.toContain(
      "Proof of Business",
    );
    expect(src("features/business/onboarding/BusinessConnectStripe.tsx")).not.toContain("Photo ID");
    expect(BUSINESS_VERIFICATION_ROUTE).toBe("/business/connect");
  });

  it("PWA Connect uses surface=pwa return URLs without changing Native bridge", () => {
    expect(src("app/api/business/connect/route.ts")).toContain('body?.surface === "pwa"');
    expect(src("app/api/business/connect/route.ts")).toContain("resolveBusinessConnectAppBase");
    expect(src("lib/business/business-onboarding-v1.ts")).toContain(
      "/business/connect/return?status=success",
    );
    expect(src("app/api/business/connect/return/route.ts")).toContain("rovexo://business/connect");
    expect(src("features/business/onboarding/BusinessConnectStripe.tsx")).toContain(
      'surface: "pwa"',
    );
    expect(src("features/business/onboarding/BusinessConnectStripe.tsx")).toContain(
      "runtimeOrigin: window.location.origin",
    );
    expect(src("features/business/onboarding/BusinessConnectReturn.tsx")).toContain(
      "/api/business/status?refresh=1",
    );
  });

  it("Business Active and Home are Stripe-gated", () => {
    expect(src("app/(platform)/business/active/page.tsx")).toContain("status.stripe.verified");
    expect(src("app/(platform)/business/dashboard/page.tsx")).toContain("BusinessHomeScreen");
    expect(src("app/(platform)/business/dashboard/page.tsx")).not.toContain("/business/verification");
    expect(src("features/business/onboarding/BusinessHomeScreen.tsx")).toContain(
      "status.wallet",
    );
    expect(src("features/business/onboarding/BusinessHomeScreen.tsx")).not.toContain("1248.75");
    expect(businessOnboardingHref("home")).toBe("/business/dashboard");
  });

  it("Business Menu uses emoji icons and real destinations", () => {
    expect(PWA_BUSINESS_MENU_ITEMS.map((item) => item.title)).toEqual([
      "Orders",
      "Inventory",
      "Analytics",
      "Wallet",
      "VAT",
      "Store",
      "Promote",
    ]);
    expect(PWA_BUSINESS_MENU_ITEMS.some((item) => item.id === "promote" && item.comingSoon)).toBe(
      true,
    );
    expect(PWA_BUSINESS_MENU_ITEMS.every((item) => /\p{Extended_Pictographic}/u.test(item.emoji))).toBe(
      true,
    );
    expect(src("features/business/onboarding/BusinessMenuScreen.tsx")).toContain(
      "Switch to Individual",
    );
    expect(src("features/business/onboarding/BusinessMenuScreen.tsx")).toContain(
      "requestSellerContextSwitch",
    );
    expect(src("features/business/onboarding/BusinessMenuScreen.tsx")).not.toContain("MasterMenuIcon");
    expect(src("features/business/dashboard/components/BusinessMenuSections.tsx")).not.toContain("MasterMenuIcon");
    expect(src("features/business/dashboard/components/BusinessMenuSections.tsx")).not.toContain("AccountIcon");
    expect(src("app/(platform)/business/shipping/page.tsx")).not.toContain("AccountIcon");
    expect(src("app/(platform)/business/shipping/page.tsx")).toContain("PWA_BUSINESS_ACTION_EMOJI");
    expect(PWA_BUSINESS_QUICK_ACTIONS.map((item) => item.href)).toEqual([
      "/sell",
      "/business/orders",
      "/store",
      "/business/analytics",
    ]);
  });

  it("reuses canonical Store without Shop Categories or Featured sections", () => {
    const menu = src("features/business/onboarding/BusinessMenuScreen.tsx");
    expect(menu).toContain("storeHref");
    expect(src("app/(platform)/store/[slug]/page.tsx")).toContain("StoreVisitPageV2");
    expect(src("features/store/components/StoreVisitPageV2.tsx")).not.toContain("Shop Categories");
    expect(src("features/store/components/StoreVisitPageV2.tsx")).not.toContain("Featured Picks");
    expect(src("lib/store/store-v2-final-v1.ts")).toContain("Featured");
  });

  it("VAT opens existing seller tax registration", () => {
    expect(src("app/(platform)/business/tax/page.tsx")).toContain("SellerTaxRegistrationPage");
    expect(src("app/(platform)/business/tax/page.tsx")).toContain(
      'createConnectAccountLink(profile.id, "business")',
    );
    expect(src("lib/business/pwa-business-menu-v1.ts")).toContain('href: "/business/tax"');
  });
});
