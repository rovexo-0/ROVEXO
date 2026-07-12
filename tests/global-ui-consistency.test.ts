import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CANONICAL_DESIGN_TOKENS,
  DEPRECATED_UI_PATTERNS,
  GLOBAL_UI_MODULE_REGISTRY,
} from "@/lib/ui-consistency/canonical-registry";
import { buildAccountMenuSections } from "@/lib/account-center/canonical-menu";
import { ROVEXO_ACCOUNT_KIND, resolveAccountCapabilities } from "@/lib/profile/unified-account";
import type { UserProfile } from "@/lib/profile/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const baseProfile: UserProfile = {
  id: "user-1",
  fullName: "Test User",
  username: "testuser",
  email: "test@example.com",
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

describe("global UI consistency registry", () => {
  it("documents all major platform modules", () => {
    const modules = GLOBAL_UI_MODULE_REGISTRY.map((entry) => entry.module);
    expect(modules).toContain("My Account Hub");
    expect(modules).toContain("Promotion Tools");
    expect(modules).toContain("Help Centre");
    expect(modules).toContain("Super Admin");
    expect(GLOBAL_UI_MODULE_REGISTRY.length).toBeGreaterThanOrEqual(15);
  });

  it("locks canonical design token references", () => {
    expect(CANONICAL_DESIGN_TOKENS.pageHeader).toContain("CanonicalPageHeader");
    expect(CANONICAL_DESIGN_TOKENS.accountHub).toContain("account-canonical-v2.css");
  });

  it("lists deprecated UI patterns for migration tracking", () => {
    expect(DEPRECATED_UI_PATTERNS.some((pattern) => pattern.includes("ac-hub__"))).toBe(true);
  });
});

describe("account shell standardization", () => {
  it("routes account surfaces through AccountCanonicalShell", () => {
    const shell = readSource("features/account-canonical/shell/AccountCanonicalShell.tsx");
    expect(shell).toContain("AccountCanonicalHeader");
    expect(shell).toContain('data-account-canonical="v2.0"');
    expect(shell).not.toContain("showBottomNav={false}");
    expect(shell).not.toContain("text-2xl font-bold");
  });

  it("routes buyer and seller dashboards through AccountCanonicalShell", () => {
    const modulePage = readSource("features/account-center/components/AccountCenterModulePage.tsx");
    expect(modulePage).toContain("AccountCanonicalShell");
    expect(modulePage).not.toContain("AccountCenterHeader");
  });

  it("standardizes address and payment settings on AccountCanonicalShell", () => {
    expect(readSource("features/account/components/AddressBookPage.tsx")).toContain("AccountCanonicalShell");
    expect(readSource("features/account/components/PaymentMethodsPage.tsx")).toContain("AccountCanonicalShell");
  });
});

describe("help centre header consistency", () => {
  it("uses settings shell on help index and subpages", () => {
    const index = readSource("features/help/components/HelpCentrePage.tsx");
    expect(index).toContain("AccountCanonicalShell");
    expect(index).toContain("CanonicalSection");

    for (const file of [
      "features/help/components/HelpFaqPage.tsx",
      "features/help/components/HelpPoliciesPage.tsx",
      "features/help/components/HelpArticlePage.tsx",
      "features/help/components/DecisionTreeWizard.tsx",
    ]) {
      expect(readSource(file)).toContain("AccountCanonicalShell");
    }
  });
});

