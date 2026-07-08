import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  CATEGORY_RAIL_SELECTOR,
  ALL_LISTINGS_SELECTOR,
  HEADER_SELECTOR,
  waitForDomContentLoaded,
  waitForHomepageUi,
  waitForSearchResultsUi,
} from "./helpers/stable-ui";

const criticalRoutes = [
  { path: "/", name: "Homepage", wait: "home" as const },
  { path: "/search?q=phone", name: "Search results", wait: "search" as const },
  { path: "/categories", name: "Categories", wait: "categories" as const },
  { path: "/login", name: "Login", wait: "login" as const },
  { path: "/register", name: "Register", wait: "register" as const },
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
      break;
    case "register":
      await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
      break;
  }
}

for (const route of criticalRoutes) {
  test(`WCAG audit: ${route.name}`, async ({ page, browserName }) => {
    test.setTimeout(browserName === "firefox" ? 240_000 : 180_000);

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

test("touch targets meet minimum size on default header actions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/categories", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /all categories/i })).toBeVisible();

  const header = page.locator(HEADER_SELECTOR).first();
  const messages = header.getByRole("link", { name: "Messages" });
  const notifications = header.getByRole("link", { name: "Notifications" });
  const profile = header.getByRole("link", { name: /account|profile/i }).first();

  for (const target of [messages, notifications, profile]) {
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
