import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ACCOUNT_MENU_TITLES } from "@/lib/account/freeze";
import { buildAccountMenuSections } from "@/lib/account-center/canonical-menu";
import { ROVEXO_ACCOUNT_KIND, resolveAccountCapabilities } from "@/lib/profile/unified-account";
import type { UserProfile } from "@/lib/profile/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const baseProfile: UserProfile = {
  id: "user-1",
  fullName: "Mihai Palade",
  username: "mihai",
  email: "mihai@example.com",
  verified: true,
  memberSince: "2026-01-01",
  role: "buyer",
  accountKind: ROVEXO_ACCOUNT_KIND,
  accountType: ROVEXO_ACCOUNT_KIND,
  capabilities: resolveAccountCapabilities({
    role: "buyer",
    verified: true,
    hasSellerProfile: false,
    hasBusinessAccount: false,
  }),
  isSeller: false,
  isAdmin: false,
  isSuperAdmin: false,
  unreadMessages: 0,
  unreadNotifications: 0,
};

describe("My Account canonical final — Master Menu v2.0", () => {
  it("locks hub version and Compact Premium components", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const page = readSource("features/account-center/components/AccountCenterPage.tsx");
    const css = readSource("styles/rovexo/account-canonical-v2.css");

    expect(home).toContain('data-ac-hub-version="profile-v1"');
    expect(home).toContain("AccountCanonicalProfile");
    expect(home).toContain("AccountMenuSections");
    expect(home).not.toContain("AccountStatsStrip");
    expect(home).not.toContain("AccountSellerPerformanceCard");
    expect(home).toMatch(/AccountCanonicalProfile[\s\S]*AccountMenuSections/);
    expect(page).toContain("AccountCanonicalShell");
    expect(page).toContain('title="PROFILE"');
    expect(page).toContain("showHeaderTitle");
    expect(page).not.toContain("hideBack");
    expect(page).not.toContain("identity=");
    expect(css).not.toContain(".ac-canonical__followers-row");
    expect(css).toContain(".ac-canonical__avatar-wrap");
    expect(css).toContain(".ac-canonical__view-profile");
    expect(css).toContain(".ac-canonical__rating-star");
    expect(css).not.toContain(".ac-v1__profile-card");
  });

  it("builds Master Menu per PO Final Authorization", () => {
    const sections = buildAccountMenuSections(baseProfile, { activeListingCount: 1 });
    const titles = sections.flatMap((section) => section.items.map((item) => item.title));

    expect(titles).toEqual([...ACCOUNT_MENU_TITLES]);
    expect(titles).not.toContain("Become Seller");
    expect(titles).not.toContain("View Public Profile");
    expect(titles).not.toContain("Edit Profile");
  });

  it("uses Owner Profile Icon System v1.0 emoji in menu rows", () => {
    const menu = readSource("features/account-center/components/AccountMenuSections.tsx");
    const icons = readSource("features/account-center/components/ProfileMenuIcons.tsx");
    const colors = readSource("lib/account-center/profile-icon-system-v1.ts");

    expect(menu).toContain("PROFILE_MENU_ICONS");
    expect(menu).toContain("ProfileMenuIcon");
    expect(menu).toContain('data-profile-icons="v1.0"');
    expect(menu).toContain("CanonicalMenuRow");
    expect(menu).not.toContain("♡");
    expect(menu).not.toContain("💳");
    expect(menu).not.toContain("📦");
    expect(menu).not.toContain("🌴");
    expect(menu).not.toContain("CanonicalCard");
    expect(menu).not.toContain("AccountIcon");
    expect(menu).not.toContain("View Public Profile");
    expect(menu).not.toContain("Edit Profile");

    expect(icons).toContain("PROFILE_ICON_EMOJI");
    expect(icons).toContain("PlatformEmoji");
    expect(icons).not.toContain("<svg");
    expect(colors).toContain("#FF5FA2");
    expect(colors).toContain("#06B6D4");
    expect(colors).toContain("#F59E0B");
    expect(colors).toContain("#22C55E");
    expect(colors).toContain("#EC4899");
    expect(colors).toContain("#9333EA");
    expect(colors).toContain("#FFD54A");
    expect(colors).toContain("#EF4444");
    expect(colors).toContain("#60A5FA");
    expect(colors).toContain("#9333EA");
    expect(colors).toContain("#DC2626");
  });

  it("refreshes canonical Business seller context when Account becomes active", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const card = readSource("features/business/onboarding/BusinessUpgradeCard.tsx");
    expect(home).toContain("<BusinessUpgradeCard initialStatus={businessStatus} />");
    expect(card).toContain('if (pathname !== "/account") return');
    expect(card).toContain('fetch("/api/business/status"');
    expect(card).toContain('addEventListener("pageshow"');
    expect(card).toContain('addEventListener("visibilitychange"');
    expect(card).toContain("applyConfirmedSellerContextHint");
    expect(card).not.toContain("setInterval");
  });
});
