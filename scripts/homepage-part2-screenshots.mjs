#!/usr/bin/env node
/**
 * Module 1 Part 2 — Listing card, showcase, feed screenshots.
 * Usage: AUDIT_BASE_URL=http://127.0.0.1:3027 node scripts/homepage-part2-screenshots.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, webkit, devices } from "playwright";

const base = process.env.MODULE2_BASE_URL ?? process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3027";
const reportDir = join(process.cwd(), "reports", "module-1", "homepage-part2");
const beforeDir = join(reportDir, "screenshots", "before");
const afterDir = join(reportDir, "screenshots", "after");
const part1After = join(process.cwd(), "reports", "module-1", "homepage-header-rebuild", "screenshots", "after");

for (const dir of [beforeDir, afterDir]) mkdirSync(dir, { recursive: true });

if (existsSync(part1After)) {
  for (const file of readdirSync(part1After).filter((f) => f.endsWith(".png"))) {
    const target = join(beforeDir, file);
    if (!existsSync(target)) copyFileSync(join(part1After, file), target);
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
    { id: "feed-mobile", width: 390, height: 844 },
    { id: "feed-tablet", width: 768, height: 1024 },
    { id: "feed-desktop", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(2000);

    captures.push({ id: vp.id, file: await shot(page, afterDir, vp.id) });

    const showcase = page.locator(".rx-showcase-v2").first();
    if ((await showcase.count()) > 0) {
      await showcase.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      captures.push({ id: `${vp.id}-showcase`, file: await shot(page, afterDir, `${vp.id}-showcase`, false) });
    }

    const grid = page.locator('[data-homepage-listing-container="grid"]').first();
    if ((await grid.count()) > 0) {
      await grid.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      captures.push({ id: `${vp.id}-grid`, file: await shot(page, afterDir, `${vp.id}-grid`, false) });
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
    captures.push({ id: "android-feed", file: await shot(page, afterDir, "android-feed") });
    await context.close();
  }

  {
    const iphone = devices["iPhone 14"];
    const context = await webkitBrowser.newContext({ ...iphone, colorScheme: "light" });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    captures.push({ id: "iphone-feed", file: await shot(page, afterDir, "iphone-feed") });
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
    captures.push({ id: `feed-${theme}`, file: await shot(page, afterDir, `feed-${theme}`) });
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
