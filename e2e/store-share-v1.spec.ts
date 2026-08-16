import { expect, test } from "@playwright/test";

/**
 * Canonical Store Sharing — public /@username store.
 * Uses the existing public profile implementation (rewrite), not a second store page.
 */
test.describe("Store Sharing v1", () => {
  test("opens /@username with Listings selected and Share Store", async ({ page }) => {
    const username =
      process.env.PHASE2_PROFILE_USERNAME?.trim() ||
      process.env.PLAYWRIGHT_PROFILE_USERNAME?.trim() ||
      "rovexo_live_seller";

    const response = await page.goto(`/@${encodeURIComponent(username)}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    if (!response || response.status() >= 400) {
      test.skip(true, "Store handle route unavailable");
    }

    if (await page.locator('[data-store-unavailable="v1.0"]').isVisible().catch(() => false)) {
      test.skip(true, "Public store unavailable");
    }

    /*
     * TEST_FIX_REASON=unscoped data-view-profile matches a hidden duplicate under parallel load
     * ROOT_CAUSE=C TEST LOCATOR — same attribute on two roots; first can be hidden
     * EXPECTED_BEHAVIOR=exactly one visible store root; Share Store sheet still opens
     */
    const storeRoot = page.locator('[data-view-profile="v8.0-your-store"]').locator("visible=true");
    await expect(storeRoot).toHaveCount(1);
    await expect(storeRoot).toBeVisible();
    await expect(page.getByRole("tab", { name: "Listings" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    const shareButton = page.getByRole("button", { name: "Share Store" });
    await expect(shareButton).toBeVisible();
    await shareButton.click();

    const sheet = page.getByRole("dialog", { name: /Share .* Store/i });
    await expect(sheet).toBeVisible();
    /*
     * TEST_FIX_REASON=getByText('@username') also matched the production URL
     * ROOT_CAUSE=the same @handle string appears in https://www.rovexo.co.uk/@username
     * EXPECTED_BEHAVIOR=handle element shows @username; URL is the production store link
     */
    await expect(sheet.locator(".store-share-card__handle")).toHaveText(`@${username}`);
    await expect(sheet.locator(".store-share-card__url")).toHaveText(
      `https://www.rovexo.co.uk/@${username}`,
    );
    await expect(sheet.getByRole("button", { name: "Copy Link" })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "QR Code" })).toBeVisible();

    await sheet.getByRole("button", { name: "QR Code" }).click();
    await expect(sheet.getByRole("img", { name: /QR code for .* ROVEXO store/i })).toBeVisible();
  });
});
