import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PROFILE_MASTER_AVATAR,
  PROFILE_MASTER_CHEVRON,
  PROFILE_MASTER_FULL_WIDTH,
  PROFILE_MASTER_ICON,
  PROFILE_MASTER_ROW,
  PROFILE_MASTER_TITLE,
  profileMasterTokensSnapshot,
} from "@/lib/design-system/profile-master-tokens";
import {
  ACCOUNT_SETTINGS_PHOTO_SIZE_PX,
  ACCOUNT_SETTINGS_SPACING,
  ACCOUNT_SETTINGS_TYPE,
  PERSONAL_INFORMATION_V1_MASTER,
} from "@/lib/account/account-settings-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Profile Master Tokens → Personal Information 100% inherit", () => {
  it("extracts Profile menu / avatar / full-width tokens (no guessing)", () => {
    expect(PROFILE_MASTER_ROW.minHeightPx).toBe(56);
    expect(PROFILE_MASTER_TITLE.fontSizePx).toBe(16);
    expect(PROFILE_MASTER_TITLE.fontWeight).toBe(400);
    expect(PROFILE_MASTER_ICON.sizePx).toBe(24);
    expect(PROFILE_MASTER_CHEVRON.sizePx).toBe(16);
    expect(PROFILE_MASTER_AVATAR.sizePx).toBe(64);
    expect(PROFILE_MASTER_FULL_WIDTH.paddingPx).toBe(16);
    expect(profileMasterTokensSnapshot().source[0]).toContain("account-canonical-v2.css");
  });

  it("locks Personal Information spacing/type to Profile tokens only", () => {
    expect(ACCOUNT_SETTINGS_SPACING.rowMinHeightPx).toBe(PROFILE_MASTER_ROW.minHeightPx);
    expect(ACCOUNT_SETTINGS_SPACING.padLeftPx).toBe(PROFILE_MASTER_FULL_WIDTH.paddingPx);
    expect(ACCOUNT_SETTINGS_TYPE.fieldTitlePx).toBe(PROFILE_MASTER_TITLE.fontSizePx);
    expect(ACCOUNT_SETTINGS_TYPE.fieldTitleWeight).toBe(PROFILE_MASTER_TITLE.fontWeight);
    expect(ACCOUNT_SETTINGS_PHOTO_SIZE_PX).toBe(PROFILE_MASTER_AVATAR.sizePx);
    expect(PERSONAL_INFORMATION_V1_MASTER.mustBeProfileNotSimilar).toBe(true);
    expect(PERSONAL_INFORMATION_V1_MASTER.inheritsProfileMasterTokens).toBe(true);
  });

  it("rejects PI CSS inventing non-Profile sizes (72 / 18 / 80 / 20 pad)", () => {
    const css = readSource("styles/rovexo/account-settings-v1.css");
    expect(css).not.toMatch(/--as-row-min:\s*72px/);
    expect(css).not.toMatch(/--as-title:\s*18px/);
    expect(css).not.toMatch(/width:\s*80px/);
    expect(css).not.toMatch(/height:\s*80px/);
    expect(css).not.toMatch(/padding-left:\s*20px/);
    expect(css).toContain("var(--fw-row-min-height)");
    expect(css).toContain("var(--fw-body-size)");
    expect(css).toContain("--as-avatar: 64px");
    expect(css).toContain("var(--fw-pad-x)");
  });

  it("wires PI page to Profile menu + master token markers", () => {
    const page = readSource("features/account/components/ProfileEditPage.tsx");
    expect(page).toContain("ac-canonical__menu");
    expect(page).toContain('data-profile-master-tokens="v1.0"');
    expect(page).toContain('data-personal-information="v1.0"');
  });
});
