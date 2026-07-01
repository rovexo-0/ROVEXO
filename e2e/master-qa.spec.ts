import { test, expect, type Page } from "@playwright/test";
import {
  HERO_CAROUSEL_SELECTOR,
  HOME_IMPORT_BANNER_SELECTOR,
  waitForHeroCarousel,
  waitForHomepageUi,
} from "./helpers/stable-ui";
import { IMPORT_WIZARD_PATH } from "../lib/seller/migration/config";
import { escapeSlugForRegExp, listingPageStatus, resolveListingSlugForE2E } from "./helpers/listing-slug";
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
  { path: "/", name: "Homepage", landmark: /bring your listings|featured listings/i },
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
  { path: "/seller", name: "Seller dashboard", authRedirect: true },
  { path: "/account", name: "Account", authRedirect: true },
  { path: "/buyer", name: "Buyer Dashboard", authRedirect: true },
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
      if (route.path === "/") {
        await page.setViewportSize({ width: 390, height: 844 });
      }
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(500);
      await assertNoServerError(page);

      if (route.finalPath) {
        await expect(page).toHaveURL(route.finalPath);
      }

      if (route.landmark) {
        if (route.path === "/") {
          await waitForHomepageUi(page);
        } else {
          await expect(page.getByRole("heading", { name: route.landmark }).first()).toBeVisible({
            timeout: 20_000,
          });
        }
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
  test("categories, import banner, listings, navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHomepageUi(page);
    await waitForHeroCarousel(page);

    const featuredHeading = page.getByRole("heading", { name: /featured listings/i });
    if ((await featuredHeading.count()) > 0) {
      await expect(featuredHeading).toBeVisible();
    }

    const importBanner = page.locator(HOME_IMPORT_BANNER_SELECTOR);
    const heroCarousel = page.locator(HERO_CAROUSEL_SELECTOR);
    if ((await importBanner.count()) > 0) {
      await importBanner.scrollIntoViewIfNeeded();
      await expect(importBanner.getByRole("link", { name: /import listings/i })).toHaveAttribute(
        "href",
        /\/(import|bring-your-item)/,
      );
    } else if ((await heroCarousel.count()) > 0) {
      await heroCarousel.scrollIntoViewIfNeeded();
      await expect(heroCarousel.getByRole("link", { name: /bring your items/i })).toBeVisible();
    }

    await expect(page.getByRole("navigation", { name: /mobile navigation|main navigation/i })).toBeVisible();
  });
});

test.describe("Master QA — navigation links", () => {
  test("bottom navigation targets resolve", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await waitForHomepageUi(page);
    const nav = page.getByRole("navigation", { name: /mobile navigation|main navigation/i });
    await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Search" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Sell" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Saved" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Account" })).toBeVisible();
  });

  test("import banner CTA resolves correctly", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await waitForHomepageUi(page);
    const importBanner = page.locator(HOME_IMPORT_BANNER_SELECTOR);
    if ((await importBanner.count()) > 0) {
      await importBanner.scrollIntoViewIfNeeded();
      await expect(importBanner.getByRole("link", { name: /import listings/i })).toHaveAttribute(
        "href",
        /\/(import|bring-your-item)/,
      );
      return;
    }

    const heroCarousel = page.locator(HERO_CAROUSEL_SELECTOR);
    await heroCarousel.scrollIntoViewIfNeeded();
    await expect(heroCarousel.getByRole("link", { name: /bring your items/i })).toBeVisible();
  });

  test("footer legal links resolve", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await waitForHomepageUi(page);
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

      await page.goto(`/item/${encodeURIComponent(slug)}`, {
        waitUntil: "domcontentloaded",
      });
      await expect(page).toHaveURL(new RegExp(`/listing/${escapeSlugForRegExp(slug)}`));
      await expect(page.locator("main")).toBeVisible();
      expect(await listingPageStatus(request, slug), "listing page must resolve after alias redirect").toBe(
        200,
      );
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
