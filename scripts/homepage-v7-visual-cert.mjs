#!/usr/bin/env node
/**
 * Homepage v7.0 visual certification — multi-viewport screenshots.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = join(process.cwd(), "reports", "module-1", "homepage-v7");

mkdirSync(outDir, { recursive: true });

const VIEWPORTS = [
  { label: "desktop", width: 1440, height: 900 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "android", width: 412, height: 915 },
  { label: "iphone", width: 390, height: 844 },
];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ colorScheme: "light" });

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 120_000 });
    await page.locator('[data-homepage-version="v7.0"]').waitFor({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: join(outDir, `homepage-${vp.label}.png`),
      fullPage: true,
    });
  }

  const card = page.locator('[data-listing-card="rovexo"]').first();
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: join(outDir, "listing-card-closeup.png") });

  const price = await card.locator('[class*="price"]').first().evaluate((el) => {
    const s = getComputedStyle(el);
    return { fontSize: s.fontSize, lineHeight: s.lineHeight, marginTop: s.marginTop };
  });

  console.log("Price computed:", price);
  console.log(`Homepage v7 screenshots: ${outDir}`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
