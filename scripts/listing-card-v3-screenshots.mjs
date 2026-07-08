#!/usr/bin/env node
/** Capture real ListingCard v3.0 screenshots from localhost. Screenshots only — no report. */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = join(process.cwd(), "reports", "module-1", "listing-card-v3");
const desktopPath = join(outDir, "card-desktop.png");
const mobilePath = join(outDir, "card-mobile.png");

mkdirSync(outDir, { recursive: true });

async function captureCard(page, outPath) {
  await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 120_000 });
  const card = page.locator('[data-rx-card-version="3.0"]').first();
  await card.waitFor({ state: "visible", timeout: 60_000 });
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await card.screenshot({ path: outPath, type: "png" });
}

async function main() {
  const browser = await chromium.launch();

  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
  });
  const desktopPage = await desktopCtx.newPage();
  await captureCard(desktopPage, desktopPath);
  await desktopCtx.close();

  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileCtx.newPage();
  await captureCard(mobilePage, mobilePath);
  await mobileCtx.close();

  await browser.close();
  console.log("Saved:", desktopPath);
  console.log("Saved:", mobilePath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
