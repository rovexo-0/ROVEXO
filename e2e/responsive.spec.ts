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
    await expect(page.locator('section[aria-label="ROVEXO hero carousel"]')).toBeVisible();
    await expect(page.getByRole("tablist", { name: "Hero slides" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /move your entire store to rovexo/i })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();

    const headerBox = await page.locator('[data-header-version="premium-2026"]').boundingBox();
    expect(headerBox?.width).toBeGreaterThan(0);
    expect(headerBox?.height).toBeGreaterThan(0);

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 1;
    });
    expect(overflow, "page must not scroll horizontally").toBe(false);
  });
}

test("homepage has no unexpected console errors on load", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  const unexpected = consoleErrors.filter(
    (line) =>
      !line.includes("401 (Unauthorized)") &&
      !line.includes("Failed to load resource") &&
      !line.includes("Missing required environment variable"),
  );
  expect(unexpected, unexpected.join("\n")).toEqual([]);
});

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
