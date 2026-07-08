#!/usr/bin/env node
/** Homepage V4.1 visual correction screenshots */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, webkit, devices } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3031";
const reportDir = join(process.cwd(), "reports", "module-1", "homepage-v4.1");
const beforeDir = join(reportDir, "screenshots", "before");
const afterDir = join(reportDir, "screenshots", "after");
const v4After = join(process.cwd(), "reports", "module-1", "homepage-v4", "screenshots", "after");

for (const dir of [beforeDir, afterDir]) mkdirSync(dir, { recursive: true });

if (existsSync(v4After)) {
  for (const file of readdirSync(v4After).filter((f) => f.endsWith(".png"))) {
    const target = join(beforeDir, file);
    if (!existsSync(target)) copyFileSync(join(v4After, file), target);
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
    { id: "v41-mobile", width: 390, height: 844 },
    { id: "v41-tablet", width: 768, height: 1024 },
    { id: "v41-desktop", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(2000);
    await page.locator('[data-homepage-version="v4.1"]').waitFor({ timeout: 15_000 });
    await shot(page, afterDir, vp.id);
    for (const [suffix, sel] of [
      ["header", ".rx4-topbar"],
      ["search", '[data-header-search="field"]'],
      ["categories", ".rx4-cats__chip"],
      ["import", ".rx4-import"],
      ["showcase", ".rx4-showcase"],
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
    ["android-v41", devices["Pixel 7"]],
    ["iphone-v41", devices["iPhone 14"]],
  ]) {
    const ctx =
      id === "iphone-v41"
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
  console.log(`V4.1 screenshots → ${afterDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
