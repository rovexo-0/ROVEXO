#!/usr/bin/env node
/**
 * Final Certification — production screenshots (all required surfaces).
 * Usage: AUDIT_BASE_URL=http://127.0.0.1:3025 node scripts/final-certification-screenshots.mjs
 */
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, webkit } from "playwright";

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
const base = env.FINAL_CERT_BASE_URL ?? env.AUDIT_BASE_URL ?? "http://127.0.0.1:3025";
const outDir = join(process.cwd(), "reports", "final-certification", "screenshots");
mkdirSync(outDir, { recursive: true });

const shots = [
  { name: "01-homepage-white", route: "/", theme: "light", viewport: { width: 390, height: 844 } },
  { name: "02-homepage-black", route: "/", theme: "dark", viewport: { width: 390, height: 844 } },
  { name: "03-listing-card", route: "/", theme: "light", viewport: { width: 390, height: 844 }, clipCard: true },
  { name: "04-showcase", route: "/", theme: "light", viewport: { width: 390, height: 844 }, fullPage: true },
  { name: "05-seller-profile", route: "/search", theme: "light", viewport: { width: 390, height: 844 } },
  { name: "06-upload-page", route: "/sell", theme: "light", viewport: { width: 390, height: 844 } },
  { name: "07-review-listing", route: "/listing/demo-feed-0", theme: "light", viewport: { width: 390, height: 844 } },
  { name: "08-checkout", route: "/listing/demo-feed-0", theme: "light", viewport: { width: 390, height: 844 }, thenClickBuy: true },
  { name: "09-shipping", route: "/listing/demo-feed-0", theme: "light", viewport: { width: 390, height: 844 }, checkoutDelivery: true },
  { name: "10-business-dashboard", route: "/business/dashboard", theme: "light", viewport: { width: 390, height: 844 } },
  { name: "11-super-admin-pricing", route: "/super-admin/pricing", theme: "light", viewport: { width: 1280, height: 900 } },
  { name: "12-theme-white", route: "/", theme: "light", viewport: { width: 390, height: 844 } },
  { name: "13-theme-black", route: "/", theme: "dark", viewport: { width: 390, height: 844 } },
  { name: "14-android", route: "/", theme: "light", viewport: { width: 412, height: 915 }, userAgent: "android" },
  { name: "15-iphone", route: "/", theme: "light", viewport: { width: 390, height: 844 }, engine: "webkit" },
  { name: "16-desktop", route: "/", theme: "light", viewport: { width: 1440, height: 900 } },
];

async function capture(browser, shot) {
  const context = await browser.newContext({
    viewport: shot.viewport,
    colorScheme: shot.theme === "dark" ? "dark" : "light",
    ...(shot.userAgent === "android"
      ? {
          userAgent:
            "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        }
      : {}),
  });
  const page = await context.newPage();

  if (shot.checkoutDelivery || shot.thenClickBuy) {
    await page.goto(`${base}/listing/demo-feed-0`, { waitUntil: "networkidle", timeout: 60_000 });
    const buy = page.getByRole("button", { name: /buy now|checkout/i }).first();
    if (await buy.isVisible().catch(() => false)) {
      await buy.click();
      await page.waitForTimeout(1500);
    }
  } else {
    await page.goto(`${base}${shot.route}`, { waitUntil: "networkidle", timeout: 60_000 });
  }

  await page.waitForTimeout(1000);

  if (shot.clipCard) {
    const card = page.locator('[data-listing-card], .rx-listing-card, article').first();
    if (await card.isVisible().catch(() => false)) {
      await card.screenshot({ path: join(outDir, `${shot.name}.png`) });
      await context.close();
      console.log(`✓ ${shot.name}`);
      return;
    }
  }

  await page.screenshot({
    path: join(outDir, `${shot.name}.png`),
    fullPage: Boolean(shot.fullPage),
  });
  await context.close();
  console.log(`✓ ${shot.name}`);
}

const chromiumBrowser = await chromium.launch();
const webkitBrowser = existsSync(webkit.executablePath()) ? await webkit.launch() : null;

try {
  for (const shot of shots) {
    const browser = shot.engine === "webkit" && webkitBrowser ? webkitBrowser : chromiumBrowser;
    await capture(browser, shot);
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await chromiumBrowser.close();
  if (webkitBrowser) await webkitBrowser.close();
}

console.log(`\nScreenshots saved to ${outDir}`);
