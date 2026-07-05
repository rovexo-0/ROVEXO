import { test, expect } from "@playwright/test";

const PROTECTED_SUPER_ADMIN_PAGES = [
  "/super-admin",
  "/super-admin/database",
  "/super-admin/command",
  "/super-admin/users",
  "/super-admin/moderation",
  "/super-admin/orders-engine",
  "/super-admin/orders",
  "/super-admin/payments",
  "/super-admin/listings",
];

const PROTECTED_SUPER_ADMIN_APIS = [
  "/api/super-admin/command-center",
  "/api/super-admin/database",
  "/api/super-admin/development/database",
];

test.describe("Super Admin Command Center", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    for (const path of PROTECTED_SUPER_ADMIN_PAGES) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("protects super-admin APIs when unauthenticated", async ({ request }) => {
    test.setTimeout(120_000);

    for (const path of PROTECTED_SUPER_ADMIN_APIS) {
      const response = await request.get(path, { timeout: 90_000 });
      expect([401, 403]).toContain(response.status());
    }
  });

  test("database command center page exists", async ({ page }) => {
    const response = await page.goto("/super-admin/database", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login/);
  });
});
