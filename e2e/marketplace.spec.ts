import { test, expect } from "@playwright/test";
import {
  CATEGORY_RAIL_SELECTOR,
  waitForDomContentLoaded,
  waitForHomepageUi,
  waitForSearchResultsUi,
} from "./helpers/stable-ui";
import { ensureMarketplaceSession } from "./helpers/marketplace-session";

test.describe("marketplace core", () => {
  test("homepage renders search, categories and featured listings", async ({ page, baseURL }) => {
    await ensureMarketplaceSession(page, baseURL);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHomepageUi(page);
    const categories = page.locator(CATEGORY_RAIL_SELECTOR);
    await expect(categories).toBeVisible();
    await expect(categories.locator("a[href*='/category/']").first()).toBeVisible();
  });

  test("categories index is reachable", async ({ page }) => {
    await page.goto("/categories", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /all categories/i })).toBeVisible();
  });

  test("search results page loads", async ({ page }) => {
    await page.goto("/search?q=phone", { waitUntil: "domcontentloaded" });
    await waitForSearchResultsUi(page);
  });

  test("category page resolves nested slug path", async ({ page }) => {
    // Catalog Master SSOT: Home & Garden → Furniture → Beds & Mattresses
    await page.goto("/category/home-garden/furniture/beds-and-mattresses", {
      waitUntil: "domcontentloaded",
    });
    await waitForDomContentLoaded(page);
    // Must not 404. Empty marketplace uses Global Empty State (no category H1).
    await expect(page.getByRole("heading", { name: /page not found/i })).toHaveCount(0);
    const categoryHeading = page.getByRole("heading", { name: "Beds & Mattresses", exact: true });
    // Global empty may mount nested [data-empty-state] nodes — assert first match only.
    const emptyState = page.locator('[data-empty-state="no-products-v1"]').first();
    await expect(categoryHeading.or(emptyState)).toBeVisible({ timeout: 15_000 });
    if (await categoryHeading.isVisible().catch(() => false)) {
      await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
    } else {
      await expect(page.getByRole("link", { name: /back to browse/i })).toBeVisible();
    }
  });

  test("health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");
    expect([200, 503]).toContain(response.status());
    const payload = (await response.json()) as { status: string; checks: Record<string, unknown> };
    expect(["healthy", "degraded", "unhealthy"]).toContain(payload.status);
    expect(payload.checks).toBeTruthy();
  });
});
