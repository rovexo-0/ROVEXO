import { expect, test } from "@playwright/test";

/**
 * OAuth RC1 — fail-closed UI on Login / Register.
 * Does not require live IdP enablement: when providers are disabled,
 * buttons must be absent. Facebook must never appear.
 */
test.describe("OAuth RC1 public gating", () => {
  test("login never shows Facebook and only shows enabled providers", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("auth-submit")).toBeVisible();
    await expect(page.getByTestId("oauth-facebook")).toHaveCount(0);
    await expect(page.locator('[data-oauth-provider="facebook"]')).toHaveCount(0);

    const google = page.getByTestId("oauth-google");
    const apple = page.getByTestId("oauth-apple");
    const googleCount = await google.count();
    const appleCount = await apple.count();
    expect(googleCount === 0 || googleCount === 1).toBe(true);
    expect(appleCount === 0 || appleCount === 1).toBe(true);

    if (googleCount === 1) {
      await expect(google).toBeEnabled();
      await expect(google).toContainText(/Google/i);
    }
    if (appleCount === 1) {
      await expect(apple).toBeEnabled();
      await expect(apple).toContainText(/Apple/i);
    }
  });

  test("register never shows Facebook OAuth", async ({ page }) => {
    await page.goto("/register");
    // Certification private mode may redirect to login — either surface is fine.
    const onRegister = page.url().includes("/register");
    if (!onRegister) {
      await expect(page).toHaveURL(/\/login/);
      return;
    }
    await expect(page.getByTestId("oauth-facebook")).toHaveCount(0);
    await expect(page.locator('[data-oauth-provider="facebook"]')).toHaveCount(0);
  });

  test("oauth error query renders owner-safe message", async ({ page }) => {
    await page.goto("/login?error=oauth_provider_unavailable");
    await expect(page.getByText(/temporarily unavailable/i)).toBeVisible();
  });
});
