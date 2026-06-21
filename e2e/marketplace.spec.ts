import { test, expect } from "@playwright/test";

test.describe("marketplace core", () => {
  test("homepage renders hero and category sections", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#home-hero-heading")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /shop by category/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /featured listings/i })).toBeVisible();
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
});
