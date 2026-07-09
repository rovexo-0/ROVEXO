import { test, expect } from "@playwright/test";
import { HEADER_SELECTOR, waitForHomepageUi } from "./helpers/stable-ui";

const BOTTOM_NAV_ROUTES = [
  { tab: "Home", href: "/", aria: "Home" },
  { tab: "Search", href: "/search", aria: "Search" },
  { tab: "Sell", href: "/sell", aria: "Sell", authRedirect: true },
  { tab: "Saved", href: "/saved", aria: "Saved", authRedirect: true },
  { tab: "Account", href: "/account", aria: "Account", authRedirect: true },
] as const;

const HEADER_LINKS = [
  { label: "Messages", href: "/messages", authRedirect: true },
  { label: "Notifications", href: "/notifications", authRedirect: true },
  { label: "Account", href: "/account", authRedirect: true },
] as const;

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

test.describe("Navigation audit — bottom navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    // Next.js dev indicator portal can cover bottom-nav taps during local E2E.
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
        await page.goto("/search", { waitUntil: "domcontentloaded" });
      } else {
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await waitForHomepageUi(page);
      }

      const nav = page.getByRole("navigation", { name: /mobile navigation|main navigation/i }).first();
      await expect(nav).toBeVisible();
      const navLink = nav.getByRole("link", { name: item.aria });

      if (item.tab === "Home") {
        await Promise.all([
          page.waitForURL((url) => url.pathname === "/"),
          navLink.evaluate((node) => (node as HTMLAnchorElement).click()),
        ]);
      } else {
        await navLink.click();
      }

      if (item.authRedirect) {
        await expect(page).toHaveURL(/\/login/);
      } else if (item.tab === "Search") {
        await expect(page).toHaveURL(/\/(search)?$/);
      } else {
        await expect(page).toHaveURL(new RegExp(item.href === "/" ? "/$" : item.href.replace("/", "\\/")));
      }
    });
  }

  test("bottom navigation is visible on homepage", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHomepageUi(page);
    await expect(page.getByRole("navigation", { name: /mobile navigation|main navigation/i }).first()).toBeVisible();
  });
});

test.describe("Navigation audit — header chrome", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /search rovexo|results for/i })).toBeVisible();
  });

  test("logo returns to homepage", async ({ page }) => {
    // Search landing auto-opens the full-screen overlay; use results view so the header logo is reachable.
    await page.goto("/search?q=phone", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /results for/i })).toBeVisible();
    const logo = page.locator('header[data-header-version="rovexo-v2"] a[aria-label="ROVEXO Home"]');
    await expect(logo).toBeVisible();
    await Promise.all([page.waitForURL("/", { timeout: 15_000 }), logo.click()]);
    await expect(page).toHaveURL("/");
  });

  for (const link of HEADER_LINKS) {
    test(`${link.label} header link requires auth`, async ({ page }) => {
      const header = page.locator(HEADER_SELECTOR).first();
      const target =
        link.label === "Account"
          ? header.getByRole("link", { name: /account|profile/i }).first()
          : header.getByRole("link", { name: new RegExp(`^${link.label}`, "i") }).first();
      await expect(target).toHaveAttribute("href", link.href === "/account" ? /\/account/ : link.href);
      await page.goto(link.href);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe("Navigation audit — auth routes", () => {
  const authRoutes = [
    { path: "/login", heading: /welcome back/i },
    { path: "/register", heading: /create your account/i },
    { path: "/forgot-password", heading: /forgot|reset/i },
  ] as const;

  for (const route of authRoutes) {
    test(`${route.path} loads`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(500);
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
    });
  }
});

test.describe("Navigation audit — responsive shells", () => {
  for (const viewport of VIEWPORTS) {
    test(`homepage renders at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto("/", { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(500);
      if (viewport.width < 1024) {
        await waitForHomepageUi(page);
      } else {
        await expect(page.locator(HEADER_SELECTOR).first()).toBeVisible();
      }
    });
  }
});
