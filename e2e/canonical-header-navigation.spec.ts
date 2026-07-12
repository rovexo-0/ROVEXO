import { test, expect } from "@playwright/test";
import { ALL_LISTINGS_SELECTOR, waitForHomepageUi } from "./helpers/stable-ui";

const CANONICAL_HEADER = '[data-canonical-page-header="v1"]';
const LISTING_DETAIL = '[data-pd-detail-version="v1.1"]';

test.describe("canonical page header navigation", () => {
  test("homepage → listing → back returns to homepage", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHomepageUi(page);

    const listingLink = page.locator(`${ALL_LISTINGS_SELECTOR} a[href*="/listing/"]`).first();
    await expect(listingLink).toBeVisible({ timeout: 30_000 });
    const href = await listingLink.getAttribute("href");
    expect(href).toBeTruthy();

    await listingLink.click();
    await expect(page).toHaveURL(/\/listing\//, { timeout: 30_000 });
    await expect(page.locator(LISTING_DETAIL)).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(CANONICAL_HEADER)).toBeVisible({ timeout: 15_000 });

    await page.locator(`${CANONICAL_HEADER} button[aria-label="Back"]`).click();
    await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 15_000 });
  });

  test("direct listing URL → back navigates to homepage", async ({ page, request }) => {
    const feedRes = await request.get("/api/homepage/feed?page=1");
    expect(feedRes.ok(), "Homepage feed must be available").toBeTruthy();

    const feed = (await feedRes.json()) as { items?: Array<{ slug?: string }> };
    const slug = feed.items?.[0]?.slug;
    expect(slug, "Homepage feed must include at least one listing").toBeTruthy();

    await page.goto(`/listing/${slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(LISTING_DETAIL)).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(CANONICAL_HEADER)).toBeVisible({ timeout: 15_000 });

    await page.locator(`${CANONICAL_HEADER} button[aria-label="Back"]`).click();
    await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 15_000 });
  });
});
