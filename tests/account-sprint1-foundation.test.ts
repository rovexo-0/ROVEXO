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

describe("My Account critical UI restore (Master Menu v2.0)", () => {
  it("restores Compact Premium hub without dead-space cards", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const page = readSource("features/account-center/components/AccountCenterPage.tsx");
    const profile = readSource("features/account-center/components/AccountCanonicalProfile.tsx");

    expect(home).toContain('data-ac-hub-version="profile-v1"');
    expect(home).toContain("AccountCanonicalProfile");
    expect(home).toContain("AccountMenuSections");
    expect(home).not.toContain("AccountStatsStrip");
    expect(home).not.toContain("AccountSellerPerformanceCard");
    expect(home).toMatch(/AccountCanonicalProfile[\s\S]*AccountMenuSections/);
    expect(page).toContain('title="PROFILE"');
    expect(page).toContain("showHeaderTitle");
    expect(page).not.toContain("hideBack");
    expect(page).not.toContain("identity=");

    expect(profile).toContain("View Profile");
    expect(profile).not.toContain("Edit Profile");
    expect(home).not.toContain("Edit Profile");
  });

  it("locks Profile main menu inventory", () => {
    const titles = buildAccountMenuSections(baseProfile, { activeListingCount: 1 }).flatMap((s) =>
      s.items.map((i) => i.title),
    );
    expect(titles).toEqual([...ACCOUNT_MENU_TITLES]);
  });
});
