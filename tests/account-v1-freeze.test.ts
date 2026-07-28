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

describe("My Account v1.0 — PROFILE MAIN (Owner Implementation)", () => {
  it("locks freeze constants", () => {
    expect(ACCOUNT_UI_FREEZE).toBe("CANONICAL_FROZEN_v1.0");
    expect(ACCOUNT_CANONICAL_STATUS).toBe("CANONICAL_FROZEN_v1.0");
    expect(ACCOUNT_CANONICAL_FROZEN).toBe(true);
    expect(ACCOUNT_SPEC_VERSION).toBe("1.0");
    expect(ACCOUNT_ROUTES.hub).toBe("/account");
    expect(ACCOUNT_ROUTES.buying).toBe("/account/buying");
    expect(ACCOUNT_FREEZE_DOM.hubVersion).toBe("profile-v1");
    expect(ACCOUNT_CANONICAL_COMPONENTS).toEqual([
      "AccountCanonicalShell",
      "AccountCenterHome",
      "AccountCanonicalProfile",
      "AccountMenuSections",
    ]);
  });

  it("marks Profile main hub without dead-space stats", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const page = readSource("features/account-center/components/AccountCenterPage.tsx");

    expect(home).toContain('data-ac-hub-version="profile-v1"');
    expect(home).toContain('data-account-menu="profile-v1"');
    expect(home).toContain('data-account-version="v1.0"');
    expect(home).not.toContain("AccountStatsStrip");
    expect(home).not.toContain("AccountSellerPerformanceCard");
    expect(page).toContain("AccountCanonicalShell");
    expect(page).toContain('title="PROFILE"');
    expect(page).toContain("showHeaderTitle");
    expect(page).toContain('backHref="/"');
    expect(page).not.toContain("hideBack");
  });

  it("locks Compact Premium structure: profile + menu + Sign Out confirm", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const profile = readSource("features/account-center/components/AccountCanonicalProfile.tsx");
    const menu = readSource("features/account-center/components/AccountMenuSections.tsx");

    expect(home).toContain("AccountCanonicalProfile");
    expect(home).toContain("AccountMenuSections");
    expect(home).toMatch(/AccountCanonicalProfile[\s\S]*AccountMenuSections/);

    expect(profile).toContain("ac-canonical__profile");
    expect(profile).toContain("View Profile");
    expect(profile).toContain("ac-canonical__rating-star");
    expect(profile).not.toContain("/account/followers");
    expect(profile).toContain("isNewMemberProfile");
    expect(profile).not.toContain("Edit Profile");

    expect(menu).toContain("buildAccountMenuSections");
    expect(menu).toContain("ACCOUNT_LOGOUT_MENU_ITEM");
    expect(menu).toContain("signOut");
    expect(menu).toContain("CanonicalConfirmDialog");
    expect(menu).toContain('data-master-menu="profile-v1"');
    expect(menu).toContain("PROFILE_MENU_ICONS");
    expect(menu).toContain("hideChevron");
  });

  it("locks Profile menu inventory (Owner Implementation)", () => {
    const sections = buildAccountMenuSections(baseProfile, { activeListingCount: 1 });
    const titles = sections.flatMap((section) => section.items.map((item) => item.title));

    expect(titles).toEqual([...ACCOUNT_MENU_TITLES]);
    expect(titles).not.toContain("Become Seller");
    expect(titles).not.toContain("Business");
    expect(titles).not.toContain("Wallet");
    expect(titles.filter((title) => title === "Balance")).toHaveLength(1);
    expect(titles.filter((title) => title === "My Orders")).toHaveLength(1);
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
    expect(rule).toContain("PROFILE MAIN ONLY");
    expect(rule).toContain("ZERO DAMAGE");
    expect(existsSync(path.join(process.cwd(), "tests/account-v1-freeze.test.ts"))).toBe(true);
  });
});
