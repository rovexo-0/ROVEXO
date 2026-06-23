import { test, expect } from "@playwright/test";

test.describe("marketplace core", () => {
  test("homepage renders hero search, categories and featured listings", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#home-hero-search-heading")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /featured listings/i })).toBeVisible();
    const categories = page.locator('section[aria-labelledby="home-categories-heading"]');
    await expect(categories.locator('a[href="/category/vehicles"]')).toBeVisible();
    await expect(categories.locator('a[href="/category/fashion"]')).toBeVisible();
  });

  test("categories index is reachable", async ({ page }) => {
    await page.goto("/categories");
    await expect(page.getByRole("heading", { name: /all categories/i })).toBeVisible();
  });

  test("search results page loads", async ({ page }) => {
    await page.goto("/search?q=phone");
    await expect(page.getByRole("heading", { name: /results for/i })).toBeVisible();
    await expect(page.getByLabel("Search filters")).toBeVisible();
  });

  test("category page resolves nested slug path", async ({ page }) => {
    await page.goto("/category/home-garden/furniture/beds");
    await page.waitForLoadState("domcontentloaded");
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
