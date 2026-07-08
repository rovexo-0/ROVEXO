#!/usr/bin/env node
/** Homepage V5 critical fix pass — screenshots */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, webkit, devices } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const reportDir = join(process.cwd(), "reports", "module-1", "homepage-v5");
const beforeDir = join(reportDir, "screenshots", "before");
const afterDir = join(reportDir, "screenshots", "after");
const priorAfter = join(process.cwd(), "reports", "module-1", "homepage-simplify", "screenshots", "after");

for (const dir of [beforeDir, afterDir]) mkdirSync(dir, { recursive: true });

if (existsSync(priorAfter)) {
  for (const file of readdirSync(priorAfter).filter((f) => f.endsWith(".png"))) {
    const target = join(beforeDir, file);
    if (!existsSync(target)) copyFileSync(join(priorAfter, file), target);
  }
}

async function shot(page, dir, name, fullPage = true) {
  await page.screenshot({ path: join(dir, `${name}.png`), fullPage });
}

async function main() {
  const browser = await chromium.launch();
  const webkitBrowser = await webkit.launch();

  const viewports = [
    { id: "v5-mobile-light", width: 390, height: 844, colorScheme: "light" },
    { id: "v5-mobile-dark", width: 390, height: 844, colorScheme: "dark" },
    { id: "v5-tablet", width: 768, height: 1024, colorScheme: "light" },
    { id: "v5-desktop", width: 1440, height: 900, colorScheme: "light" },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: vp.colorScheme ?? "light",
    });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(2000);
    await page.locator('[data-homepage-version="v5.0"]').waitFor({ timeout: 15_000 });
    await shot(page, afterDir, vp.id);
    for (const [suffix, sel] of [
      ["header", '[data-header-version="rovexo-v2"]'],
      ["search", ".rx-h2-search .homepage-search__control"],
      ["categories", ".rx4-cats__chip"],
      ["feed", '[data-listing-card="rovexo"]'],
    ]) {
      const el = page.locator(sel).first();
      if ((await el.count()) > 0) {
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        await shot(page, afterDir, `${vp.id}-${suffix}`, false);
      }
    }
    await context.close();
  }

  for (const [id, device] of [
    ["android-v5", devices["Pixel 7"]],
    ["iphone-v5", devices["iPhone 14"]],
  ]) {
    const ctx =
      id === "iphone-v5"
        ? await webkitBrowser.newContext({ ...device, colorScheme: "light" })
        : await browser.newContext({ viewport: device.viewport, userAgent: device.userAgent });
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await shot(page, afterDir, id);
    await ctx.close();
  }

  await browser.close();
  await webkitBrowser.close();
  console.log(`Screenshots saved to ${afterDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
