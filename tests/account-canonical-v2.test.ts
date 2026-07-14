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

describe("My Account canonical — Sprint 1 SSOT", () => {
  it("locks hub version and canonical components", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const page = readSource("features/account-center/components/AccountCenterPage.tsx");
    const css = readSource("styles/rovexo/account-canonical-v2.css");

    expect(home).toContain('data-account-version="v1.0"');
    expect(home).toContain("AccountCanonicalProfile");
    expect(home).toContain("AccountSellerPerformanceCard");
    expect(home).toContain("AccountMenuSections");
    expect(home).not.toContain("AccountStatsStrip");
    expect(page).toContain("AccountCanonicalShell");
    expect(page).toContain("identity=");
    expect(css).toContain(".ac-v1");
    expect(css).toContain(".ac-v1__profile-card");
    expect(css).toContain(".ac-v1__seller-card");
    expect(css).toContain(".account-canonical-header__bar--identity");
  });

  it("builds classic menu without separate account types", () => {
    const sections = buildAccountMenuSections(baseProfile);
    const titles = sections.flatMap((section) => section.items.map((item) => item.title));

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
    expect(titles).not.toContain("Become Seller");
    expect(titles).not.toContain("Buyer Account");
  });

  it("uses shared AccountIcon in menu rows (no Lucide fork)", () => {
    const menu = readSource("features/account-center/components/AccountMenuSections.tsx");
    expect(menu).toContain("AccountIcon");
    expect(menu).not.toContain('from "lucide-react"');
  });
});
