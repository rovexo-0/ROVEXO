#!/usr/bin/env node
/**
 * Module 1 Part 1 — Homepage Header rebuild screenshots.
 * Usage: AUDIT_BASE_URL=http://127.0.0.1:3025 node scripts/homepage-header-rebuild-screenshots.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, webkit, devices } from "playwright";

const base = process.env.MODULE2_BASE_URL ?? process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3025";
const reportDir = join(process.cwd(), "reports", "module-1", "homepage-header-rebuild");
const beforeDir = join(reportDir, "screenshots", "before");
const afterDir = join(reportDir, "screenshots", "after");
const legacyDir = join(process.cwd(), "reports", "module-2", "ui-polish", "screenshots");

for (const dir of [beforeDir, afterDir]) mkdirSync(dir, { recursive: true });

if (existsSync(legacyDir)) {
  for (const file of readdirSync(legacyDir).filter((f) => f.endsWith(".png"))) {
    const target = join(beforeDir, file);
    if (!existsSync(target)) {
      copyFileSync(join(legacyDir, file), target);
    }
  }
}

async function shot(page, dir, name) {
  const file = join(dir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function captureSet(browser, webkitBrowser) {
  const captures = [];

  const viewports = [
    { id: "header-mobile", label: "header-mobile", width: 390, height: 844 },
    { id: "header-tablet", label: "header-tablet", width: 768, height: 1024 },
    { id: "header-desktop", label: "header-desktop", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(1500);

    const header = page.locator(".homepage-header");
    await header.waitFor({ state: "visible", timeout: 15_000 });
    captures.push({ id: vp.id, file: await shot(page, afterDir, vp.id) });

    const search = page.locator('[data-header-search="field"]');
    if ((await search.count()) > 0) {
      captures.push({ id: `${vp.id}-search`, file: await shot(page, afterDir, `${vp.id}-search`) });
      await search.click();
      await page.waitForTimeout(400);
      captures.push({
        id: `${vp.id}-search-focus`,
        file: await shot(page, afterDir, `${vp.id}-search-focus`),
      });
    }

    const categories = page.locator('section[aria-label="Categories"]');
    if ((await categories.count()) > 0) {
      captures.push({
        id: `${vp.id}-categories`,
        file: await shot(page, afterDir, `${vp.id}-categories`),
      });
    }

    await context.close();
  }

  const pixel = devices["Pixel 7"];
  {
    const context = await browser.newContext({
      viewport: pixel.viewport,
      userAgent: pixel.userAgent,
    });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    captures.push({ id: "android-header", file: await shot(page, afterDir, "android-header") });
    await context.close();
  }

  {
    const iphone = devices["iPhone 14"];
    const context = await webkitBrowser.newContext({ ...iphone, colorScheme: "light" });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    captures.push({ id: "iphone-header", file: await shot(page, afterDir, "iphone-header") });
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
    await page.waitForTimeout(1500);
    captures.push({
      id: `header-${theme}`,
      file: await shot(page, afterDir, `header-${theme}`),
    });
    await context.close();
  }

  return captures;
}

async function main() {
  const browser = await chromium.launch();
  const webkitBrowser = await webkit.launch();

  let captures = [];
  try {
    captures = await captureSet(browser, webkitBrowser);
  } catch (error) {
    console.error("Screenshot capture failed:", error.message);
    console.error("Ensure the dev server is running at", base);
    process.exitCode = 1;
  } finally {
    await browser.close();
    await webkitBrowser.close();
  }

  console.log(`Before screenshots → ${beforeDir}`);
  console.log(`After screenshots  → ${afterDir}`);
  for (const c of captures) console.log(`  ${c.id}`);
}

main();
