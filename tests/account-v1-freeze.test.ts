import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  ACCOUNT_CANONICAL_COMPONENTS,
  ACCOUNT_CANONICAL_FROZEN,
  ACCOUNT_CANONICAL_STATUS,
  ACCOUNT_FREEZE_DOM,
  ACCOUNT_MENU_TITLES,
  ACCOUNT_ROUTES,
  ACCOUNT_SPEC_VERSION,
  ACCOUNT_UI_FREEZE,
} from "@/lib/account/freeze";
import { buildAccountMenuSections } from "@/lib/account-center/canonical-menu";
import { ROVEXO_ACCOUNT_KIND, resolveAccountCapabilities } from "@/lib/profile/unified-account";
import type { UserProfile } from "@/lib/profile/types";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
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

describe("My Account v1.0 — CANONICAL FREEZE", () => {
  it("locks freeze constants", () => {
    expect(ACCOUNT_UI_FREEZE).toBe("CANONICAL_FROZEN_v1.0");
    expect(ACCOUNT_CANONICAL_STATUS).toBe("CANONICAL_FROZEN_v1.0");
    expect(ACCOUNT_CANONICAL_FROZEN).toBe(true);
    expect(ACCOUNT_SPEC_VERSION).toBe("1.0");
    expect(ACCOUNT_ROUTES.hub).toBe("/account");
    expect(ACCOUNT_FREEZE_DOM.freeze).toBe("FROZEN");
    expect(ACCOUNT_CANONICAL_COMPONENTS).toEqual([
      "AccountCanonicalShell",
      "AccountCenterHome",
      "AccountCanonicalProfile",
      "AccountStatsStrip",
      "AccountSellerPerformanceCard",
      "AccountMenuSections",
    ]);
  });

  it("marks data-account-freeze on the hub root", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const page = readSource("features/account-center/components/AccountCenterPage.tsx");

    expect(home).toContain('data-account-freeze="FROZEN"');
    expect(home).toContain('data-ac-hub-version="v1.0-production"');
    expect(home).toContain('data-account-version="v1.0"');
    expect(page).toContain("AccountCanonicalShell");
    expect(page).toContain("hideBack");
  });

  it("locks approved component structure and section order", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const profile = readSource("features/account-center/components/AccountCanonicalProfile.tsx");
    const stats = readSource("features/account-center/components/AccountStatsStrip.tsx");
    const seller = readSource("features/account-center/components/AccountSellerPerformanceCard.tsx");
    const menu = readSource("features/account-center/components/AccountMenuSections.tsx");

    expect(home).toContain("AccountCanonicalProfile");
    expect(home).toContain("AccountStatsStrip");
    expect(home).toContain("AccountSellerPerformanceCard");
    expect(home).toContain("AccountMenuSections");
    expect(home).toMatch(
      /AccountCanonicalProfile[\s\S]*AccountStatsStrip[\s\S]*AccountSellerPerformanceCard[\s\S]*AccountMenuSections/,
    );

    expect(profile).toContain("ac-canonical__profile");
    expect(profile).not.toContain("View Public Profile");
    expect(profile).not.toContain("Edit Profile");

    expect(stats).toContain("Listings");
    expect(stats).toContain("Saved");
    expect(stats).toContain("Orders");
    expect(stats).toContain("Wallet");

    expect(seller).toContain('data-ac-seller-performance="v1.0-frozen"');
    expect(seller).toContain("AccountSellerLevelBadge");
    expect(seller).toContain("AccountSellerScoreRing");
    expect(seller).toContain("View details");

    expect(menu).toContain("buildAccountMenuSections");
    expect(menu).toContain("ACCOUNT_LOGOUT_MENU_ITEM");
    expect(menu).toContain("signOut");
    expect(menu).toContain('title="System"');
  });

  it("locks frozen menu inventory with no missing sections", () => {
    const sections = buildAccountMenuSections(baseProfile);
    const titles = sections.flatMap((section) => section.items.map((item) => item.title));

    expect(sections.map((section) => section.title)).toEqual(["MANAGE", "ACCOUNT", "SUPPORT"]);
    expect(titles).toEqual([...ACCOUNT_MENU_TITLES]);
    expect(titles).not.toContain("View Public Profile");
    expect(titles).not.toContain("Edit Profile");
    expect(titles).not.toContain("Become Seller");
  });

  it("documents freeze SSOT artifacts", () => {
    const freezeTs = readSource("lib/account/freeze.ts");
    const spec = readSource("docs/modules/account/MASTER_UI_SPECIFICATION.md");
    const freezeDoc = readSource("docs/modules/account/UI_FREEZE.md");
    const rule = readSource(".cursor/rules/account-v1-freeze.mdc");

    expect(freezeTs).toContain('ACCOUNT_UI_FREEZE = "CANONICAL_FROZEN_v1.0"');
    expect(spec).toContain("CANONICAL_FROZEN_v1.0");
    expect(spec).toContain("STATUS:");
    expect(freezeDoc).toContain("FROZEN");
    expect(freezeDoc).toContain("2026-07-14");
    expect(rule).toContain("CANONICAL | FROZEN");
    expect(rule).toContain("My Account v1.1");
    expect(existsSync(path.join(process.cwd(), "tests/account-v1-freeze.test.ts"))).toBe(true);
  });
});
