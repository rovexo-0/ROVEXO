#!/usr/bin/env node
/**
 * Homepage V4 — Product Owner rebuild screenshots.
 * Usage: ROVEXO_HOMEPAGE_DEMO=1 AUDIT_BASE_URL=http://127.0.0.1:3030 node scripts/homepage-v4-screenshots.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, webkit, devices } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3030";
const reportDir = join(process.cwd(), "reports", "module-1", "homepage-v4");
const beforeDir = join(reportDir, "screenshots", "before");
const afterDir = join(reportDir, "screenshots", "after");
const v3After = join(process.cwd(), "reports", "module-1", "homepage-v3", "screenshots", "after");

for (const dir of [beforeDir, afterDir]) mkdirSync(dir, { recursive: true });

if (existsSync(v3After)) {
  for (const file of readdirSync(v3After).filter((f) => f.endsWith(".png"))) {
    const target = join(beforeDir, file.replace("v3-", "legacy-"));
    if (!existsSync(target)) copyFileSync(join(v3After, file), target);
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
    { id: "v4-mobile", width: 390, height: 844 },
    { id: "v4-tablet", width: 768, height: 1024 },
    { id: "v4-desktop", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(2000);

    await page.locator(".rx4-topbar").waitFor({ state: "visible", timeout: 15_000 });
    captures.push({ id: `${vp.id}-header`, file: await shot(page, afterDir, `${vp.id}-header`, false) });
    captures.push({ id: vp.id, file: await shot(page, afterDir, vp.id) });

    for (const [suffix, selector] of [
      ["search", '[data-header-search="field"]'],
      ["categories", 'nav[aria-label="Categories"]'],
      ["import", 'section[aria-label="Bring your item"]'],
      ["showcase", ".rx4-showcase"],
      ["featured", ".rx4-featured"],
      ["feed", '[data-homepage-listing-container="grid"]'],
    ]) {
      const el = page.locator(selector).first();
      if ((await el.count()) > 0) {
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        captures.push({ id: `${vp.id}-${suffix}`, file: await shot(page, afterDir, `${vp.id}-${suffix}`, false) });
      }
    }

    await context.close();
  }

  {
    const pixel = devices["Pixel 7"];
    const ctx = await browser.newContext({ viewport: pixel.viewport, userAgent: pixel.userAgent });
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    captures.push({ id: "android-v4", file: await shot(page, afterDir, "android-v4") });
    await ctx.close();
  }

  {
    const iphone = devices["iPhone 14"];
    const ctx = await webkitBrowser.newContext({ ...iphone, colorScheme: "light" });
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    captures.push({ id: "iphone-v4", file: await shot(page, afterDir, "iphone-v4") });
    await ctx.close();
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
