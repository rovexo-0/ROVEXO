import { test, expect } from "@playwright/test";

test.describe("Google Analytics 4", () => {
  test("loads gtag script and measurement ID in production build", async ({ page }) => {
    const gaRequests: string[] = [];

    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("googletagmanager.com") || url.includes("google-analytics.com")) {
        gaRequests.push(url);
      }
    });

    const response = await page.goto("/does-not-exist", { waitUntil: "domcontentloaded", timeout: 30_000 });
    expect(response?.status()).toBe(404);

    const html = await page.content();
    const isProductionBuild = process.env.NODE_ENV === "production";

    if (isProductionBuild) {
      expect(html).toContain("G-RNEMD5BT0S");
      await expect
        .poll(() => gaRequests.some((url) => url.includes("googletagmanager.com/gtag/js")), {
          timeout: 15_000,
        })
        .toBe(true);
    } else {
      test.skip(true, "GA loads in production only unless NEXT_PUBLIC_GA_DEBUG=true");
    }
  });
});
