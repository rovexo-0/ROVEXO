import { test, expect } from "@playwright/test";

const HYDRATION_PATTERNS = [
  /hydration failed/i,
  /hydration mismatch/i,
  /did not match/i,
  /Encountered a script tag while rendering React component/i,
];

function attachConsoleGuards(page: import("@playwright/test").Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    errors.push(message.text());
  });

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return errors;
}

function assertCleanConsole(errors: string[]) {
  const hydrationErrors = errors.filter((entry) =>
    HYDRATION_PATTERNS.some((pattern) => pattern.test(entry)),
  );
  expect(hydrationErrors, hydrationErrors.join("\n")).toEqual([]);
}

test.describe("SSR / hydration stabilization", () => {
  test("login shell renders without hydration or script-tree errors", async ({ page }) => {
    const errors = attachConsoleGuards(page);

    await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible({ timeout: 30_000 });

    assertCleanConsole(errors);
  });

  test("sell auth redirect renders without hydration errors", async ({ page }) => {
    const errors = attachConsoleGuards(page);

    await page.goto("/sell", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });

    assertCleanConsole(errors);
  });

  test("homepage renders without hydration errors", async ({ page }) => {
    const errors = attachConsoleGuards(page);

    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator("body")).toBeVisible();

    assertCleanConsole(errors);
  });

  test("homepage renders without hydration errors on mobile viewport", async ({ page }) => {
    const errors = attachConsoleGuards(page);

    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator("body")).toBeVisible();

    assertCleanConsole(errors);
  });
});
