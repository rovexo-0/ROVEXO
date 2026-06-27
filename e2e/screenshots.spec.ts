import { test } from "@playwright/test";
import {
  captureSafely,
  captureViewportScreenshot,
  openSearchOverlay,
  RESPONSIVE_VIEWPORTS,
  screenshotPath,
  settleUi,
  waitForHeroCarousel,
  waitForHomepageUi,
  waitForSearchEmptyState,
  waitForSearchOverlayUi,
  waitForSearchResultsUi,
  waitForSearchSuggestions,
} from "./helpers/stable-ui";

test.describe.configure({ mode: "serial" });

for (const viewport of RESPONSIVE_VIEWPORTS) {
  test.describe(`screenshots — ${viewport.label}`, () => {
    test.describe.configure({ mode: "serial" });

    test.beforeEach(async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Screenshots are captured on Chromium only");
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
    });

    test("homepage", async ({ page }) => {
      await captureSafely(`${viewport.name} homepage`, screenshotPath("screenshots", `${viewport.name}-homepage.png`), async () => {
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await waitForHomepageUi(page);
        await waitForHeroCarousel(page);
        await settleUi(page);
        await captureViewportScreenshot(page, screenshotPath("screenshots", `${viewport.name}-homepage.png`));
      });
    });

    test("search overlay idle", async ({ page }) => {
      await captureSafely(
        `${viewport.name} search idle`,
        screenshotPath("screenshots", `${viewport.name}-search-idle.png`),
        async () => {
          await page.goto("/", { waitUntil: "domcontentloaded" });
          await waitForHomepageUi(page);
          await openSearchOverlay(page);
          await settleUi(page);
          await captureViewportScreenshot(page, screenshotPath("screenshots", `${viewport.name}-search-idle.png`));
        },
      );
    });

    test("search suggestions", async ({ page }) => {
      await captureSafely(
        `${viewport.name} search suggestions`,
        screenshotPath("screenshots", `${viewport.name}-search-suggestions.png`),
        async () => {
          await page.goto("/", { waitUntil: "domcontentloaded" });
          await waitForHomepageUi(page);
          await openSearchOverlay(page);
          await waitForSearchSuggestions(page, "iphone");
          await settleUi(page);
          await captureViewportScreenshot(
            page,
            screenshotPath("screenshots", `${viewport.name}-search-suggestions.png`),
          );
        },
      );
    });

    test("search results", async ({ page }) => {
      await captureSafely(
        `${viewport.name} search results`,
        screenshotPath("screenshots", `${viewport.name}-search-results.png`),
        async () => {
          await page.goto("/search?q=phone", { waitUntil: "domcontentloaded" });
          await waitForSearchResultsUi(page);
          await settleUi(page);
          await captureViewportScreenshot(page, screenshotPath("screenshots", `${viewport.name}-search-results.png`));
        },
      );
    });

    test("search empty state", async ({ page }) => {
      await captureSafely(
        `${viewport.name} search empty`,
        screenshotPath("screenshots", `${viewport.name}-search-empty.png`),
        async () => {
          await page.goto("/search?q=__rovexo_e2e_no_match__", { waitUntil: "domcontentloaded" });
          await waitForSearchEmptyState(page);
          await settleUi(page);
          await captureViewportScreenshot(page, screenshotPath("screenshots", `${viewport.name}-search-empty.png`));
        },
      );
    });
  });
}

test("search overlay opens from search route", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Screenshots are captured on Chromium only");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/search", { waitUntil: "domcontentloaded" });
  await waitForSearchOverlayUi(page);
});
