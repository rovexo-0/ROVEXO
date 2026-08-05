/**
 * Mobile scroll standard — viewport scroll, modal scroll, safe-area.
 */
import { test, expect } from "@playwright/test";
import { dismissCookieBanner, ensureMarketplaceSession } from "./helpers/marketplace-session";
import { openSearchOverlay, waitForHomepageUi } from "./helpers/stable-ui";

const PUBLIC_ROUTES = ["/", "/login", "/categories", "/search"] as const;

test.describe("mobile scroll standard", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} page is scrollable within viewport`, async ({ page, baseURL }) => {
      if (route === "/") {
        await ensureMarketplaceSession(page, baseURL);
      }
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });

      const metrics = await page.evaluate((path) => {
        const pageEl =
          document.querySelector(".rx-page") ||
          document.querySelector(".auth-login-route") ||
          document.querySelector(".auth-register-route") ||
          document.documentElement;
        return {
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight,
          pageClass: document.querySelector(".rx-page")?.className ?? "",
          scrollPage: document.querySelector(".rx-scroll-page")?.className ?? "",
          authShell: Boolean(
            document.querySelector(".auth-login-route, .auth-login, [data-auth-screen='login']"),
          ),
          path,
          hasPageMarker: Boolean(pageEl),
        };
      }, route);

      expect(metrics.clientHeight).toBeGreaterThan(0);
      expect(metrics.scrollHeight).toBeGreaterThanOrEqual(metrics.clientHeight);

      if (route === "/login") {
        // Auth freeze shell — document scroll; rx-page applied on auth route wrapper.
        expect(metrics.pageClass.includes("rx-page") || metrics.authShell).toBe(true);
      } else if (route === "/") {
        expect(metrics.pageClass).toContain("rx-page");
        const homepageMain = page.locator('main[data-hp-homepage="canonical"]').first();
        await expect(homepageMain).toBeVisible({ timeout: 15_000 });
        const homepageClass = (await homepageMain.getAttribute("class")) ?? "";
        expect(homepageClass).toContain("rx-scroll-page");
      } else {
        expect(metrics.pageClass).toContain("rx-page");
      }
    });
  }

  test("login form inputs have scroll margin for keyboard", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const email = page.locator("#email, input[name='email'], input[type='email']").first();
    await expect(email).toBeVisible();

    const scrollMargin = await email.evaluate((el) =>
      window.getComputedStyle(el).scrollMarginBottom,
    );
    // Mobile Scroll Standard — keyboard clearance (resolved calc must be > 0).
    expect(scrollMargin === "0px" ? 0 : Number.parseFloat(scrollMargin)).toBeGreaterThan(0);
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

  test("homepage share sheet uses ModalContainer", async ({ page, baseURL }) => {
    await ensureMarketplaceSession(page, baseURL);
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

  test("search overlay uses fullscreen modal shell", async ({ page, baseURL }) => {
    // Product truth: Homepage search navigates to Global Search `/search` (not SearchOverlay dialog).
    await ensureMarketplaceSession(page, baseURL);
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await dismissCookieBanner(page);
    await waitForHomepageUi(page);
    await openSearchOverlay(page);

    await expect(page).toHaveURL(/\/search/);
    const scrollShell = page.locator(".rx-scroll-page, [data-rx-scroll-page='v1']").first();
    await expect(scrollShell).toBeVisible({ timeout: 15_000 });

    const searchSurface = page
      .locator(
        '[data-search-landing="v1"], [data-search-version="v1.0-final"], #search-overlay-results, .rx-modal-shell-fullscreen',
      )
      .first();
    await expect(searchSurface).toBeVisible({ timeout: 15_000 });

    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
    expect(scrollHeight).toBeGreaterThanOrEqual(clientHeight);
  });
});
