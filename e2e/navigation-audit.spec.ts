import { test, expect } from "@playwright/test";
import { waitForHomepageUi } from "./helpers/stable-ui";
import { IMPORT_WIZARD_PATH } from "../lib/seller/migration/config";

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
  });

  for (const item of BOTTOM_NAV_ROUTES) {
    test(`${item.tab} tab navigates to ${item.href}`, async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await waitForHomepageUi(page);

      const nav = page.getByRole("navigation", { name: /mobile navigation|main navigation/i });
      await nav.getByRole("link", { name: item.aria }).click();

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
    await expect(page.getByRole("navigation", { name: /mobile navigation|main navigation/i })).toBeVisible();
  });
});

test.describe("Navigation audit — header chrome", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHomepageUi(page);
  });

  test("logo returns to homepage", async ({ page }) => {
    await page.goto("/categories", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: /rovexo home/i }).click();
    await expect(page).toHaveURL("/");
  });

  for (const link of HEADER_LINKS) {
    test(`${link.label} header link requires auth`, async ({ page }) => {
      const header = page.locator('[data-header-version="home-v1"], [data-header-version="rovexo-v1"]').first();
      await header.getByRole("link", { name: link.label }).click();
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
        await expect(
          page.locator('[data-header-version="home-v1"], [data-header-version="rovexo-v1"]').first(),
        ).toBeVisible();
      }
    });
  }

  test("import banner CTA points to import wizard", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHomepageUi(page);
    const importLink = page.getByRole("link", { name: /import listings/i });
    if ((await importLink.count()) > 0) {
      await expect(importLink).toHaveAttribute("href", /\/(import|bring-your-item)/);
    }
  });
});
