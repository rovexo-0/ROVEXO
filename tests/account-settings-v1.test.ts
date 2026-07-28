import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ACCOUNT_SETTINGS_LAYOUT,
  ACCOUNT_SETTINGS_SAVE_ANIM_MS,
  ACCOUNT_SETTINGS_SPACING,
  ACCOUNT_SETTINGS_STATUS,
  ACCOUNT_SETTINGS_VERSION,
  PERSONAL_INFORMATION_V1_REMOVED,
  PERSONAL_INFORMATION_V1_ROWS,
  getAccountSettingsEngineSnapshot,
  isAccountSettingsSaveVisible,
  resolveConnectedAccountsView,
  resolveRovexoVerificationDisplay,
} from "@/lib/account/account-settings-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Personal Information v1.0 (PERMANENT LOCK)", () => {
  it("locks inventory and Save Engine v2.0 with no reserved space", () => {
    expect(ACCOUNT_SETTINGS_STATUS).toContain("PERMANENT LOCK");
    expect(ACCOUNT_SETTINGS_VERSION).toBe("1.0");
    expect(ACCOUNT_SETTINGS_LAYOUT).toEqual([
      "Profile Photo",
      "Full Name",
      "Username",
      "Email Address",
      "Phone Number",
      "Date of Birth",
      "Gender (Optional)",
      "Country",
    ]);
    expect(PERSONAL_INFORMATION_V1_ROWS).toHaveLength(8);
    expect(ACCOUNT_SETTINGS_SPACING.saveGapAbovePx).toBe(0);
    expect(ACCOUNT_SETTINGS_SPACING.saveGapBelowPx).toBe(0);
    expect(ACCOUNT_SETTINGS_SAVE_ANIM_MS).toBe(200);
    expect(getAccountSettingsEngineSnapshot().noReservedSaveSpace).toBe(true);
    expect(getAccountSettingsEngineSnapshot().connectedAccountsOnPersonalInfo).toBe(false);
    expect(getAccountSettingsEngineSnapshot().currencyOnPersonalInfo).toBe(false);
    expect(isAccountSettingsSaveVisible({ dirty: false, saving: false, successVisible: false })).toBe(
      false,
    );
  });

  it("permanently removes non-personal fields from this page", () => {
    expect(PERSONAL_INFORMATION_V1_REMOVED).toContain("Currency");
    expect(PERSONAL_INFORMATION_V1_REMOVED).toContain("Connected Accounts");
    expect(PERSONAL_INFORMATION_V1_REMOVED).toContain("2 Factor Authentication");
    expect(PERSONAL_INFORMATION_V1_REMOVED).toContain("ROVEXO Verified");
    expect(ACCOUNT_SETTINGS_LAYOUT).not.toContain("Currency");
    expect(ACCOUNT_SETTINGS_LAYOUT).not.toContain("Language");
  });

  it("keeps Connected Accounts helpers for Security/Connected Accounts surfaces", () => {
    const empty = resolveConnectedAccountsView([
      { id: "google", label: "Google", connected: false },
      { id: "apple", label: "Apple", connected: false },
      { id: "facebook", label: "Facebook", connected: false },
    ]);
    expect(empty.empty).toBe(true);
    expect(resolveRovexoVerificationDisplay({ verified: false, pendingReview: true }).status).toBe(
      "Pending Verification",
    );
  });

  it("ships Personal Information UI without removed modules", () => {
    const page = readSource("features/account/components/ProfileEditPage.tsx");
    expect(page).toContain('title="Personal Information"');
    expect(page).toContain("data-personal-information=\"v1.0\"");
    expect(page).toContain("Email Address");
    expect(page).toContain("Gender (Optional)");
    expect(page).toContain("as-v1-status");
    expect(page).toContain("SAVE_ENGINE_DEBOUNCE_MS");
    expect(page).not.toContain("as-v1-save__btn");
    expect(page).not.toContain("SAVE CHANGES");
    expect(page).not.toContain("Connected Accounts");
    expect(page).not.toContain("2 Factor Authentication");
    expect(page).not.toContain("ROVEXO VERIFIED");
    expect(page).not.toContain("Account Type");
    expect(page).not.toContain('title="Currency"');
    expect(page).not.toContain("resolveConnectedAccountsView");
    const css = readSource("styles/rovexo/account-settings-v1.css");
    expect(css).toContain("padding-bottom: 0");
    expect(css).toContain('data-account-settings="v1.5"');
  });
});
