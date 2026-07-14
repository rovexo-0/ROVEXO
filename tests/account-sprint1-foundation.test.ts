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

/**
 * Critical restore lock: Module 02 approved My Account hub (pre–Sprint 1 cleanup),
 * with View Public Profile / Edit Profile permanently absent.
 */
describe("My Account critical UI restore (Module 02)", () => {
  it("restores approved hub composition without profile CTAs", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const page = readSource("features/account-center/components/AccountCenterPage.tsx");
    const profile = readSource("features/account-center/components/AccountCanonicalProfile.tsx");
    const card = readSource("features/account-center/components/AccountSellerPerformanceCard.tsx");

    expect(home).toContain('data-ac-hub-version="v1.0-production"');
    expect(home).toContain("AccountCanonicalProfile");
    expect(home).toContain("AccountStatsStrip");
    expect(home).toContain("AccountSellerPerformanceCard");
    expect(home).toContain("AccountMenuSections");
    expect(home).toMatch(
      /AccountCanonicalProfile[\s\S]*AccountStatsStrip[\s\S]*AccountSellerPerformanceCard[\s\S]*AccountMenuSections/,
    );
    expect(page).toContain("hideBack");
    expect(page).not.toContain("identity=");

    expect(profile).not.toContain("View Public Profile");
    expect(profile).not.toContain("Edit Profile");
    expect(home).not.toContain("View Public Profile");
    expect(home).not.toContain("Edit Profile");

    expect(card).toContain('data-ac-seller-performance="v1.0-frozen"');
    expect(card).toContain("AccountSellerScoreRing");
    expect(card).toContain("AccountSellerLevelBadge");
    expect(card).toContain("View details");
    expect(card).not.toContain("Response Rate");
    expect(card).not.toContain("ac-v1__seller-card");
  });

  it("locks Module 02 manage/account/support menu", () => {
    const titles = buildAccountMenuSections(baseProfile).flatMap((s) => s.items.map((i) => i.title));
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
  });
});
