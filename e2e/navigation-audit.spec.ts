import { test, expect } from "@playwright/test";
import { HEADER_SELECTOR, waitForHomepageUi } from "./helpers/stable-ui";
import {
  dismissCookieBanner,
  ensureMarketplaceSession,
} from "./helpers/marketplace-session";

/**
 * Canonical bottom nav (BottomNavigation.tsx / HP_CANONICAL_BOTTOM_NAV):
 * Home · Browse(/browse) · Sell · Inbox(/inbox) · Account
 */
const BOTTOM_NAV_ROUTES = [
  { tab: "Home", href: "/", aria: "Home" },
  { tab: "Browse", href: "/browse", aria: "Browse" },
  { tab: "Sell", href: "/sell", aria: "Sell" },
  { tab: "Inbox", href: "/inbox", aria: "Inbox" },
  { tab: "Account", href: "/account", aria: "Account" },
] as const;

const AUTH_REQUIRED_PATHS = [
  { label: "Messages", href: "/messages" },
  { label: "Notifications", href: "/notifications" },
  { label: "Account", href: "/account" },
] as const;

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

test.describe("Navigation audit — bottom navigation", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await ensureMarketplaceSession(page, baseURL);
    await page.addInitScript(() => {
      const removeDevPortal = () => {
        document.querySelectorAll("nextjs-portal").forEach((node) => node.remove());
      };
      removeDevPortal();
      new MutationObserver(removeDevPortal).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    });
  });

  for (const item of BOTTOM_NAV_ROUTES) {
    test(`${item.tab} tab navigates to ${item.href}`, async ({ page }) => {
      if (item.tab === "Home") {
        await page.goto("/browse", { waitUntil: "domcontentloaded" });
      } else {
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await waitForHomepageUi(page);
      }
      await dismissCookieBanner(page);

      const nav = page.getByRole("navigation", { name: /mobile navigation|main navigation/i }).first();
      await expect(nav).toBeVisible();
      const navLink = nav.getByRole("link", { name: item.aria });
      await expect(navLink).toBeVisible();

      if (item.tab === "Home") {
        await Promise.all([
          page.waitForURL((url) => url.pathname === "/"),
          navLink.click({ force: true }),
        ]);
      } else {
        await navLink.click({ force: true });
      }

      await expect(page).toHaveURL(
        new RegExp(item.href === "/" ? "/$" : `${item.href.replace("/", "\\/")}`),
      );
    });
  }

  test("bottom navigation is visible on homepage", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHomepageUi(page);
    await dismissCookieBanner(page);
    await expect(page.getByRole("navigation", { name: /mobile navigation|main navigation/i }).first()).toBeVisible();
  });
});

test.describe("Navigation audit — header chrome", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await ensureMarketplaceSession(page, baseURL);
  });

  test("logo returns to homepage", async ({ page }) => {
    // Homepage Search Bar Only freeze: RovexoHeaderV2 mounts on `/` only — not on /search.
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHomepageUi(page);
    await dismissCookieBanner(page);
    const logo = page.locator('header[data-header-version="rovexo-v2"] a[aria-label="ROVEXO Home"]');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("href", "/");
    await page.goto("/browse", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await expect(page).toHaveURL(/\/browse/);
    // Off-homepage: return via bottom Home (header logo is unmounted by freeze).
    const nav = page.getByRole("navigation", { name: /mobile navigation|main navigation/i }).first();
    await Promise.all([
      page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 }),
      nav.getByRole("link", { name: "Home" }).click({ force: true }),
    ]);
    await expect(page).toHaveURL("/");
    await waitForHomepageUi(page);
    await expect(
      page.locator('header[data-header-version="rovexo-v2"] a[aria-label="ROVEXO Home"]'),
    ).toBeVisible();
  });

  for (const link of AUTH_REQUIRED_PATHS) {
    test(`${link.label} route requires auth when logged out`, async ({ page, context }) => {
      // Header Search Priority Freeze: Messages/Notifications/Account are NOT in header.
      await context.clearCookies();
      await page.goto(link.href, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe("Navigation audit — auth routes", () => {
  const authRoutes = [
    {
      path: "/login",
      assert: async (page: import("@playwright/test").Page) => {
        await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
        await expect(page.getByLabel(/email address/i)).toBeVisible();
        await expect(page.getByRole("link", { name: /create account/i })).toBeVisible();
      },
    },
    {
      path: "/register",
      assert: async (page: import("@playwright/test").Page) => {
        await expect(page.getByRole("button", { name: /create free account/i })).toBeVisible();
        await expect(page.getByLabel(/email address/i)).toBeVisible();
      },
    },
    {
      path: "/forgot-password",
      assert: async (page: import("@playwright/test").Page) => {
        await expect(page.getByRole("heading", { name: /forgot|reset/i })).toBeVisible();
      },
    },
  ] as const;

  for (const route of authRoutes) {
    test(`${route.path} loads`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(500);
      await route.assert(page);
    });
  }
});

test.describe("Navigation audit — responsive shells", () => {
  for (const viewport of VIEWPORTS) {
    test(`homepage renders at ${viewport.name}`, async ({ page, baseURL }) => {
      await ensureMarketplaceSession(page, baseURL);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto("/", { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(500);
      await dismissCookieBanner(page);
      if (viewport.width < 1024) {
        await waitForHomepageUi(page);
      } else {
        await expect(page.locator(HEADER_SELECTOR).first()).toBeVisible();
      }
    });
  }
});
