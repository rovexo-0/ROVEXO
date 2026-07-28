import { describe, expect, it } from "vitest";
import {
  MY_ACCOUNT_V1_ACCOUNT_DETAILS,
  MY_ACCOUNT_V1_ADDRESSES,
  MY_ACCOUNT_V1_BUTTON,
  MY_ACCOUNT_V1_CARD,
  MY_ACCOUNT_V1_DESIGN_LOCK,
  MY_ACCOUNT_V1_FORBIDDEN_PRIVATE_PAGES,
  MY_ACCOUNT_V1_FULL_WIDTH,
  MY_ACCOUNT_V1_HEADER,
  MY_ACCOUNT_V1_INHERITANCE_PAGES,
  MY_ACCOUNT_V1_LOCKS,
  MY_ACCOUNT_V1_MASTER_TEMPLATE,
  MY_ACCOUNT_V1_MIN_VISUAL_SCORE,
  MY_ACCOUNT_V1_ONE_CHANGE_RULE,
  MY_ACCOUNT_V1_PRODUCTION_PAGES,
  MY_ACCOUNT_V1_PROHIBITED,
  MY_ACCOUNT_V1_RULES,
  MY_ACCOUNT_V1_STATUS,
  MY_ACCOUNT_V1_SURFACES,
  MY_ACCOUNT_V1_TEMPLATE_PRODUCTION_GATE,
  MY_ACCOUNT_V1_TYPE,
  MY_ACCOUNT_V1_VISUAL_PROPORTION,
  MY_ACCOUNT_V1_VISUAL_QA_PAGES,
  evaluateMyAccountVisualGate,
  myAccountV1Snapshot,
} from "@/lib/design-system/my-account-v1";
import { PROFILE_MASTER_DESIGN_RULES } from "@/lib/design-system/profile-master-design-lock";
import { FULL_WIDTH_ENGINE_SPEC } from "@/lib/master-engine/full-width-engine";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
function readSource(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("My Account v1.0 UI/UX Master Lock", () => {
  it("locks RULE #1 single design system via Profile master", () => {
    expect(MY_ACCOUNT_V1_STATUS).toContain("PERMANENTLY LOCKED");
    expect(MY_ACCOUNT_V1_STATUS).toContain("APPROVED");
    expect(MY_ACCOUNT_V1_LOCKS.singleDesignSystem).toBe(true);
    expect(MY_ACCOUNT_V1_LOCKS.profileIsVisualMasterTemplate).toBe(true);
    expect(MY_ACCOUNT_V1_LOCKS.profileIsMasterPage).toBe(true);
    expect(MY_ACCOUNT_V1_LOCKS.masterPageLock).toBe(true);
    expect(MY_ACCOUNT_V1_LOCKS.onlyContentMayDiffer).toBe(true);
    expect(MY_ACCOUNT_V1_LOCKS.designNeverDiffers).toBe(true);
    expect(MY_ACCOUNT_V1_RULES).toHaveLength(28);
    expect(MY_ACCOUNT_V1_PROHIBITED).toContain("2 Design Systems");
    expect(myAccountV1Snapshot().masterPage).toBe("profile");
  });

  it("locks Master Page Lock (icons · colours · proportions · SSOT)", () => {
    const lock = myAccountV1Snapshot().masterPageLock;
    expect(lock.status).toBe("PERMANENTLY LOCKED");
    expect(lock.approved).toBe(true);
    expect(lock.permanentSsotContract).toBe(true);
    expect(lock.onlyMasterPage).toBe(true);
    expect(lock.noPageMayHaveOwnDesignSystem).toBe(true);
    expect(lock.noOtherPageMayOverride).toBe(true);
    expect(lock.masterPage).toBe("PROFILE PAGE");
    expect(lock.equals).toContain("MASTER ICON FAMILY");
    expect(lock.equals).toContain("MASTER BUTTON SYSTEM");
    expect(lock.equals).toContain("MASTER HEADER SYSTEM");
    expect(lock.goldenRule).toBe("ONLY CONTENT MAY DIFFER. DESIGN NEVER DOES.");
    expect(lock.inheritanceChain).toContain("SETTINGS");
    expect(lock.inheritanceChain).toContain("PERSONAL INFORMATION");
    expect(lock.inheritanceChain).toContain("ALL FUTURE MY ACCOUNT PAGES");
    expect(lock.oneChangeRule).toBe(true);
    expect(lock.sideBySideRule).toBe(true);
    expect(lock.visualQaRule).toBe(true);
    expect(lock.productionGate.blocksInventedPx).toBe(true);
    expect(lock.productionGate.blocksFailedSideBySideQa).toBe(true);
    expect(lock.finalEquation).toBe("PROFILE = SINGLE SOURCE OF TRUTH");
    expect(lock.iconFamily.component).toBe("AccountIcon");
    expect(lock.iconFamily.privateIconFamiliesForbidden).toBe(true);
    expect(lock.colorSystem.privateColorSystemsForbidden).toBe(true);
    expect(MY_ACCOUNT_V1_ONE_CHANGE_RULE.examples).toContain("Icon Family → all pages");
    expect(MY_ACCOUNT_V1_PROHIBITED).toContain("alternate icon families");
    expect(PROFILE_MASTER_DESIGN_RULES.masterPage).toBe(true);
    expect(PROFILE_MASTER_DESIGN_RULES.masterIconFamily).toBe(true);
  });

  it("locks RULE #2–#6 tokens", () => {
    expect(MY_ACCOUNT_V1_FULL_WIDTH.paddingLeftPx).toBe(16);
    expect(MY_ACCOUNT_V1_FULL_WIDTH.paddingTopPx).toBe(24);
    expect(MY_ACCOUNT_V1_FULL_WIDTH.sectionSpacingPx).toBe(24);
    expect(MY_ACCOUNT_V1_FULL_WIDTH.radiusPx).toBe(16);
    expect(MY_ACCOUNT_V1_HEADER.heightPx).toBe(64);
    expect(MY_ACCOUNT_V1_TYPE.pageTitlePx).toBe(32);
    expect(MY_ACCOUNT_V1_TYPE.sectionTitlePx).toBe(24);
    expect(MY_ACCOUNT_V1_TYPE.bodyPx).toBe(16);
    expect(MY_ACCOUNT_V1_TYPE.smallPx).toBe(14);
    expect(MY_ACCOUNT_V1_BUTTON.heightPx).toBe(56);
    expect(MY_ACCOUNT_V1_BUTTON.examples).toContain("ADD BUSINESS ADDRESS");
    expect(MY_ACCOUNT_V1_CARD.radiusPx).toBe(16);
    expect(MY_ACCOUNT_V1_CARD.paddingPx).toBe(24);
    expect(FULL_WIDTH_ENGINE_SPEC.paddingBottomPx).toBe(24);
    expect(PROFILE_MASTER_DESIGN_RULES.smallPx).toBe(14);
  });

  it("locks RULE #7–#10 Account Details and Addresses", () => {
    expect(MY_ACCOUNT_V1_ACCOUNT_DETAILS.inheritsProfile100Percent).toBe(true);
    expect(MY_ACCOUNT_V1_ADDRESSES.inheritsProfile100Percent).toBe(true);
    expect(MY_ACCOUNT_V1_ADDRESSES.ownerApprovedMockupLocked).toBe(true);
    expect(MY_ACCOUNT_V1_ADDRESSES.doNotRedesign).toBe(true);
    expect(MY_ACCOUNT_V1_ADDRESSES.mergeOnly).toBe(true);
    expect(MY_ACCOUNT_V1_ADDRESSES.neverCopyProfileAsAddresses).toBe(true);
    expect(MY_ACCOUNT_V1_ADDRESSES.businessTabHiddenUntilVerified).toBe(true);
    expect(MY_ACCOUNT_V1_ADDRESSES.neverShowBothScopesSimultaneously).toBe(true);
    expect(MY_ACCOUNT_V1_ADDRESSES.editSheetActions).toEqual([
      "Edit Address",
      "Set as Default",
      "Delete Address",
      "Cancel",
    ]);
    expect(MY_ACCOUNT_V1_SURFACES).toContain("Personal Information");
    expect(MY_ACCOUNT_V1_SURFACES).toContain("Addresses");
  });

  it("locks RULE #14–#21 Visual Proportion Lock", () => {
    expect(MY_ACCOUNT_V1_VISUAL_PROPORTION.rule14_profileToOneHundredOnly).toBe(true);
    expect(MY_ACCOUNT_V1_VISUAL_PROPORTION.rule15_visualClone).toBe(true);
    expect(MY_ACCOUNT_V1_VISUAL_PROPORTION.rule16_sameBreathingSpace).toBe(true);
    expect(MY_ACCOUNT_V1_VISUAL_PROPORTION.rule17_contentOnlyMayChange).toBe(true);
    expect(MY_ACCOUNT_V1_VISUAL_PROPORTION.rule18_sideBySideVisualQaRequired).toBe(true);
    expect(MY_ACCOUNT_V1_VISUAL_QA_PAGES).toEqual([
      "Profile",
      "Personal Information",
      "Addresses",
      "Settings",
      "Security",
    ]);
    expect(MY_ACCOUNT_V1_MIN_VISUAL_SCORE).toBe(9.5);
    expect(MY_ACCOUNT_V1_PRODUCTION_PAGES).toContain("Verification");
    expect(MY_ACCOUNT_V1_LOCKS.visualProportionLock).toBe(true);
    expect(MY_ACCOUNT_V1_LOCKS.permanentlyLocked).toBe(true);
  });

  it("rejects visual gate when any page is below 9.5/10", () => {
    const fail = evaluateMyAccountVisualGate({
      Profile: 10,
      Settings: 9.5,
      "Personal Information": 8,
      Addresses: 9.5,
      Notifications: 9.5,
      Security: 9.5,
      Verification: 9.5,
    });
    expect(fail.pass).toBe(false);
    expect(fail.rejected).toBe(true);
    expect(fail.failedPages).toContain("Personal Information");

    const pass = evaluateMyAccountVisualGate({
      Profile: 10,
      Settings: 9.5,
      "Personal Information": 9.5,
      Addresses: 9.6,
      Notifications: 9.5,
      Security: 9.7,
      Verification: 9.5,
    });
    expect(pass.pass).toBe(true);
    expect(pass.rejected).toBe(false);
    expect(pass.failedPages).toEqual([]);
  });

  it("locks RULE #22–#28 Master Template Engine + Inheritance", () => {
    expect(MY_ACCOUNT_V1_MASTER_TEMPLATE.component).toBe("MyAccountTemplate");
    expect(MY_ACCOUNT_V1_MASTER_TEMPLATE.engines).toContain("FULL WIDTH ENGINE");
    expect(MY_ACCOUNT_V1_INHERITANCE_PAGES).toContain("Settings");
    expect(MY_ACCOUNT_V1_INHERITANCE_PAGES).toContain("Verification");
    expect(MY_ACCOUNT_V1_FORBIDDEN_PRIVATE_PAGES).toContain("Addresses.tsx");
    expect(MY_ACCOUNT_V1_ONE_CHANGE_RULE.enabled).toBe(true);
    expect(MY_ACCOUNT_V1_DESIGN_LOCK.onlyContentMayDiffer).toBe(true);
    expect(MY_ACCOUNT_V1_TEMPLATE_PRODUCTION_GATE.blocksProduction).toBe(true);
    expect(MY_ACCOUNT_V1_LOCKS.masterTemplateEngine).toBe(true);
    expect(MY_ACCOUNT_V1_LOCKS.inheritanceLock).toBe(true);
    expect(MY_ACCOUNT_V1_LOCKS.oneChangeRule).toBe(true);
    expect(MY_ACCOUNT_V1_LOCKS.futureProofInheritance).toBe(true);
    expect(myAccountV1Snapshot().masterTemplate.component).toBe("MyAccountTemplate");
  });

  it("requires My Account pages to inherit MyAccountTemplate (source gate)", () => {
    const required = [
      "features/account/components/ProfileEditPage.tsx",
      "features/account/components/addresses/AddressesPage.tsx",
      "features/account/components/AccountSecurityPage.tsx",
      "features/account/components/AccountCurrencyPage.tsx",
      "features/account/components/AccountPrivacyPage.tsx",
      "features/account-module/components/SettingsV1.tsx",
      "features/account-center/components/VerificationHubPage.tsx",
      "features/notifications/components/NotificationSettingsPage.tsx",
    ];
    for (const file of required) {
      const src = readSource(file);
      expect(src, `${file} must import MyAccountTemplate`).toContain("MyAccountTemplate");
      expect(src, `${file} must not use bare AccountCanonicalShell`).not.toMatch(
        /import\s*\{[^}]*AccountCanonicalShell[^}]*\}\s*from\s*["']@\/features\/account-canonical["']/,
      );
    }
    expect(readSource("features/account-canonical/MyAccountTemplate.tsx")).toContain(
      "MY ACCOUNT MASTER TEMPLATE",
    );
  });
});
