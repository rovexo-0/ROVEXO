import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

describe("My Account canonical final — Module 02 restore", () => {
  it("locks hub version and canonical components", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const page = readSource("features/account-center/components/AccountCenterPage.tsx");
    const css = readSource("styles/rovexo/account-canonical-v2.css");

    expect(home).toContain('data-ac-hub-version="v1.0-production"');
    expect(home).toContain("AccountCanonicalProfile");
    expect(home).toContain("AccountStatsStrip");
    expect(home).toContain("AccountSellerPerformanceCard");
    expect(home).toContain("AccountMenuSections");
    expect(home).toMatch(
      /AccountStatsStrip[\s\S]*AccountSellerPerformanceCard[\s\S]*AccountMenuSections/,
    );
    expect(page).toContain("AccountCanonicalShell");
    expect(page).toContain("hideBack");
    expect(page).not.toContain("identity=");
    expect(css).toContain(".ac-canonical__followers-row");
    expect(css).toContain(".ac-canonical__stat--divider");
    expect(css).toContain(".ac-canonical__avatar-wrap");
    expect(css).toContain(".ac-canonical__name-row");
    expect(css).toContain(".ac-canonical__seller-performance");
    expect(css).toContain(".ac-canonical__seller-score-ring");
    expect(css).not.toContain(".ac-v1__profile-card");
  });

  it("builds sectioned menu per Module 02 spec", () => {
    const sections = buildAccountMenuSections(baseProfile);
    const titles = sections.flatMap((section) => section.items.map((item) => item.title));

    expect(sections.map((section) => section.title)).toEqual(["MANAGE", "ACCOUNT", "SUPPORT"]);
    expect(titles).toEqual([
      "My Listings",
      "Orders",
      "Saved Items",
      "My Reviews",
      "Wallet",
      "Settings",
      "Promotion Tools",
      "Help Centre",
      "Ideas",
    ]);
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
