import { describe, expect, it } from "vitest";
import {
  ACCOUNT_DETAILS_ONE_PAGE_FIELDS,
  PROFILE_MASTER_DESIGN_REFERENCE,
  PROFILE_MASTER_DESIGN_RULES,
  PROFILE_MASTER_DESIGN_STATUS,
} from "@/lib/design-system/profile-master-design-lock";
import {
  MY_ACCOUNT_V1_ADDRESSES,
  MY_ACCOUNT_V1_BUTTON,
  MY_ACCOUNT_V1_FULL_WIDTH,
  MY_ACCOUNT_V1_HEADER,
  MY_ACCOUNT_V1_STATUS,
  MY_ACCOUNT_V1_TYPE,
  myAccountV1Snapshot,
} from "@/lib/design-system/my-account-v1";
import { FULL_WIDTH_ENGINE_SPEC } from "@/lib/master-engine/full-width-engine";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("My Account v1.0 + Profile Master Design", () => {
  it("locks Profile as master with My Account v1.0 tokens", () => {
    expect(PROFILE_MASTER_DESIGN_STATUS).toBe("PERMANENTLY LOCKED");
    expect(PROFILE_MASTER_DESIGN_REFERENCE).toBe("profile");
    expect(MY_ACCOUNT_V1_STATUS).toContain("APPROVED");
    expect(PROFILE_MASTER_DESIGN_RULES.width).toBe("100%");
    expect(PROFILE_MASTER_DESIGN_RULES.paddingYPx).toBe(24);
    expect(PROFILE_MASTER_DESIGN_RULES.headerHeightPx).toBe(64);
    expect(PROFILE_MASTER_DESIGN_RULES.pageTitlePx).toBe(32);
    expect(PROFILE_MASTER_DESIGN_RULES.onePagePhilosophy).toBe(true);
    expect(PROFILE_MASTER_DESIGN_RULES.noDecorativeCards).toBe(true);
    expect(ACCOUNT_DETAILS_ONE_PAGE_FIELDS).not.toContain("Language");
    expect(ACCOUNT_DETAILS_ONE_PAGE_FIELDS).not.toContain("SAVE CHANGES");
    expect(ACCOUNT_DETAILS_ONE_PAGE_FIELDS).not.toContain("Currency");
    expect(ACCOUNT_DETAILS_ONE_PAGE_FIELDS).not.toContain("ROVEXO VERIFIED");
    expect(ACCOUNT_DETAILS_ONE_PAGE_FIELDS).toContain("Email Address");
    expect(ACCOUNT_DETAILS_ONE_PAGE_FIELDS).toContain("Country");
  });

  it("locks full width Design Decision #001 (internal 16 L/R · vertical 24) and header 64", () => {
    expect(MY_ACCOUNT_V1_FULL_WIDTH.paddingTopPx).toBe(24);
    expect(MY_ACCOUNT_V1_FULL_WIDTH.paddingBottomPx).toBe(24);
    expect(MY_ACCOUNT_V1_FULL_WIDTH.paddingLeftPx).toBe(16);
    expect(MY_ACCOUNT_V1_HEADER.heightPx).toBe(64);
    expect(MY_ACCOUNT_V1_TYPE.pageTitlePx).toBe(32);
    expect(MY_ACCOUNT_V1_BUTTON.heightPx).toBe(56);
    expect(MY_ACCOUNT_V1_BUTTON.radiusPx).toBe(16);
    expect(FULL_WIDTH_ENGINE_SPEC.paddingTopPx).toBe(24);
    expect(FULL_WIDTH_ENGINE_SPEC.paddingBottomPx).toBe(24);
    expect(FULL_WIDTH_ENGINE_SPEC.paddingLeftPx).toBe(16);
    expect(readSource("styles/rovexo/full-width-engine-v1.css")).toContain("--fw-pad-y: 24px");
  });

  it("locks Addresses personal/business exclusive edit rules", () => {
    expect(MY_ACCOUNT_V1_ADDRESSES.businessTabRequiresVerification).toBe(false);
    expect(MY_ACCOUNT_V1_ADDRESSES.neverShowBothScopesSimultaneously).toBe(true);
    expect(MY_ACCOUNT_V1_ADDRESSES.editSheetActions).toContain("Delete Address");
    expect(MY_ACCOUNT_V1_ADDRESSES.neverShowDeletePermanentlyOnCard).toBe(true);
    const snap = myAccountV1Snapshot();
    expect(snap.locks.singleDesignSystem).toBe(true);
    expect(snap.locks.productionReady).toBe(true);
    expect(snap.locks.onlyContentMayDiffer).toBe(true);
    expect(snap.locks.designNeverDiffers).toBe(true);
    expect(snap.locks.visualProportionLock).toBe(true);
    expect(snap.minVisualScore).toBe(9.5);
  });

  it("keeps Personal Information as one page without Language, Currency, or SAVE button", () => {
    const page = readSource("features/account/components/ProfileEditPage.tsx");
    expect(page).toContain("data-account-settings={ACCOUNT_SETTINGS_DOM}");
    expect(page).toContain("data-personal-information=\"v1.0\"");
    expect(page).toContain("Profile Photo");
    expect(page).toContain("Email Address");
    expect(page).not.toContain("ROVEXO VERIFIED");
    expect(page).not.toContain('title="Currency"');
    expect(page).not.toContain("CanonicalCard");
    expect(page).not.toContain("SAVE CHANGES");
    expect(page).not.toContain('title="Language"');
  });
});
