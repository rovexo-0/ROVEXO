import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { settleUi, waitForHomepageUi } from "./helpers/stable-ui";

const OUT = join(process.cwd(), "owner-review-screenshots", "brand");
const PAGES_DIR = join(OUT, "pages");

const DEVICES = [
  { id: "desktop", width: 1920, height: 1080 },
  { id: "laptop", width: 1440, height: 900 },
  { id: "tablet", width: 768, height: 1024 },
  { id: "iphone", width: 390, height: 844 },
  { id: "android", width: 412, height: 915 },
] as const;

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  mkdirSync(PAGES_DIR, { recursive: true });
});

test("brand assets exist on disk", async () => {
  const { existsSync } = await import("node:fs");
  const required = [
    "public/favicon.ico",
    "public/favicon.svg",
    "public/icons/icon-192.png",
    "public/icons/icon-512.png",
    "public/icons/icon-maskable-512.png",
    "public/brand/og-image.png",
    "mobile/ios/AppIcon.appiconset/icon-1024.png",
    "mobile/android/mipmap-xxxhdpi/ic_launcher.png",
    "mobile/android/mipmap-xxxhdpi/ic_launcher_foreground.png",
    "mobile/android/mipmap-xxxhdpi/ic_launcher_background.png",
    "mobile/android/mipmap-xxxhdpi/ic_launcher_monochrome.png",
  ];
  for (const file of required) {
    expect(existsSync(join(process.cwd(), file)), file).toBeTruthy();
  }
});

for (const device of DEVICES) {
  test(`brand review — header logo — ${device.id}`, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Brand review uses Chromium only");

    await page.setViewportSize({ width: device.width, height: device.height });
    await page.addInitScript(() => {
      document.documentElement.dataset.theme = "light";
      document.documentElement.classList.remove("dark");
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHomepageUi(page);
    await settleUi(page, 400);

    await page.screenshot({
      path: join(PAGES_DIR, `homepage-header__${device.id}__light.png`),
      fullPage: false,
      clip: { x: 0, y: 0, width: device.width, height: Math.min(device.height, 220) },
    });

    // Logo mark: use search route (RovexoHeaderV2) — categories still uses legacy header chrome.
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-header-version="rovexo-v2"]').first()).toBeVisible();
    await settleUi(page, 400);

    const mark = page.getByRole("link", { name: "ROVEXO Home" });
    await expect(mark).toBeVisible();
    await mark.screenshot({ path: join(PAGES_DIR, `header-logo__${device.id}__light.png`) });
  });
}

test.afterAll(() => {
  writeFileSync(
    join(OUT, "manifest.json"),
    JSON.stringify(
      DEVICES.flatMap((device) => [
        { file: `pages/header-logo__${device.id}__light.png`, device: device.id, kind: "header-logo" },
        { file: `pages/homepage-header__${device.id}__light.png`, device: device.id, kind: "homepage-header" },
      ]),
      null,
      2,
    ),
  );
});