describe("account hub menu alignment", () => {
  it("matches canonical menu item titles for e2e and audit", () => {
    const sections = buildAccountMenuSections(baseProfile);
    const titles = sections.flatMap((section) => section.items.map((item) => item.title));
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

describe("discovery header standardization", () => {
  const DISCOVERY_ROUTES = [
    "app/categories/page.tsx",
    "app/category/[...slug]/page.tsx",
    "app/brand/[slug]/page.tsx",
    "app/browse/[...segments]/page.tsx",
    "app/collections/[slug]/page.tsx",
    "app/discover/[slug]/page.tsx",
    "app/trends/[slug]/page.tsx",
    "app/l/[location]/page.tsx",
    "app/l/[location]/[...category]/page.tsx",
    "features/store/components/ProStorePage.tsx",
    "features/auctions/components/AuctionsPage.tsx",
    "features/auctions/components/AuctionsComingSoonPage.tsx",
  ];

  it("removes legacy Header from discovery routes", () => {
    for (const file of DISCOVERY_ROUTES) {
      const source = readSource(file);
      expect(source).not.toContain('import Header from "@/components/Header"');
      const usesCanonicalDiscovery =
        source.includes("RovexoHeaderV2") || source.includes("DiscoveryPageShell");
      expect(usesCanonicalDiscovery, `${file} must use canonical discovery chrome`).toBe(true);
    }
  });

  it("uses DiscoveryPageShell on categories index", () => {
    expect(readSource("app/categories/page.tsx")).toContain("DiscoveryPageShell");
  });
});

describe("canonical shell migrations", () => {
  const CANONICAL_SHELL_ROUTES = [
    "app/plans/page.tsx",
    "app/business/directory/page.tsx",
    "app/wholesale/page.tsx",
  ];

  const LEGAL_CANONICAL_ROUTES = [
    "app/legal/page.tsx",
    "app/legal/[slug]/page.tsx",
  ];

  it("wraps secondary hubs in CanonicalPageShell", () => {
    for (const file of CANONICAL_SHELL_ROUTES) {
      expect(readSource(file)).toContain("CanonicalPageShell");
    }
  });

  it("routes legal pages through account canonical shell", () => {
    expect(readSource("features/legal/components/LegalIndexCanonical.tsx")).toContain("AccountCanonicalShell");
    expect(readSource("features/legal/components/LegalDocumentCanonical.tsx")).toContain("AccountCanonicalShell");
    for (const file of LEGAL_CANONICAL_ROUTES) {
      const source = readSource(file);
      expect(
        source.includes("LegalIndexCanonical") || source.includes("LegalDocumentCanonical"),
        `${file} must use legal canonical components`,
      ).toBe(true);
    }
  });

  it("wraps account-linked support in AccountCanonicalShell", () => {
    expect(readSource("app/support/page.tsx")).toContain("AccountCanonicalShell");
    expect(readSource("app/support/page.tsx")).toContain("CanonicalSection");
  });

  it("uses canonical settings surfaces", () => {
    for (const file of [
      "features/seller/compliance/ComplianceDashboard.tsx",
      "features/seller/tax/components/SellerTaxRegistrationPage.tsx",
      "features/resolution/components/ResolutionCentreView.tsx",
      "features/trust/components/TrustCenterPage.tsx",
      "features/business/inventory/components/BusinessInventoryPage.tsx",
      "features/analytics/components/AnalyticsHeader.tsx",
    ]) {
      const source = readSource(file);
      const usesCanonicalHeader =
        source.includes("CanonicalPageHeader") || source.includes("AccountCanonicalShell");
      expect(usesCanonicalHeader, `${file} must use canonical header shell`).toBe(true);
    }

    const notificationSettings = readSource("features/notifications/components/NotificationSettingsPage.tsx");
    expect(notificationSettings).toContain("AccountCanonicalShell");
  });
});

describe("legacy shell discouragement", () => {
  const ACCOUNT_SETTINGS_PAGES = [
    "features/account/components/AccountSecurityPage.tsx",
    "features/account/components/AccountPrivacyPage.tsx",
    "features/account/components/ProfileEditPage.tsx",
  ];

  it("keeps settings routes on AccountCanonicalShell wrapper", () => {
    for (const file of ACCOUNT_SETTINGS_PAGES) {
      expect(readSource(file)).toContain("AccountCanonicalShell");
    }
  });
});
