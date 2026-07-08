#!/usr/bin/env node
/**
 * Homepage V3.0 — complete UI rebuild screenshots.
 * Usage: ROVEXO_HOMEPAGE_DEMO=1 AUDIT_BASE_URL=http://127.0.0.1:3029 node scripts/homepage-v3-screenshots.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, webkit, devices } from "playwright";

const base = process.env.MODULE2_BASE_URL ?? process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3029";
const reportDir = join(process.cwd(), "reports", "module-1", "homepage-v3");
const beforeDir = join(reportDir, "screenshots", "before");
const afterDir = join(reportDir, "screenshots", "after");
const part2After = join(process.cwd(), "reports", "module-1", "homepage-part2", "screenshots", "after");

for (const dir of [beforeDir, afterDir]) mkdirSync(dir, { recursive: true });

if (existsSync(part2After)) {
  for (const file of readdirSync(part2After).filter((f) => f.endsWith(".png"))) {
    const target = join(beforeDir, file);
    if (!existsSync(target)) copyFileSync(join(part2After, file), target);
  }
}

async function shot(page, dir, name, fullPage = true) {
  const file = join(dir, `${name}.png`);
  await page.screenshot({ path: file, fullPage });
  return file;
}

async function main() {
  const browser = await chromium.launch();
  const webkitBrowser = await webkit.launch();
  const captures = [];

  const viewports = [
    { id: "v3-mobile", width: 390, height: 844 },
    { id: "v3-tablet", width: 768, height: 1024 },
    { id: "v3-desktop", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(2000);

    const header = page.locator(".hp3-header");
    await header.waitFor({ state: "visible", timeout: 15_000 });
    captures.push({ id: `${vp.id}-header`, file: await shot(page, afterDir, `${vp.id}-header`, false) });
    captures.push({ id: vp.id, file: await shot(page, afterDir, vp.id) });

    const search = page.locator('[data-header-search="field"]');
    if ((await search.count()) > 0) {
      await search.scrollIntoViewIfNeeded();
      captures.push({ id: `${vp.id}-search`, file: await shot(page, afterDir, `${vp.id}-search`, false) });
    }

    const categories = page.locator('nav[aria-label="Categories"]');
    if ((await categories.count()) > 0) {
      await categories.scrollIntoViewIfNeeded();
      captures.push({ id: `${vp.id}-categories`, file: await shot(page, afterDir, `${vp.id}-categories`, false) });
    }

    const showcase = page.locator(".hp3-showcase").first();
    if ((await showcase.count()) > 0) {
      await showcase.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      captures.push({ id: `${vp.id}-showcase`, file: await shot(page, afterDir, `${vp.id}-showcase`, false) });
    }

    const rail = page.locator("#hp3-featured").first();
    if ((await rail.count()) > 0) {
      await rail.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      captures.push({ id: `${vp.id}-featured`, file: await shot(page, afterDir, `${vp.id}-featured`, false) });
    }

    const grid = page.locator('[data-homepage-listing-container="grid"]').first();
    if ((await grid.count()) > 0) {
      await grid.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      captures.push({ id: `${vp.id}-feed`, file: await shot(page, afterDir, `${vp.id}-feed`, false) });
    }

    const card = page.locator('[data-listing-card="rovexo"]').first();
    if ((await card.count()) > 0) {
      captures.push({ id: `${vp.id}-card`, file: await shot(page, afterDir, `${vp.id}-card`, false) });
    }

    await context.close();
  }

  {
    const pixel = devices["Pixel 7"];
    const context = await browser.newContext({ viewport: pixel.viewport, userAgent: pixel.userAgent });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    captures.push({ id: "android-v3", file: await shot(page, afterDir, "android-v3") });
    await context.close();
  }

  {
    const iphone = devices["iPhone 14"];
    const context = await webkitBrowser.newContext({ ...iphone, colorScheme: "light" });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    captures.push({ id: "iphone-v3", file: await shot(page, afterDir, "iphone-v3") });
    await context.close();
  }

  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: theme === "dark" ? "dark" : "light",
    });
    const page = await context.newPage();
    await page.addInitScript((mode) => {
      localStorage.setItem("rovexo-theme", mode);
      document.documentElement.setAttribute("data-theme", mode);
    }, theme);
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    captures.push({ id: `v3-${theme}`, file: await shot(page, afterDir, `v3-${theme}`) });
    await context.close();
  }

  await browser.close();
  await webkitBrowser.close();

  console.log(`Before → ${beforeDir}`);
  console.log(`After  → ${afterDir}`);
  for (const c of captures) console.log(`  ${c.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
