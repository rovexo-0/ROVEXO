import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { FULL_DEMO_ACCOUNTS } from "../lib/full-demo/canonical";
import { signInWithSessionCookies } from "./helpers/auth";
import {
  CATEGORY_RAIL_SELECTOR,
  ALL_LISTINGS_SELECTOR,
  HEADER_SELECTOR,
  waitForDomContentLoaded,
  waitForHomepageUi,
  waitForSearchResultsUi,
} from "./helpers/stable-ui";

const BUYER = FULL_DEMO_ACCOUNTS[0]!;

const criticalRoutes = [
  { path: "/", name: "Homepage", wait: "home" as const, auth: true },
  { path: "/search?q=phone", name: "Search results", wait: "search" as const, auth: false },
  { path: "/categories", name: "Categories", wait: "categories" as const, auth: false },
  { path: "/login", name: "Login", wait: "login" as const, auth: false },
  { path: "/register", name: "Register", wait: "register" as const, auth: false },
];

async function waitForRouteUi(
  page: import("@playwright/test").Page,
  wait: (typeof criticalRoutes)[number]["wait"],
) {
  await waitForDomContentLoaded(page);

  switch (wait) {
    case "home":
      await waitForHomepageUi(page);
      break;
    case "search":
      await waitForSearchResultsUi(page);
      break;
    case "categories":
      await expect(page.getByRole("heading", { name: /all categories/i })).toBeVisible();
      break;
    case "login":
      await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /create account/i })).toBeVisible();
      // Ensure entrance animations finished (opacity:1) before axe contrast checks.
      await expect
        .poll(
          async () =>
            page.locator(".auth-login__register-cta").evaluate((el) => getComputedStyle(el).opacity),
          { timeout: 5_000 },
        )
        .toBe("1");
      break;
    case "register":
      await expect(
        page.getByRole("heading", { name: /join rovexo today|create your account/i }),
      ).toBeVisible();
      break;
  }
}

for (const route of criticalRoutes) {
  test(`WCAG audit: ${route.name}`, async ({ page, browserName, baseURL }) => {
    test.setTimeout(browserName === "firefox" ? 240_000 : 180_000);

    if (route.auth) {
      if (!baseURL) throw new Error("Homepage WCAG audit requires baseURL for demo sign-in.");
      await signInWithSessionCookies(page, {
        email: BUYER.email,
        password: BUYER.password ?? "",
        baseURL,
      });
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await waitForRouteUi(page, route.wait);

    const axe = new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .exclude('[aria-hidden="true"]');

    if (route.path === "/" || route.wait === "search") {
      axe.disableRules(["aria-required-children"]);
    }

    if (route.path === "/") {
      axe.include([
        HEADER_SELECTOR,
        CATEGORY_RAIL_SELECTOR,
        ALL_LISTINGS_SELECTOR,
        '[data-bottom-nav="2026"]',
      ]);
    }

    if (route.wait === "search") {
      axe.exclude('[data-listing-card="rovexo"]');
    }

    const results = await axe.analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
}

test("touch targets meet minimum size on default header actions", async ({ page, baseURL }) => {
  if (!baseURL) throw new Error("Touch-target audit requires baseURL for demo sign-in.");
  await signInWithSessionCookies(page, {
    email: BUYER.email,
    password: BUYER.password ?? "",
    baseURL,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  // Search uses RovexoHeaderV2 — Notifications + Account (Messages removed from v2 header).
  await page.goto("/search?q=phone", { waitUntil: "domcontentloaded" });
  await waitForSearchResultsUi(page);

  const header = page.locator('[data-header-version="rovexo-v2"]').first();
  await expect(header).toBeVisible();

  const notifications = header.getByRole("link", { name: /notifications/i });
  const profile = header.getByRole("link", { name: /account|profile/i }).first();

  for (const target of [notifications, profile]) {
    await expect(target).toBeVisible({ timeout: 15_000 });
    const box = await target.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});

function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
): string {
  if (!violations.length) return "";
  return violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.description}\n  ${violation.nodes
          .slice(0, 3)
          .map((node) => node.target.join(" "))
          .join("\n  ")}`,
    )
    .join("\n\n");
}
