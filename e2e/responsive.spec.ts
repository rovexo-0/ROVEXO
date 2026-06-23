import { test, expect } from "@playwright/test";

const viewports = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 15", width: 393, height: 852 },
  { name: "iPhone 15 Pro Max", width: 430, height: 932 },
  { name: "iPad", width: 768, height: 1024 },
  { name: "Desktop", width: 1280, height: 800 },
] as const;

for (const viewport of viewports) {
  test(`homepage layout at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator('[data-header-version="premium-2026"]')).toBeVisible();
    await expect(page.locator("#header-search")).toBeVisible();
    await expect(page.getByRole("heading", { name: /featured listings/i })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();

    const headerBox = await page.locator('[data-header-version="premium-2026"]').boundingBox();
    expect(headerBox?.width).toBeGreaterThan(0);
    expect(headerBox?.height).toBeGreaterThan(0);
  });
}

test("search page is usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/search?q=phone");
  await expect(page.getByRole("heading", { name: /results for/i })).toBeVisible();
  await expect(page.getByLabel("Search filters")).toBeVisible();
});

test("listing page renders on tablet", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  const featuredLink = page.locator('a[href^="/listing/"]').first();
  if (await featuredLink.count()) {
    await featuredLink.click();
    await expect(page.locator("main")).toBeVisible();
  }
});
