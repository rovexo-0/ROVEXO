import fs from "node:fs";

import path from "node:path";

import { expect, type Page } from "@playwright/test";



/** Canonical homepage landmarks — keep in sync with RovexoHomePage composition. */

export const HOMEPAGE_MAIN_SELECTOR = 'main[data-hp-homepage="canonical"], [data-hp-homepage="canonical"]';

export const CATEGORY_RAIL_SELECTOR = 'nav[aria-label="Categories"]';

export const ALL_LISTINGS_SELECTOR = '[data-homepage-listing-container="grid"]';

export const LISTING_CARD_SELECTOR = '[data-hp-listing-card="official"]';



export const RESPONSIVE_VIEWPORTS = [

  { name: "iphone-se", label: "iPhone SE", width: 375, height: 667 },

  { name: "iphone-15", label: "iPhone 15", width: 393, height: 852 },

  { name: "iphone-pro-max", label: "iPhone Pro Max", width: 440, height: 956 },

  { name: "android-small", label: "Android Small", width: 360, height: 780 },

  { name: "android-medium", label: "Pixel 7", width: 412, height: 915 },

  { name: "android-large", label: "Android Large", width: 480, height: 1014 },

  { name: "foldable", label: "Foldable", width: 717, height: 512 },

  { name: "ipad", label: "iPad", width: 768, height: 1024 },

  { name: "laptop", label: "Laptop", width: 1280, height: 800 },

  { name: "desktop", label: "Desktop", width: 1440, height: 900 },

  { name: "ultrawide", label: "UltraWide", width: 2560, height: 1080 },

] as const;



export async function waitForDomContentLoaded(page: Page): Promise<void> {

  await page.waitForLoadState("domcontentloaded");

}



async function waitForSearchResultsResponse(page: Page): Promise<void> {

  try {

    const response = await page.waitForResponse(

      (response) =>

        response.url().includes("/api/search/results") && response.request().method() === "GET",

      { timeout: 25_000 },

    );



    if (response.ok()) return;



    const retry = page.getByRole("button", { name: /try again/i });

    if (await retry.isVisible().catch(() => false)) {

      await retry.click();

      await waitForSearchResultsResponse(page);

    }

  } catch {

    // Response may have finished before the waiter was registered; rely on UI assertions next.

  }

}



export const HEADER_SELECTOR = '[data-header-version="rovexo-v2"]';



export async function waitForHomepageUi(page: Page): Promise<void> {

  await waitForDomContentLoaded(page);

  await page.evaluate(() => window.scrollTo(0, 0));

  await page.waitForTimeout(300);

  const header = page.locator('[data-header-version="rovexo-v2"]').first();
  await expect(header).toBeVisible();
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-header-version="rovexo-v2"]');
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.top >= -1 && rect.height > 0;
  });

  const searchControl = page
    .locator(
      ".rx-h2__search .homepage-search__control, [data-header-search='bar'], [data-header-search='field'], #rx-h2-search",
    )
    .first();
  await expect(searchControl).toBeVisible({ timeout: 15_000 });
  try {
    await searchControl.scrollIntoViewIfNeeded({ timeout: 5_000 });
  } catch {
    // Header can remount during hydration; visibility above is sufficient.
  }
  await expect(searchControl).toBeVisible();

  await expect(page.locator(HOMEPAGE_MAIN_SELECTOR).first()).toBeVisible();

  await expect(page.locator(CATEGORY_RAIL_SELECTOR).first()).toBeVisible();

  // Grid when listings exist; empty-state still exposes the listings region for Absolute Final.
  await expect(
    page
      .locator(
        `${ALL_LISTINGS_SELECTOR}, [data-homepage-listing-container="empty"], [data-homepage-empty="listings"]`,
      )
      .first(),
  ).toBeVisible();

  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();

}



export async function waitForSearchResultsUi(page: Page): Promise<void> {

  await waitForDomContentLoaded(page);

  await expect(page.getByRole("heading", { name: /results for|browse listings/i })).toBeVisible();

  await waitForSearchResultsResponse(page);

  await expect(page.locator('[data-search-version="v1.0-final"]').first()).toBeVisible();

  const tablist = page.getByRole("tablist", { name: "Search filters" });
  if (await tablist.isVisible().catch(() => false)) {
    await expect(page.getByRole("region", { name: "Search filters" })).toBeVisible();
  }

}



export async function waitForSearchEmptyState(page: Page): Promise<void> {

  await waitForDomContentLoaded(page);

  await expect(page.getByRole("heading", { name: /results for/i })).toBeVisible();

  await waitForSearchResultsResponse(page);

  await expect(page.getByRole("heading", { name: "No results found" })).toBeVisible({

    timeout: 10_000,

  });

}



export async function waitForSearchOverlayUi(page: Page): Promise<void> {
  const overlay = page.locator("#search-overlay-results");
  const homepageSuggestions = page.locator(".homepage-search__suggestions").first();

  if (page.url().includes("/search")) {
    await expect(overlay).toBeVisible();
  } else {
    await expect(overlay.or(homepageSuggestions)).toBeVisible();
  }

  await page.waitForTimeout(300);
}

export async function dismissSearchDialogIfOpen(page: Page): Promise<void> {
  const searchDialog = page.getByRole("dialog", { name: "Search" });
  if (!(await searchDialog.isVisible().catch(() => false))) return;

  const panelClose = searchDialog.getByRole("button", { name: "Close", exact: true });
  if (await panelClose.isVisible().catch(() => false)) {
    await panelClose.click();
  } else {
    await page.keyboard.press("Escape");
  }

  await expect(searchDialog).toBeHidden({ timeout: 5_000 });
}

export async function openSearchOverlay(page: Page): Promise<void> {
  const onSearchRoute = page.url().includes("/search");
  const field = page.locator('#rx-h2-search, [data-header-search="field"]').first();
  const bar = page.locator('[data-header-search="bar"]').first();

  if (onSearchRoute && (await bar.isVisible().catch(() => false))) {
    await bar.click();
    await waitForSearchOverlayUi(page);
    return;
  }

  if (await field.isVisible().catch(() => false)) {
    await field.click();
    await expect(field).toBeFocused();
    return;
  }

  await bar.click();
  await waitForSearchOverlayUi(page);
}



export async function waitForSearchSuggestions(page: Page, query: string): Promise<void> {
  const input = page.locator('#rx-h2-search, input[type="search"]').first();
  await expect(input).toBeVisible();
  await input.fill(query);
  await page.waitForTimeout(400);
  const overlay = page.locator("#search-overlay-results");
  const homepageListbox = page.locator(".homepage-search__suggestions [role='option']").first();
  await expect(overlay.or(homepageListbox)).toBeVisible({ timeout: 10_000 });
}



export async function settleUi(page: Page, ms = 400): Promise<void> {

  await page.waitForTimeout(ms);

}



export async function captureViewportScreenshot(page: Page, filePath: string): Promise<void> {

  const directory = path.dirname(filePath);

  fs.mkdirSync(directory, { recursive: true });

  await page.screenshot({

    path: filePath,

    fullPage: false,

    animations: "disabled",

    caret: "hide",

  });

}



export async function captureSafely(

  label: string,

  filePath: string,

  capture: () => Promise<void>,

): Promise<void> {

  try {

    await capture();

  } catch (error) {

    console.warn(`[playwright] ${label} failed (${filePath}):`, error);

  }

}



export function screenshotPath(...segments: string[]): string {

  return path.join(process.cwd(), "test-results", ...segments);

}


