#!/usr/bin/env node
/** Fresh iPhone 17 Pro Max homepage screenshot — canonical listing card */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const CARD_SEL = '[data-hp-listing-card="official"]';
const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = join(process.cwd(), "reports", "module-1", "listing-card-v4");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "homepage-iphone17promax-v4-fresh.png");

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 440, height: 956 },
  deviceScaleFactor: 3,
  colorScheme: "light",
});
const page = await ctx.newPage();
await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
await page.locator(CARD_SEL).first().waitFor({ state: "visible", timeout: 90_000 });
await page.locator(CARD_SEL).first().scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await page.screenshot({ path: outPath, type: "png", fullPage: false });
await browser.close();
console.log("Saved:", outPath);
