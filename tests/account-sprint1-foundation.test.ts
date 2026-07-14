import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
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

describe("My Account Sprint 1 foundation", () => {
  it("marks sprint 1 foundation on the hub", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const page = readSource("features/account-center/components/AccountCenterPage.tsx");
    const header = readSource("features/account-canonical/header/AccountCanonicalHeader.tsx");

    expect(home).toContain('data-account-version="v1.0"');
    expect(home).toContain('data-account-sprint="1-foundation"');
    expect(home).toContain("AccountCanonicalProfile");
    expect(home).toContain("AccountSellerPerformanceCard");
    expect(home).toContain("AccountMenuSections");
    expect(home).not.toContain("AccountStatsStrip");
    expect(page).toContain("identity=");
    expect(page).not.toContain("hideBack");
    expect(header).toContain("data-account-header");
    expect(header).toContain("identity");
  });

  it("builds the sprint 1 classic menu", () => {
    const titles = buildAccountMenuSections(baseProfile).flatMap((s) => s.items.map((i) => i.title));
    expect(titles).toEqual([
      "My Listings",
      "Orders",
      "Inbox",
      "Wallet",
      "Reviews",
      "Saved",
      "Following",
      "Settings",
    ]);

    const withBusiness: UserProfile = {
      ...baseProfile,
      capabilities: resolveAccountCapabilities({
        role: "buyer",
        verified: true,
        hasSellerProfile: true,
        hasBusinessAccount: true,
      }),
    };
    const businessTitles = buildAccountMenuSections(withBusiness).flatMap((s) =>
      s.items.map((i) => i.title),
    );
    expect(businessTitles).toContain("Business tools");
    expect(businessTitles).not.toContain("Become Seller");
  });

  it("confirms logout before signing out", () => {
    const menu = readSource("features/account-center/components/AccountMenuSections.tsx");
    expect(menu).toContain("CanonicalConfirmDialog");
    expect(menu).toContain("Log out?");
    expect(menu).toContain("signOut");
  });

  it("keeps compact seller performance → /seller/performance", () => {
    const card = readSource("features/account-center/components/AccountSellerPerformanceCard.tsx");
    expect(card).toContain('router.push("/seller/performance")');
    expect(card).toContain("Response Rate");
    expect(card).toContain("Completed Sales");
    expect(card).toContain("View Details");
  });

  it("documents the master UI spec", () => {
    expect(existsSync(join(process.cwd(), "docs/modules/account/MASTER_UI_SPECIFICATION.md"))).toBe(
      true,
    );
    const spec = readSource("docs/modules/account/MASTER_UI_SPECIFICATION.md");
    expect(spec).toContain("Sprint 1");
    expect(spec).toContain("64px");
  });
});
