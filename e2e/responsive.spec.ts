import { test, expect } from "@playwright/test";
import {
  CATEGORY_RAIL_SELECTOR,
  HEADER_SELECTOR,
  RESPONSIVE_VIEWPORTS,
  waitForHomepageUi,
  waitForSearchResultsUi,
} from "./helpers/stable-ui";

for (const viewport of RESPONSIVE_VIEWPORTS) {
  test(`homepage layout at ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHomepageUi(page);

    await expect(page.locator(CATEGORY_RAIL_SELECTOR)).toBeVisible();

    const headerBox = await page.locator(HEADER_SELECTOR).first().boundingBox();
    expect(headerBox?.width).toBeGreaterThan(0);
    expect(headerBox?.height).toBeGreaterThan(0);

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      const before = root.scrollLeft;
      root.scrollLeft = before + 8;
      const canScroll = root.scrollLeft !== before;
      root.scrollLeft = before;
      return canScroll;
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
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await waitForHomepageUi(page);
  await page.waitForTimeout(500);

  const unexpected = consoleErrors.filter(
    (line) =>
      !line.includes("401 (Unauthorized)") &&
      !line.includes("Failed to load resource") &&
      !line.includes("Missing required environment variable") &&
      !line.includes("ServiceWorker intercepted") &&
      !line.includes("MIME type") &&
      !line.includes("strict MIME checking"),
  );
  expect(unexpected, unexpected.join("\n")).toEqual([]);
});

test("search page is usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/search?q=phone", { waitUntil: "domcontentloaded" });
  await waitForSearchResultsUi(page);
});

test("listing page renders on tablet", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await waitForHomepageUi(page);

  const featuredLink = page.locator('a[href^="/listing/"]').first();
  if (await featuredLink.count()) {
    const href = await featuredLink.getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(href!, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main").first()).toBeVisible();
  }
});
