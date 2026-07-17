import { expect, test } from "@playwright/test";

test.describe("Welcome removed — redirects to Login", () => {
  test("GET /welcome redirects to Login", async ({ page }) => {
    await page.goto("/welcome", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("GET /splash redirects to Login", async ({ page }) => {
    await page.goto("/splash", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("PWA manifest start_url is Homepage", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBeTruthy();
    const manifest = await response.json();
    expect(manifest.start_url).toBe("/");
  });
});
