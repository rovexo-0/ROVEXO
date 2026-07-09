import { test, expect, type Page } from "@playwright/test";

import { mkdirSync, writeFileSync } from "node:fs";

import { join } from "node:path";

import {
  ALL_LISTINGS_SELECTOR,
  CATEGORY_RAIL_SELECTOR,
  settleUi,
  waitForHomepageUi,
} from "./helpers/stable-ui";

const OUT = join(process.cwd(), "owner-review-screenshots", "homepage-final");

const PAGES_DIR = join(OUT, "pages");

type Device = { id: string; label: string; width: number; height: number };

const DEVICES: Device[] = [
  { id: "desktop", label: "Desktop", width: 1920, height: 1080 },
  { id: "laptop", label: "Laptop", width: 1440, height: 900 },
  { id: "tablet", label: "Tablet", width: 768, height: 1024 },
  { id: "iphone", label: "iPhone", width: 390, height: 844 },
  { id: "android", label: "Android", width: 412, height: 915 },
];

const SECTIONS = [
  { id: "homepage", label: "Homepage", crop: "full" as const },
  { id: "categories", label: "Category Rail", crop: "categories" as const },
  { id: "all-listings", label: "Listing Grid", crop: "listing-section" as const },
] as const;

type ManifestEntry = {
  file: string;
  id: string;
  label: string;
  device: string;
  deviceLabel: string;
  theme: "light";
};

const manifest: ManifestEntry[] = [];

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  mkdirSync(PAGES_DIR, { recursive: true });
});

test.afterAll(() => {
  writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
});

async function prepare(page: Page, device: Device) {
  await page.setViewportSize({ width: device.width, height: device.height });
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    document.documentElement.dataset.theme = "light";
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  });
}

for (const section of SECTIONS) {
  for (const device of DEVICES) {
    test(`homepage-final — ${section.label} — ${device.label} — light`, async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Homepage final review uses Chromium only");

      const filename = `${section.id}__${device.id}__light.png`;
      const filePath = join(PAGES_DIR, filename);

      await prepare(page, device);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await waitForHomepageUi(page);
      await settleUi(page, 600);

      if (section.crop === "full") {
        await page.screenshot({ path: filePath, fullPage: true, animations: "disabled", caret: "hide" });
      } else if (section.crop === "categories") {
        const rail = page.locator(CATEGORY_RAIL_SELECTOR).first();
        await expect(rail).toBeVisible();
        await rail.screenshot({ path: filePath });
      } else if (section.crop === "listing-section") {
        const block = page.locator(ALL_LISTINGS_SELECTOR).first();
        await block.scrollIntoViewIfNeeded();
        await expect(block).toBeVisible();
        await block.screenshot({ path: filePath });
      } else if (section.crop === "business") {
        const block = page.locator('section[aria-labelledby="businesses-heading"]');
        await block.scrollIntoViewIfNeeded();
        await expect(page.getByRole("heading", { name: /^businesses$/i })).toBeVisible();
        await block.screenshot({ path: filePath });
      }

      manifest.push({
        file: `pages/${filename}`,
        id: section.id,
        label: section.label,
        device: device.id,
        deviceLabel: device.label,
        theme: "light",
      });
    });
  }
}
