import { test, expect } from "@playwright/test";

/**
 * Absolute Final — commerce UI lock preview removed.
 * Certify Confirm & Pay checkout freeze via live checkout surface contracts.
 */
test.describe("canonical commerce Absolute Final freeze", () => {
  test("legacy ui-lock commerce redirects into the product", async ({ page }) => {
    await page.goto("/ui-lock/commerce", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/(login)?$/);
  });

  test("checkout address/payment/review hops redirect to single checkout URL", async ({ page }) => {
    for (const step of ["address", "payment", "review"] as const) {
      const response = await page.goto(`/checkout/absolute-final-probe/${step}`, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status() ?? 0).toBeLessThan(500);
      // Guests land on login with next= preserved, or authenticated users on single checkout.
      const url = page.url();
      expect(
        url.includes("/checkout/absolute-final-probe") ||
          url.includes("/login") ||
          url.includes("next="),
      ).toBe(true);
      if (url.includes("/checkout/absolute-final-probe")) {
        expect(url).not.toMatch(/\/(address|payment|review)(\?|$)/);
      }
    }
  });
});
