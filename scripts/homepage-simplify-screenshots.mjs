#!/usr/bin/env node
/** Homepage V4.2 — Header V2 + Listing Card V2 screenshots */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, webkit, devices } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3032";
const reportDir = join(process.cwd(), "reports", "module-1", "homepage-simplify");
const beforeDir = join(reportDir, "screenshots", "before");
const afterDir = join(reportDir, "screenshots", "after");
const v41After = join(process.cwd(), "reports", "module-1", "homepage-v4.1", "screenshots", "after");

for (const dir of [beforeDir, afterDir]) mkdirSync(dir, { recursive: true });

if (existsSync(v41After)) {
  for (const file of readdirSync(v41After).filter((f) => f.endsWith(".png"))) {
    const target = join(beforeDir, file);
    if (!existsSync(target)) copyFileSync(join(v41After, file), target);
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

  const viewports = [
    { id: "v42-mobile-light", width: 390, height: 844, colorScheme: "light" },
    { id: "v42-mobile-dark", width: 390, height: 844, colorScheme: "dark" },
    { id: "v42-tablet", width: 768, height: 1024, colorScheme: "light" },
    { id: "v42-desktop", width: 1440, height: 900, colorScheme: "light" },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: vp.colorScheme ?? "light",
    });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(2000);
    await page.locator('[data-homepage-version="v4.2"]').waitFor({ timeout: 15_000 });
    await shot(page, afterDir, vp.id);
    for (const [suffix, sel] of [
      ["header", '[data-header-version="rovexo-v2"]'],
      ["search", ".rx-h2-search .homepage-search__control"],
      ["categories", ".rx4-cats__chip"],
      ["byi", ".rx4-import"],
      ["featured-seller", ".rx-fs"],
      ["featured", ".rx4-featured"],
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
    ["android-v42", devices["Pixel 7"]],
    ["iphone-v42", devices["iPhone 14"]],
  ]) {
    const ctx =
      id === "iphone-v42"
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
