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

    expect(home).toContain('data-ac-hub-version="v2.0-master"');
    expect(home).toContain("AccountCanonicalProfile");
    expect(home).toContain("AccountMenuSections");
    expect(home).not.toContain("AccountStatsStrip");
    expect(home).not.toContain("AccountSellerPerformanceCard");
    expect(home).toMatch(/AccountCanonicalProfile[\s\S]*AccountMenuSections/);
    expect(page).toContain("AccountCanonicalShell");
    expect(page).toContain("hideBack");
    expect(page).not.toContain("identity=");
    expect(css).toContain(".ac-canonical__followers-row");
    expect(css).toContain(".ac-canonical__avatar-wrap");
    expect(css).toContain(".ac-canonical__name-row");
    expect(css).not.toContain(".ac-v1__profile-card");
  });

  it("builds Master Menu per PO Final Authorization", () => {
    const sections = buildAccountMenuSections(baseProfile);
    const titles = sections.flatMap((section) => section.items.map((item) => item.title));

    expect(titles).toEqual([...ACCOUNT_MENU_TITLES]);
    expect(titles).not.toContain("Become Seller");
    expect(titles).not.toContain("View Public Profile");
    expect(titles).not.toContain("Edit Profile");
  });

  it("uses shared AccountIcon in menu rows", () => {
    const menu = readSource("features/account-center/components/AccountMenuSections.tsx");
    expect(menu).toContain("AccountIcon");
    expect(menu).toContain("CanonicalMenuRow");
    expect(menu).not.toContain("View Public Profile");
    expect(menu).not.toContain("Edit Profile");
  });
});
