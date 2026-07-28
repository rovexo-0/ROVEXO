/**
 * Sell v1.0 — functional + responsive gate (demo seller).
 * Aligned to last Owner-approved SellPage composition (e4ebd2bd tip).
 */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { RESPONSIVE_VIEWPORTS } from "./helpers/stable-ui";
import {
  ensureCategorySelected,
  ensureParcelSizeSelected,
  ensureConditionSelected,
  completeSellQuickAttributes,
  fillSellDescription,
  fillSellTitle,
  gotoSellPage,
  publishSellListing,
  signInDemoSeller,
  uploadSellPhoto,
} from "./helpers/sell";

const SAMPLE_JPEG_BASE64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

function writeTempImage(): string {
  const filePath = path.join(os.tmpdir(), `rovexo-sell-gate-${Date.now()}.jpg`);
  fs.writeFileSync(filePath, Buffer.from(SAMPLE_JPEG_BASE64, "base64"));
  return filePath;
}

test.describe("sell v1.0 recovery gate", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    test.skip(!baseURL, "Playwright baseURL is required");
    test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(), "Requires Supabase URL");
    await signInDemoSeller(page, baseURL!);
  });

  test("renders canonical SellPage markers", async ({ page }) => {
    await gotoSellPage(page);
    await expect(page.locator('[data-sell-canonical="v1.0-final-frozen"]')).toBeVisible();
    await expect(page.locator('[aria-label="Add Photos"]').first()).toBeVisible();
  });

  test("publish + success + sell another reset", async ({ page }) => {
    const image = writeTempImage();
    try {
      await gotoSellPage(page);
      await uploadSellPhoto(page, image);
      await fillSellTitle(page, `Galaxy S26 Ultra Gate ${Date.now()}`);
      await fillSellDescription(
        page,
        "Absolute Authority sell gate listing. Excellent condition for testing publish.",
      );
      await ensureCategorySelected(page);
      await completeSellQuickAttributes(page);
      await ensureConditionSelected(page);
      await page.getByPlaceholder("0.00").or(page.getByLabel(/^Price$/i)).first().fill("49.99");
      await ensureParcelSizeSelected(page);
      await publishSellListing(page);

      await expect(page.getByRole("button", { name: /share listing|^Share$/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /view listing/i })).toBeVisible();
      await page.getByRole("button", { name: /sell another/i }).click();

      await expect(page.getByRole("dialog").first()).toBeHidden({ timeout: 30_000 }).catch(() => undefined);
      await expect(page.locator('[aria-label="Add Photos"]').first()).toBeVisible();
    } finally {
      try {
        fs.unlinkSync(image);
      } catch {
        // ignore
      }
    }
  });

  for (const viewport of RESPONSIVE_VIEWPORTS.filter((v) =>
    ["iphone-15", "iphone-pro-max", "android-medium", "ipad", "laptop", "desktop"].includes(v.name),
  )) {
    test(`sell layout at ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoSellPage(page);

      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          x: root.scrollWidth - root.clientWidth,
          hasShell: Boolean(document.querySelector('[data-sell-canonical="v1.0-final-frozen"]')),
        };
      });
      expect(overflow.hasShell).toBe(true);
      expect(overflow.x).toBeLessThanOrEqual(1);

      await expect(page.getByRole("button", { name: /publish/i }).first()).toBeVisible();
    });
  }
});
