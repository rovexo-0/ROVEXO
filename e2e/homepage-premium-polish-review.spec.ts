import { test } from "@playwright/test";
import { join } from "node:path";

const OUT = join(process.cwd(), "owner-review-screenshots", "homepage-polish");

async function setLightTheme(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    document.documentElement.dataset.theme = "light";
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  });
}

async function capture(page: import("@playwright/test").Page, name: string) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-v1-main", { timeout: 30000 });
  await page.waitForSelector(".home-v1-category-tile", { timeout: 15000 });
  await page.waitForSelector('[data-homepage-listing-container="grid"]', { timeout: 15000 });
  await page.waitForTimeout(600);
  await page.screenshot({
    path: join(OUT, `${name}.png`),
    fullPage: true,
    animations: "disabled",
  });
}

test.describe("RovexoHomePage — owner review", () => {
  test("desktop light", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setLightTheme(page);
    await capture(page, "homepage__desktop__light__after");
  });

  test("iphone light", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setLightTheme(page);
    await capture(page, "homepage__iphone__light__after");
  });
});
