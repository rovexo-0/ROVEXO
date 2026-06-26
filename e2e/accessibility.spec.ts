import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const criticalRoutes = [
  { path: "/", name: "Homepage" },
  { path: "/search?q=phone", name: "Search results" },
  { path: "/categories", name: "Categories" },
  { path: "/login", name: "Login" },
  { path: "/register", name: "Register" },
];

for (const route of criticalRoutes) {
  test(`WCAG audit: ${route.name}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route.path);
    await page.waitForLoadState(route.path.startsWith("/search") ? "domcontentloaded" : "networkidle");

    const axe = new AxeBuilder({ page }).withTags([
      "wcag2a",
      "wcag2aa",
      "wcag21a",
      "wcag21aa",
    ]);

    // Listing carousels use group + labelled cards; axe list/children rules false-positive on SSR markup.
    if (route.path === "/") {
      axe.disableRules(["aria-required-children"]);
    }

    const results = await axe.analyze();

    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
}

test("touch targets meet minimum size on homepage header actions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const header = page.locator('[data-header-version="premium-2026"]');
  const messages = header.getByRole("link", { name: "Messages" });
  const notifications = header.getByRole("link", { name: "Notifications" });
  const account = header.getByRole("link", { name: "Account" });

  for (const target of [messages, notifications, account]) {
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
