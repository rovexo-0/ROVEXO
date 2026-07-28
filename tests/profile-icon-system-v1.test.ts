import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PROFILE_ICON_COLORS,
  PROFILE_ICON_SIZE_PX,
  PROFILE_ICON_SYSTEM_STATUS,
  profileIconSystemSnapshot,
} from "@/lib/account-center/profile-icon-system-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Profile Icon System v1.0", () => {
  it("locks Owner colours and 24px size", () => {
    const snap = profileIconSystemSnapshot();
    expect(snap.status).toBe(PROFILE_ICON_SYSTEM_STATUS);
    expect(PROFILE_ICON_SIZE_PX).toBe(24);
    expect(PROFILE_ICON_COLORS.favourites).toBe("#FF5FA2");
    expect(PROFILE_ICON_COLORS.settings).toBe("#9333EA");
    expect(PROFILE_ICON_COLORS.ideas).toBe("#FFD54A");
    expect(PROFILE_ICON_COLORS.legal).toBe("#60A5FA");
    expect(PROFILE_ICON_COLORS.help).toBe("#EF4444");
    expect(PROFILE_ICON_COLORS.promote).toBe("#EC4899");
    expect(PROFILE_ICON_COLORS["holiday-mode"]).toBe("#22C55E");
    expect(PROFILE_ICON_COLORS.balance).toBe("#06B6D4");
    expect(PROFILE_ICON_COLORS["my-orders"]).toBe("#F59E0B");
    expect(PROFILE_ICON_COLORS.logout).toBe("#DC2626");
    expect(PROFILE_ICON_COLORS).not.toHaveProperty("followers");
  });

  it("wires ProfileMenuIcon into menu · holiday · no emojis", () => {
    const menu = readSource("features/account-center/components/AccountMenuSections.tsx");
    const icons = readSource("features/account-center/components/ProfileMenuIcons.tsx");
    const holiday = readSource("features/account-center/components/HolidayModeProfileRow.tsx");
    const css = readSource("styles/rovexo/account-canonical-v2.css");

    expect(menu).toContain("ProfileMenuIcon");
    expect(menu).toContain('data-profile-icons="v1.0"');
    expect(menu).not.toContain("♡");
    expect(menu).not.toContain("🌴");
    expect(menu).not.toContain("💳");
    expect(icons).toContain("function Heart");
    expect(icons).toContain("function PalmTree");
    expect(icons).toContain("function Logout");
    expect(icons).toContain("PROFILE_ICON_SIZE_PX");
    expect(holiday).toContain('ProfileMenuIcon id="holiday-mode"');
    expect(holiday).not.toContain("🌴");
    expect(css).toContain("color: #9333ea");
    expect(css).toContain("width: 24px");
  });
});
