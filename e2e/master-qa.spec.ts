import { test, expect, type Page } from "@playwright/test";
import {
  HERO_CAROUSEL_SELECTOR,
  waitForHeroCarousel,
  waitForHomepageUi,
} from "./helpers/stable-ui";
import { escapeSlugForRegExp, resolveListingSlugForE2E } from "./helpers/listing-slug";
type RouteExpectation = {
  path: string;
  name: string;
  /** If set, final URL must match after redirects */
  finalPath?: RegExp;
  /** Heading or landmark to confirm render (public pages) */
  landmark?: RegExp | string;
  /** Homepage hero carousel — migration slide is slide 1 on load */
  heroCarousel?: boolean;
  /** Protected routes redirect to login when unauthenticated */
  authRedirect?: boolean;
};

const PUBLIC_ROUTES: RouteExpectation[] = [
  { path: "/", name: "Homepage", landmark: /move your entire store to rovexo/i, heroCarousel: true },
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
  { path: "/import", name: "Import wizard", authRedirect: true },
  { path: "/seller/migration", name: "Migration center (legacy)", authRedirect: true },
  { path: "/seller/connectors", name: "Marketplace connectors", authRedirect: true },
  { path: "/cart", name: "Cart", authRedirect: true },
  { path: "/resolution", name: "Resolution Centre", authRedirect: true },
  { path: "/help/faq", name: "FAQ", landmark: /faq/i },
  { path: "/help/policies", name: "Policies", landmark: /policies/i },
  { path: "/help/terms-of-service", name: "Terms of service" },
  { path: "/help/privacy-policy", name: "Privacy policy" },
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
        if (route.heroCarousel) {
          await expect(page.locator(HERO_CAROUSEL_SELECTOR)).toBeVisible();
          await expect(page.getByRole("tablist", { name: "Hero slides" })).toBeVisible();
        }
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
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHomepageUi(page);
    await waitForHeroCarousel(page);

    const featuredHeading = page.getByRole("heading", { name: /featured listings/i });
    if ((await featuredHeading.count()) > 0) {
      await expect(featuredHeading).toBeVisible();
    }

    await expect(page.getByRole("heading", { name: /recommended for you/i })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /latest listings/i })).toHaveCount(0);

    await page.locator("#auctions-heading").scrollIntoViewIfNeeded();
    await expect(page.locator("#auctions-heading")).toHaveText(/popular auctions/i);
    const bannerSection = page.locator(HERO_CAROUSEL_SELECTOR);
    await bannerSection.scrollIntoViewIfNeeded();
    await expect(bannerSection.getByRole("link", { name: "Bring Your Items" })).toHaveAttribute("href", "/sell/new");
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

  test("import hero banner CTAs resolve correctly", async ({ page }) => {
    await page.goto("/");
    const bannerSection = page.locator(HERO_CAROUSEL_SELECTOR);
    await bannerSection.scrollIntoViewIfNeeded();
    await expect(bannerSection.getByRole("link", { name: "Bring Your Items" })).toHaveAttribute("href", "/sell/new");
  });

  test("footer legal links resolve", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await footer.scrollIntoViewIfNeeded();
    const contactLink = footer.getByRole("link", { name: "Contact" });
    await expect(contactLink).toBeVisible();
    await contactLink.click();
    await expect(page).toHaveURL(/\/support/);
    await assertNoServerError(page);
  });
});

test.describe("Master QA — listing alias", () => {
  test("/item/:slug redirects to listing page", async ({ page, request }) => {
    const { slug, cleanup } = await resolveListingSlugForE2E(request, page);

    try {
      const redirectResponse = await request.get(`/item/${encodeURIComponent(slug)}`, {
        maxRedirects: 0,
      });
      expect([301, 308, 307]).toContain(redirectResponse.status());
      const location = redirectResponse.headers().location ?? "";
      expect(location).toMatch(new RegExp(`/listing/${escapeSlugForRegExp(slug)}(?:\\?.*)?$`));

      const response = await page.goto(`/item/${encodeURIComponent(slug)}`, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(new RegExp(`/listing/${escapeSlugForRegExp(slug)}`));
      await expect(page.locator("main")).toBeVisible();
      await assertNoServerError(page);
    } finally {
      await cleanup();
    }
  });
});

test.describe("Master QA — API health", () => {
  test("health endpoint", async ({ request }) => {
    const response = await request.get("/api/health");
    expect([200, 503]).toContain(response.status());
  });
});
