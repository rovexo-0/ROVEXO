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

    expect(home).toContain('data-account-version="v1.0"');
    expect(home).toContain('data-account-sprint="1-foundation"');
    expect(home).toContain("AccountCanonicalProfile");
    expect(home).toContain("AccountStatsStrip");
    expect(home).toContain("AccountSellerPerformanceCard");
    expect(home).toContain("AccountMenuSections");
    expect(home).toMatch(
      /AccountCanonicalProfile[\s\S]*AccountStatsStrip[\s\S]*AccountSellerPerformanceCard/,
    );
    expect(page).not.toContain("identity=");
    expect(page).toContain('backHref="/"');
  });

  it("builds the exact classic menu", () => {
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
    expect(titles).not.toContain("Business tools");
    expect(titles).not.toContain("Promotion Tools");
    expect(titles).not.toContain("Help Centre");
    expect(titles).not.toContain("Ideas");
    expect(titles).not.toContain("Become Seller");
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
    expect(card).toContain("View Details →");
    expect(card).toContain("Complete your first sale to unlock your performance score.");
  });

  it("applies final visual QA polish tokens", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const css = readSource("styles/rovexo/account-canonical-v2.css");
    expect(home).toContain('data-account-ui="final-visual-qa"');
    expect(css).toContain("--ac-shadow: 0 8px 24px");
    expect(css).toContain("--ac-page-bg: #fafafa");
    expect(css).toContain("font-size: 22px");
    expect(css).toContain("width: 84px");
    expect(css).toContain("min-height: 56px");
    expect(css).not.toContain(".ac-v1__profile-btn");
    expect(css).not.toContain(".ac-v1__profile-actions");
    expect(existsSync(join(process.cwd(), "docs/modules/account/MASTER_UI_SPECIFICATION.md"))).toBe(
      true,
    );
  });
});
