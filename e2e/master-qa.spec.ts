import { test, expect, type Page } from "@playwright/test";

type RouteExpectation = {
  path: string;
  name: string;
  /** If set, final URL must match after redirects */
  finalPath?: RegExp;
  /** Heading or landmark to confirm render (public pages) */
  landmark?: RegExp | string;
  /** Protected routes redirect to login when unauthenticated */
  authRedirect?: boolean;
};

const PUBLIC_ROUTES: RouteExpectation[] = [
  { path: "/", name: "Homepage", landmark: /featured listings/i },
  { path: "/search", name: "Search", landmark: /search rovexo|results for/i },
  { path: "/categories", name: "Categories", landmark: /all categories/i },
  { path: "/category/home-garden/furniture/beds", name: "Category", landmark: "Beds" },
  { path: "/help", name: "Help Centre", landmark: /help/i },
  { path: "/assistant", name: "AI Assistant" },
  { path: "/trust", name: "Trust Centre" },
  { path: "/support", name: "Support" },
  { path: "/legal", name: "Legal" },
  { path: "/plans", name: "Plans" },
  { path: "/auctions", name: "Auctions" },
  { path: "/business", name: "Business hub", authRedirect: true },
  { path: "/business/center", name: "Business Center" },
  { path: "/wholesale", name: "Wholesale" },
];

const PROTECTED_ROUTES: RouteExpectation[] = [
  { path: "/sell", name: "Sell", authRedirect: true },
  { path: "/sell/new", name: "Publish wizard", authRedirect: true },
  { path: "/seller/dashboard", name: "Seller dashboard", authRedirect: true },
  { path: "/account", name: "Account", authRedirect: true },
  { path: "/account/profile", name: "Account profile", authRedirect: true },
  { path: "/account/settings", name: "Account settings", authRedirect: true },
  { path: "/account/orders", name: "Account orders alias", authRedirect: true },
  { path: "/account/wallet", name: "Account wallet alias", authRedirect: true },
  { path: "/orders", name: "Orders", authRedirect: true },
  { path: "/messages", name: "Messages", authRedirect: true },
  { path: "/notifications", name: "Notifications", authRedirect: true },
  { path: "/saved", name: "Saved", authRedirect: true },
  { path: "/admin", name: "Admin", authRedirect: true },
  { path: "/super-admin", name: "Super Admin", authRedirect: true },
];

async function assertNoServerError(page: Page) {
  const body = await page.locator("body").innerText();
  expect(body.toLowerCase()).not.toContain("application error");
  expect(body.toLowerCase()).not.toMatch(/internal server error/);
}

test.describe("Master QA — public routes", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} (${route.path})`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(500);
      await assertNoServerError(page);

      if (route.finalPath) {
        await expect(page).toHaveURL(route.finalPath);
      }

      if (route.landmark) {
        await expect(page.getByRole("heading", { name: route.landmark }).first()).toBeVisible({
          timeout: 20_000,
        });
      }
    });
  }
});

test.describe("Master QA — protected routes (unauthenticated)", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route.name} (${route.path})`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await assertNoServerError(page);

      if (route.finalPath) {
        await expect(page).toHaveURL(route.finalPath);
      }

      if (route.authRedirect) {
        await expect(page).toHaveURL(/\/login/);
      }
    });
  }
});

test.describe("Master QA — homepage sections", () => {
  test("hero, categories, listings, navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator('[data-header-version="premium-2026"]')).toBeVisible();
    await expect(page.locator("#header-search, [data-header-search='bar']").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /premium marketplace|featured listings/i }).first()).toBeVisible();
    await expect(page.locator('section[aria-labelledby="home-categories-heading"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: /featured listings/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /recommended for you/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /latest listings/i })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  });
});

test.describe("Master QA — navigation links", () => {
  test("bottom navigation targets resolve", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Search" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Sell" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Saved" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Account" })).toBeVisible();
  });

  test("footer help links resolve", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const helpLink = page.getByRole("link", { name: "Help center" });
    await expect(helpLink).toBeVisible();
    await helpLink.click();
    await expect(page).toHaveURL(/\/help/);
    await assertNoServerError(page);
  });
});

test.describe("Master QA — listing alias", () => {
  test("/item/:slug redirects to listing page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const listingLink = page.locator('a[href^="/listing/"]').first();
    const count = await listingLink.count();
    test.skip(count === 0, "No listings on homepage to test alias redirect");

    const href = await listingLink.getAttribute("href");
    const slug = href?.replace("/listing/", "");
    expect(slug).toBeTruthy();

    const response = await page.goto(`/item/${slug}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(new RegExp(`/listing/${slug}`));
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Master QA — API health", () => {
  test("health endpoint", async ({ request }) => {
    const response = await request.get("/api/health");
    expect([200, 503]).toContain(response.status());
  });
});
