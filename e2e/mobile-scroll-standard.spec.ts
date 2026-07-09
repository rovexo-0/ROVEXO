/**
 * Mobile scroll standard — viewport scroll, modal scroll, safe-area.
 */
import { test, expect } from "@playwright/test";

const PUBLIC_ROUTES = ["/", "/login", "/categories", "/search"];

test.describe("mobile scroll standard", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} page is scrollable within viewport`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });

      const metrics = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        pageClass: document.querySelector(".rx-page")?.className ?? "",
        scrollPage: document.querySelector(".rx-scroll-page")?.className ?? "",
      }));

      expect(metrics.clientHeight).toBeGreaterThan(0);
      expect(metrics.pageClass).toContain("rx-page");
      expect(metrics.scrollHeight).toBeGreaterThanOrEqual(metrics.clientHeight);
      if (route === "/") {
        expect(metrics.scrollPage).toContain("rx-scroll-page");
      }
    });
  }

  test("login form inputs have scroll margin for keyboard", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const email = page.getByLabel(/^email$/i);
    await expect(email).toBeVisible();

    const scrollMargin = await email.evaluate((el) =>
      window.getComputedStyle(el).scrollMarginBottom,
    );
    expect(scrollMargin).not.toBe("0px");
  });

  test("Dialog uses canonical modal scroll panel", async ({ page }) => {
    await page.goto("/ui-lock/commerce", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const dialogTrigger = page.getByRole("button", { name: /open dialog|dialog/i }).first();
    if (!(await dialogTrigger.count())) {
      test.skip(true, "No dialog trigger on commerce ui-lock page");
    }

    await dialogTrigger.click();
    const panel = page.locator(".rx-modal-shell__panel");
    await expect(panel).toBeVisible({ timeout: 10_000 });

    const style = await panel.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        overflowY: computed.overflowY,
        webkitOverflowScrolling: computed.getPropertyValue("-webkit-overflow-scrolling"),
        maxHeight: computed.maxHeight,
      };
    });

    expect(style.overflowY).toBe("auto");
    expect(style.maxHeight).not.toBe("none");
  });

  test("homepage share sheet uses ModalContainer", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const shareButton = page.getByRole("button", { name: /^share$/i }).first();
    if (!(await shareButton.count())) {
      test.skip(true, "No share button on homepage");
    }

    await shareButton.click();
    const shell = page.locator(".rx-modal-shell");
    const shellVisible = await shell.isVisible().catch(() => false);
    if (!shellVisible) {
      test.skip(true, "Native share handled — fallback sheet not shown on this device");
    }

    const panelStyle = await page.locator(".rx-modal-shell__panel").evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        overflowY: computed.overflowY,
        maxHeight: computed.maxHeight,
      };
    });

    expect(panelStyle.overflowY).toBe("auto");
    expect(panelStyle.maxHeight).not.toBe("none");
  });

  test("search overlay uses fullscreen modal shell", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const searchInput = page.getByRole("searchbox").first();
    if (!(await searchInput.count())) {
      test.skip(true, "No search input");
    }

    await searchInput.click();
    const fullscreen = page.locator(".rx-modal-shell-fullscreen");
    await expect(fullscreen).toBeVisible({ timeout: 10_000 });

    const body = page.locator(".rx-modal-shell-fullscreen__body");
    await expect(body).toBeVisible();

    const bodyStyle = await body.evaluate((el) => window.getComputedStyle(el).overflowY);
    expect(bodyStyle).toBe("auto");
  });
});
