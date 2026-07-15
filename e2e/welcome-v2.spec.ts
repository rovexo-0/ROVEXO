import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const VIEWPORTS = [
  { name: "iPhone 17 Pro Max", width: 430, height: 932 },
  { name: "Samsung Galaxy S Ultra", width: 412, height: 915 },
  { name: "Desktop", width: 1440, height: 900 },
  { name: "PWA", width: 430, height: 932 },
] as const;

async function openWelcome(page: import("@playwright/test").Page) {
  const response = await page.goto("/welcome", { waitUntil: "networkidle" });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('[data-welcome-lock="CANONICAL-V2"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "The open marketplace for real value." })).toBeVisible();
}

test.describe("Welcome v2.0 release candidate", () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name}: responsive, stable, and overflow-free`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const failedResponses: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => consoleErrors.push(error.message));
      page.on("response", (response) => {
        if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
      });

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openWelcome(page);

      await expect(page.getByRole("link", { name: "Continue" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();

      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        width: document.querySelector<HTMLElement>(".welcome-v2__content")?.getBoundingClientRect().width,
        heroHeight: document.querySelector<HTMLElement>(".welcome-v2__hero")?.getBoundingClientRect().height,
      }));

      expect(metrics.overflow).toBeLessThanOrEqual(0);
      expect(metrics.width).toBeLessThanOrEqual(430);
      expect(metrics.heroHeight).toBeGreaterThanOrEqual(218);
      expect({ consoleErrors, failedResponses }).toEqual({ consoleErrors: [], failedResponses: [] });
    });
  }

  test("Continue and Sign In use canonical auth routes", async ({ page }) => {
    await openWelcome(page);
    await expect(page.getByRole("link", { name: "Continue" })).toHaveAttribute("href", "/register");
    await expect(page.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/login");
  });

  test("passes automated WCAG AA validation", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await openWelcome(page);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("preserves subtle motion and reduced-motion support", async ({ page }) => {
    await openWelcome(page);
    const animationName = await page.locator(".welcome-v2__ring").evaluate(
      (element) => getComputedStyle(element).animationName,
    );
    expect(animationName).toContain("welcome-v2-float");

    await page.emulateMedia({ reducedMotion: "reduce" });
    const reducedAnimation = await page.locator(".welcome-v2__ring").evaluate(
      (element) => getComputedStyle(element).animationName,
    );
    expect(reducedAnimation).toBe("none");
  });

  test("keeps the staged reveal layout-stable", async ({ page }) => {
    await page.addInitScript(() => {
      const state = window as unknown as { __welcomeCLS: number };
      state.__welcomeCLS = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput: boolean; value: number }>) {
          if (!entry.hadRecentInput) state.__welcomeCLS += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    await openWelcome(page);
    await page.waitForTimeout(3_100);
    const cls = await page.evaluate(
      () => (window as unknown as { __welcomeCLS?: number }).__welcomeCLS ?? 0,
    );
    expect(cls).toBeLessThanOrEqual(0.01);
  });

  test("publishes an installable PWA manifest", async ({ page, request }) => {
    await openWelcome(page);
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");

    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBe(true);
    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.start_url).toBe("/splash");
    expect(manifest.display).toMatch(/standalone|fullscreen/);
    expect(manifest.icons?.length).toBeGreaterThan(0);
  });
});
