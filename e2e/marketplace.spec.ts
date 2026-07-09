import { test, expect } from "@playwright/test";
import {
  CATEGORY_RAIL_SELECTOR,
  waitForDomContentLoaded,
  waitForHomepageUi,
  waitForSearchResultsUi,
} from "./helpers/stable-ui";

test.describe("marketplace core", () => {
  test("homepage renders search, categories and featured listings", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHomepageUi(page);
    const categories = page.locator(CATEGORY_RAIL_SELECTOR);
    await expect(categories).toBeVisible();
    await expect(categories.locator("a[href*='/search?category=']").first()).toBeVisible();
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
    await page.goto("/category/home-garden/furniture/beds", { waitUntil: "domcontentloaded" });
    await waitForDomContentLoaded(page);
    await expect(page.getByRole("heading", { name: "Beds", exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
  });

  test("health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");
    expect([200, 503]).toContain(response.status());
    const payload = (await response.json()) as { status: string; checks: Record<string, unknown> };
    expect(["healthy", "degraded", "unhealthy"]).toContain(payload.status);
    expect(payload.checks).toBeTruthy();
  });
});
