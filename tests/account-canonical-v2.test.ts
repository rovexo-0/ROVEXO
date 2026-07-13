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

describe("My Account canonical final — Module 02", () => {
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
    expect(css).toContain(".ac-canonical__followers-row");
    expect(css).toContain(".ac-canonical__stat--divider");
    expect(css).toContain(".ac-canonical__avatar-wrap");
    expect(css).toContain(".ac-canonical__name-row");
    expect(css).toContain(".ac-canonical__seller-performance");
    expect(css).toContain(".ac-canonical__seller-score-ring");
  });

  it("builds sectioned menu per canonical final spec", () => {
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
  });

  it("uses shared AccountIcon in menu rows (no Lucide fork)", () => {
    const menu = readSource("features/account-center/components/AccountMenuSections.tsx");
    expect(menu).toContain("AccountIcon");
    expect(menu).not.toContain("AccountMenuLucideIcon");
  });

  it("lifts bottom nav icons and labels per canonical spacing", () => {
    const css = readSource("styles/rovexo/bottom-nav-premium.css");
    expect(css).toContain("translateY(-3px)");
    expect(css).toContain("--rx-bottom-nav-sell-float: 7px");
    expect(css).toContain("linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%)");
  });

  it("locks Ideas hub shell", () => {
    const ideas = readSource("features/account-module/components/RovexoIdeasPage.tsx");
    expect(ideas).toContain('data-rovexo-ideas-version="v2.0-lock"');
    expect(ideas).toContain("Newest");
    expect(ideas).toContain("Popular");
    expect(ideas).toContain("Following");
    expect(ideas).toContain("New Idea");
    expect(ideas).toContain('inputType="search"');
  });

  it("exposes only Active and Sold listing tabs", () => {
    const listings = readSource("features/account-module/components/SellerListingsV1.tsx");
    const route = readSource("app/seller/listings/page.tsx");

    expect(listings).toContain('label: "Active"');
    expect(listings).toContain('label: "Sold"');
    expect(listings).toContain("acm-listing-menu");
    expect(listings).not.toContain('label: "Pending"');
    expect(listings).not.toContain('label: "Draft"');
    expect(listings).not.toContain('label: "Paused"');
    expect(listings).not.toContain('label: "Expired"');
    expect(listings).not.toContain('label: "All"');
    expect(route).toContain('"published"');
    expect(route).toContain('"sold"');
    expect(route).not.toContain('"pending"');
    expect(route).not.toContain('"draft"');
  });

  it("locks phase 2 orders saved reviews canonical markers", () => {
    const hub = readSource("features/orders/components/OrdersPage.tsx");
    const saved = readSource("features/account-module/components/SavedItemsV1.tsx");
    const reviews = readSource("features/account-module/components/ReviewsV1.tsx");
    const menu = readSource("lib/account-center/canonical-menu.ts");

    expect(hub).toContain('label: "Bought"');
    expect(hub).toContain('label: "Sold"');
    expect(hub).toContain("orders-page");
    expect(hub).toContain("No orders yet.");
    expect(hub).toContain("showHeaderTitle");
    expect(saved).toContain("ListingCard");
    expect(saved).toContain("LISTING_CARD_HOMEPAGE_PROPS");
    expect(saved).toContain("formatPlatformFeeLine");
    expect(reviews).toContain("CanonicalSection");
    expect(menu).toContain('href: "/account/reviews"');
  });
});
