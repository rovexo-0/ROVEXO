import { test, expect, type Page } from "@playwright/test";

import { mkdirSync, writeFileSync } from "node:fs";

import { join } from "node:path";

import { settleUi, waitForHomepageUi } from "./helpers/stable-ui";



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

  { id: "hero", label: "Hero", crop: "hero" as const },

  { id: "featured", label: "Featured Listings", crop: "featured" as const },

  { id: "auctions", label: "Popular Auctions", crop: "auctions" as const },

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

      } else if (section.crop === "hero") {

        const hero = page.locator(".import-rx-hero-banner").first();

        await expect(hero).toBeVisible();

        await hero.screenshot({ path: filePath });

      } else if (section.crop === "featured") {

        const featured = page.locator('section[aria-labelledby="featured-heading"]');

        await featured.scrollIntoViewIfNeeded();

        await expect(page.getByRole("heading", { name: /featured listings/i })).toBeVisible();

        await featured.screenshot({ path: filePath });

      } else {

        const auctions = page.locator("#auctions-heading").locator("..");

        await auctions.scrollIntoViewIfNeeded();

        await expect(page.getByRole("heading", { name: /popular auctions/i })).toBeVisible();

        await auctions.screenshot({ path: filePath });

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

