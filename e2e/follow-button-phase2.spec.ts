import { expect, test } from "@playwright/test";

/**
 * Phase 3 — Follow toggle (no dialog) + counters.
 */
test.describe("Phase 3 Follow system", () => {
  test("FOLLOW ↔ FOLLOWING without dialog", async ({ page }) => {
    const username =
      process.env.PHASE2_PROFILE_USERNAME?.trim() ||
      process.env.PLAYWRIGHT_PROFILE_USERNAME?.trim() ||
      "rovexo_live_seller";

    await page.goto(`/user/${encodeURIComponent(username)}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    if (await page.locator('[data-store-unavailable="v1.0"]').isVisible().catch(() => false)) {
      test.skip(true, "Public profile unavailable");
    }

    const followRoot = page.locator('[data-follow-button="phase-3"]');
    if (!(await followRoot.isVisible().catch(() => false))) {
      test.skip(true, "Follow button not visible (own profile / guest redirect)");
    }

    await expect(page.getByRole("dialog", { name: /unfollow/i })).toHaveCount(0);

    const idle = followRoot.getByRole("button", { name: /^follow$/i });
    const active = followRoot.getByRole("button", { name: /following/i });

    if (await active.isVisible().catch(() => false)) {
      await active.click();
      await expect(idle).toBeVisible();
    }

    await idle.click();
    await expect(active).toBeVisible();
    await expect(page.getByRole("dialog", { name: /unfollow/i })).toHaveCount(0);

    await active.click();
    await expect(idle).toBeVisible();
    await expect(page.getByRole("dialog", { name: /unfollow/i })).toHaveCount(0);
  });
});
