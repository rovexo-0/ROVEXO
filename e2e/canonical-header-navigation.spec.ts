import { test, expect } from "@playwright/test";
import { ALL_LISTINGS_SELECTOR, waitForHomepageUi } from "./helpers/stable-ui";
import { ensureMarketplaceSession, dismissCookieBanner } from "./helpers/marketplace-session";

/** Product Detail freeze — SSOT in ProductDetailPage.tsx */
const LISTING_DETAIL = '[data-pd-detail-version="cod-sange-v3.1"]';
/** Product gallery chrome back — not Account CanonicalPageHeader */
const LISTING_BACK = '[data-pd-chrome="v3"] button[aria-label="Back"]';

test.describe("canonical page header navigation", () => {
  test("homepage → listing → back returns to homepage", async ({ page, baseURL }) => {
    await ensureMarketplaceSession(page, baseURL);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await waitForHomepageUi(page);

    const listingLink = page.locator(`${ALL_LISTINGS_SELECTOR} a[href*="/listing/"]`).first();
    await expect(listingLink).toBeVisible({ timeout: 30_000 });
    const href = await listingLink.getAttribute("href");
    expect(href).toBeTruthy();

    await listingLink.click();
    await expect(page).toHaveURL(/\/listing\//, { timeout: 30_000 });
    await expect(page.locator(LISTING_DETAIL)).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(LISTING_BACK)).toBeVisible({ timeout: 15_000 });

    await page.locator(LISTING_BACK).click();
    await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 15_000 });
  });

  test("direct listing URL → back navigates to homepage", async ({ page, request, baseURL }) => {
    await ensureMarketplaceSession(page, baseURL);

    const feedRes = await request.get("/api/homepage/feed?page=1");
    expect(feedRes.ok(), "Homepage feed must be available").toBeTruthy();

    const feed = (await feedRes.json()) as { items?: Array<{ slug?: string }> };
    const slug = feed.items?.[0]?.slug;
    expect(slug, "Homepage feed must include at least one listing").toBeTruthy();

    await page.goto(`/listing/${slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(LISTING_DETAIL)).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(LISTING_BACK)).toBeVisible({ timeout: 15_000 });

    await page.locator(LISTING_BACK).click();
    await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 15_000 });
  });
});
