#!/usr/bin/env node
/** Capture Homepage Stores section screenshots from localhost. */
import { existsSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = join(process.cwd(), "reports", "module-2", "homepage-stores");

mkdirSync(outDir, { recursive: true });

const shots = [
  { name: "stores-desktop.png", width: 1440, height: 900, scale: 1 },
  { name: "stores-tablet.png", width: 768, height: 1024, scale: 1 },
  { name: "stores-android.png", width: 412, height: 915, scale: 2.625 },
  { name: "stores-iphone.png", width: 390, height: 844, scale: 3 },
];

async function captureSection(page, outPath) {
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  const section = page.locator("[data-home-stores]").first();
  await section.waitFor({ state: "visible", timeout: 90_000 });
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await section.screenshot({ path: outPath, type: "png" });
}

async function main() {
  const browser = await chromium.launch();

  for (const shot of shots) {
    const outPath = join(outDir, shot.name);
    const ctx = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: shot.scale,
      colorScheme: "light",
    });
    const page = await ctx.newPage();
    await captureSection(page, outPath);
    await ctx.close();
    if (!existsSync(outPath)) {
      throw new Error(`Screenshot missing: ${outPath}`);
    }
    console.log("Saved:", outPath);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
