#!/usr/bin/env node
/**
 * Shippo certification checkout screenshots.
 * Usage: AUDIT_BASE_URL=http://127.0.0.1:3000 node scripts/shippo-certification-screenshots.mjs
 */
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

function loadEnv(file) {
  const p = join(process.cwd(), file);
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[t.slice(0, eq).trim()] = v;
  }
  return out;
}

const env = { ...loadEnv(".env"), ...loadEnv(".env.local"), ...process.env };
const base = env.SHIPPO_AUDIT_BASE_URL ?? env.AUDIT_BASE_URL ?? "http://127.0.0.1:3000";
const listingSlug = env.SHIPPO_AUDIT_LISTING_SLUG ?? "demo-feed-0";
const outDir = join(process.cwd(), "reports", "shippo-certification", "screenshots");
mkdirSync(outDir, { recursive: true });

async function gotoCheckout(page) {
  await page.goto(`${base}/listing/${listingSlug}`, { waitUntil: "networkidle", timeout: 90_000 });
  const buy = page.getByRole("button", { name: /buy now|checkout/i }).first();
  if (await buy.isVisible().catch(() => false)) {
    await buy.click();
    await page.waitForURL(/\/checkout\//, { timeout: 30_000 }).catch(() => {});
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
  });
  const page = await context.newPage();

  await gotoCheckout(page);
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(outDir, "01-checkout-before-rates.png"), fullPage: true });

  const addressFields = [
    { label: /recipient|full name/i, value: "Alex Buyer" },
    { label: /address|line 1/i, value: "42 Test Street, Manchester" },
    { label: /postcode|post code/i, value: "M1 1AD" },
  ];
  for (const field of addressFields) {
    const input = page.getByLabel(field.label).first();
    if (await input.isVisible().catch(() => false)) {
      await input.fill(field.value);
    }
  }

  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, "02-checkout-address-entered.png"), fullPage: true });

  await page.waitForTimeout(4000);
  await page.screenshot({ path: join(outDir, "03-checkout-after-live-rates.png"), fullPage: true });

  const carrierOption = page.locator('input[name="delivery-option"]').first();
  if (await carrierOption.isVisible().catch(() => false)) {
    await carrierOption.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, "04-carrier-selection.png"), fullPage: true });
  }

  const summary = page.getByRole("heading", { name: /order summary/i }).locator("..");
  if (await summary.isVisible().catch(() => false)) {
    await summary.screenshot({ path: join(outDir, "05-order-summary.png") });
  } else {
    await page.screenshot({ path: join(outDir, "05-order-summary.png"), fullPage: true });
  }

  await browser.close();
  console.log(`Screenshots saved to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
