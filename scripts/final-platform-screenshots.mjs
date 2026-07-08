#!/usr/bin/env node
/**
 * Final Platform — capture audit screenshots from running local app.
 * Usage: AUDIT_BASE_URL=http://127.0.0.1:3025 node scripts/final-platform-screenshots.mjs
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
const base = env.FINAL_PLATFORM_BASE_URL ?? env.AUDIT_BASE_URL ?? "http://127.0.0.1:3025";
const outDir = join(process.cwd(), "reports", "final-platform", "screenshots");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();

async function capture(name, route, options = {}) {
  const { theme = "light", viewport = { width: 390, height: 844 }, fullPage = false } = options;
  const page = await browser.newPage({ viewport });
  await page.emulateMedia({ colorScheme: theme === "dark" ? "dark" : "light" });
  await page.goto(`${base}${route}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage });
  await page.close();
  console.log(`✓ ${name}`);
}

try {
  await capture("homepage", "/");
  await capture("homepage-showcase", "/", { fullPage: true });
  await capture("theme-black", "/", { theme: "dark" });
  await capture("theme-white", "/", { theme: "light" });
  await capture("sell-upload", "/sell");
  await capture("listing-review", "/listing/demo-feed-0");
  await capture("profile", "/account/profile");
  await capture("promotional-tools", "/seller/listings");
  await capture("super-admin-pricing", "/super-admin/pricing");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}

console.log(`\nScreenshots saved to ${outDir}`);
