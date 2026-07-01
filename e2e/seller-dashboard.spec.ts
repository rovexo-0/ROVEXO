import { test, expect } from "@playwright/test";

test.describe("Seller Dashboard v1.0", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/seller", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("legacy /seller/dashboard redirects unauthenticated users to login with next param", async ({ page }) => {
    await page.goto("/seller/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/next=%2Fseller%2Fdashboard/);
  });
});
