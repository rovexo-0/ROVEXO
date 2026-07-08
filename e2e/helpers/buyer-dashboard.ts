import { expect, type Page } from "@playwright/test";

/** Protocol-required breakpoints for Buyer Dashboard responsive audit. */
export const BUYER_PROTOCOL_VIEWPORTS = [
  { label: "390", width: 390, height: 844 },
  { label: "430", width: 430, height: 844 },
  { label: "768", width: 768, height: 1024 },
  { label: "1024", width: 1024, height: 768 },
  { label: "1280", width: 1280, height: 800 },
  { label: "1440", width: 1440, height: 900 },
] as const;

export async function waitForBuyerDashboardUi(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator(".account-center")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Buying" })).toBeVisible();
    await expect(page.locator(".account-center-tile").filter({ hasText: "Orders" }).first()).toBeVisible();
}

export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  expect(overflow, "buyer dashboard must not scroll horizontally").toBe(false);
}

export async function applyTheme(page: Page, theme: "light" | "dark"): Promise<void> {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((mode) => {
    if (mode === "dark") {
      document.documentElement.dataset.theme = "dark";
      document.documentElement.classList.add("dark");
    } else {
      delete document.documentElement.dataset.theme;
      document.documentElement.classList.remove("dark");
    }
  }, theme);
}
