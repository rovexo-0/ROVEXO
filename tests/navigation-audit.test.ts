import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADMIN_NAV,
  ALL_PUBLIC_ROUTES,
  BUYER_NAV,
  BUSINESS_NAV,
  HELP_NAV,
  SELLER_NAV,
  SHARED_NAV,
} from "@/lib/navigation/map";
import { SUPER_ADMIN_NAV, SUPER_ADMIN_PRIMARY_NAV } from "@/lib/super-admin/nav";
import {
  ACCOUNT_DASHBOARD_TILES,
  BUYER_TOOLS_TILES,
  getSellerDashboardTiles,
  QUICK_ACCESS_TILES,
} from "@/lib/dashboard/sections";
import {
  getBuyHubTiles,
  getBusinessHubTiles,
  getSellHubTiles,
  getSupportHubTiles,
} from "@/lib/mobile-ui/hubs";
import {
  BUYER_PAYMENT_METHODS,
  BUYER_SETTINGS_LINKS,
  buildQuickActions,
} from "@/lib/buyer/constants";
import {
  buildSellerQuickActions,
  SELLER_SETTINGS_LINKS,
  SELLER_SUBSCRIPTION_PLACEHOLDER,
} from "@/lib/seller/constants";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import { IMPORT_WIZARD_PATH, LEGACY_MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";
import { MARKETPLACE_CONNECTORS_PATH } from "@/lib/seller/marketplace/config";
import { HELP_ARTICLES } from "@/lib/help/content/articles";
import {
  collectAppRoutePatterns,
  findUnmatchedHrefs,
  hrefMatchesAppRoute,
  normalizeHref,
} from "@/lib/navigation/route-inventory";
import { ROVEXO_ACCOUNT_KIND, resolveAccountCapabilities } from "@/lib/profile/account";
import type { UserProfile } from "@/lib/profile/types";

const profile = {
  isSeller: true,
  isAdmin: true,
  isSuperAdmin: true,
  accountKind: ROVEXO_ACCOUNT_KIND,
  accountType: ROVEXO_ACCOUNT_KIND,
  capabilities: resolveAccountCapabilities({
    role: "business",
    verified: true,
    hasSellerProfile: true,
    hasBusinessAccount: true,
  }),
} as UserProfile;

function collectNavHrefs(): string[] {
  const navSources = [
    ...BUYER_NAV,
    ...SELLER_NAV,
    ...BUSINESS_NAV,
    ...SHARED_NAV,
    ...HELP_NAV,
    ...ADMIN_NAV,
    ...SUPER_ADMIN_PRIMARY_NAV,
    ...SUPER_ADMIN_NAV.flatMap((section) => section.items),
    ...QUICK_ACCESS_TILES,
    ...BUYER_TOOLS_TILES,
    ...ACCOUNT_DASHBOARD_TILES,
    ...getSellerDashboardTiles(),
    ...getBuyHubTiles(),
    ...getSellHubTiles(profile),
    ...getBusinessHubTiles(profile),
    ...getSupportHubTiles(),
    ...ALL_PUBLIC_ROUTES.map((href) => ({ href })),
    ...BUYER_SETTINGS_LINKS,
    ...SELLER_SETTINGS_LINKS,
    ...BUYER_PAYMENT_METHODS.map(() => ({ href: `/account/payment-methods` })),
    ...buildQuickActions({ orders: 0, saved: 0, messages: 0, notifications: 0 }),
    ...buildSellerQuickActions({ listings: 0, orders: 0, messages: 0 }),
    { href: SELLER_SUBSCRIPTION_PLACEHOLDER.href },
    { href: IMPORT_WIZARD_PATH },
    { href: LEGACY_MIGRATION_CENTER_PATH },
    { href: MARKETPLACE_CONNECTORS_PATH },
    { href: "/auth/signout" },
    { href: "/login" },
    { href: "/register" },
    { href: "/forgot-password" },
    { href: "/reset-password" },
    { href: "/verify-email" },
    { href: "/sell" },
    { href: "/sell/new" },
    { href: "/sell/camera" },
    { href: "/sell/auction" },
    { href: "/import-wizard" },
    { href: "/offline" },
    { href: "/403" },
    { href: "/seller/dashboard" },
    { href: "/dashboard/admin" },
    { href: "/dashboard/super-admin" },
    ...HELP_ARTICLES.map((article) => ({ href: `/help/${article.slug}` })),
  ];

  return [...new Set(navSources.map((entry) => normalizeHref(entry.href)))].sort();
}

function scanStaticHrefsInSource(rootDir: string): string[] {
  const hrefs = new Set<string>();
  const hrefPattern = /href=["'`](\/[^"'`?#]+)["'`]/g;

  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "archive") continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!/\.(tsx|ts|jsx|js)$/.test(entry.name)) continue;

      const source = readFileSync(fullPath, "utf8");
      let match: RegExpExecArray | null;
      while ((match = hrefPattern.exec(source)) !== null) {
        hrefs.add(normalizeHref(match[1]!));
      }
    }
  }

  walk(rootDir);
  return [...hrefs].sort();
}

describe("Navigation audit — route inventory", () => {
  const patterns = collectAppRoutePatterns();

  it("discovers App Router page patterns", () => {
    expect(patterns).toContain("/");
    expect(patterns).toContain("/buyer");
    expect(patterns).toContain("/seller");
    expect(patterns).toContain("/help/:slug");
    expect(patterns.length).toBeGreaterThan(100);
  });

  it("maps help article slugs to /help/:slug", () => {
    for (const article of HELP_ARTICLES) {
      expect(hrefMatchesAppRoute(`/help/${article.slug}`, patterns)).toBe(true);
    }
  });
});

describe("Navigation audit — canonical navigation maps", () => {
  const patterns = collectAppRoutePatterns();
  const navHrefs = collectNavHrefs();
  const unmatched = findUnmatchedHrefs(navHrefs, patterns);

  it(`resolves all canonical nav hrefs (${navHrefs.length} checked)`, () => {
    expect(unmatched).toEqual([]);
  });

  it("routes Bring Your Item entry to import wizard", () => {
    expect(BRING_YOUR_ITEM_PATH).toBe(IMPORT_WIZARD_PATH);
    expect(hrefMatchesAppRoute(BRING_YOUR_ITEM_PATH, patterns)).toBe(true);
    expect(hrefMatchesAppRoute("/bring-your-item", patterns)).toBe(true);
  });

  it("keeps legacy migration path routable", () => {
    expect(hrefMatchesAppRoute(LEGACY_MIGRATION_CENTER_PATH, patterns)).toBe(true);
  });

  it("keeps seller dashboard SSOT at /seller", () => {
    expect(hrefMatchesAppRoute("/seller", patterns)).toBe(true);
    expect(hrefMatchesAppRoute("/seller/dashboard", patterns)).toBe(true);
  });
});

describe("Navigation audit — source href scan", () => {
  const patterns = collectAppRoutePatterns();
  const scanned = scanStaticHrefsInSource(path.join(process.cwd(), "components"));
  const featureScanned = scanStaticHrefsInSource(path.join(process.cwd(), "features"));
  const libScanned = scanStaticHrefsInSource(path.join(process.cwd(), "lib"));
  const allScanned = [...new Set([...scanned, ...featureScanned, ...libScanned])];
  const unmatched = findUnmatchedHrefs(allScanned, patterns);

  it(`resolves static hrefs in components/features/lib (${allScanned.length} unique)`, () => {
    expect(unmatched).toEqual([]);
  });
});

describe("Navigation audit — auth and shell", () => {
  it("defines protected route prefixes in middleware", () => {
    const middleware = readFileSync(
      path.join(process.cwd(), "lib/supabase/middleware.ts"),
      "utf8",
    );
    for (const prefix of ["/buyer", "/seller", "/business", "/account", "/admin", "/super-admin", "/sell", "/import"]) {
      expect(middleware).toContain(`"${prefix}"`);
    }
  });

  describe("Navigation audit — app shell", () => {
  it("does not mount a global marketing footer", () => {
    const shell = readFileSync(path.join(process.cwd(), "components/layout/AppShellLayout.tsx"), "utf8");
    expect(shell).not.toContain("ConditionalSiteFooter");
    expect(shell).not.toContain("<Footer");
  });

  it("provides global scroll chrome at root layout", () => {
    const layout = readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8");
    const shell = readFileSync(path.join(process.cwd(), "components/layout/AppShellLayout.tsx"), "utf8");
    expect(layout).toContain("AppShellLayout");
    expect(shell).toContain("AppChromeScrollProvider");
  });
  });
});

describe("Navigation audit — bottom navigation", () => {
  it("defines five bottom nav destinations", () => {
    const bottomNav = readFileSync(
      path.join(process.cwd(), "components/ui/BottomNavigation.tsx"),
      "utf8",
    );
    const homeNav = readFileSync(
      path.join(process.cwd(), "components/home/RovexoFooterNavigation.tsx"),
      "utf8",
    );

    for (const route of ["/", "/search", "/sell", "/saved", "/account"]) {
      expect(bottomNav).toContain(`"${route}"`);
      expect(homeNav).toContain(`"${route}"`);
    }
  });

  it("does not duplicate scroll provider in BetaAppShell", () => {
    const shell = readFileSync(path.join(process.cwd(), "components/beta/BetaAppShell.tsx"), "utf8");
    expect(shell).not.toContain("RovexoMobileHeaderScrollProvider");
  });
});

describe("Navigation audit — no placeholder links", () => {
  it("has no hash-only or javascript hrefs in app source", () => {
    const badPatterns = [/href=["'`]#["'`]/, /href=["'`]javascript:/];
    const dirs = ["components", "features", "app", "lib"];

    for (const dir of dirs) {
      const root = path.join(process.cwd(), dir);
      function walk(current: string): void {
        for (const entry of readdirSync(current, { withFileTypes: true })) {
          if (entry.name === "node_modules" || entry.name === ".next") continue;
          const full = path.join(current, entry.name);
          if (entry.isDirectory()) {
            walk(full);
            continue;
          }
          if (!/\.(tsx|ts)$/.test(entry.name)) continue;
          const source = readFileSync(full, "utf8");
          for (const pattern of badPatterns) {
            expect(source, `${full} must not contain ${pattern}`).not.toMatch(pattern);
          }
        }
      }
      walk(root);
    }
  });
});
