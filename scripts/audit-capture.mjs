#!/usr/bin/env node
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "audit-captures");
fs.mkdirSync(out, { recursive: true });
const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3025";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const routes = [
  "/",
  "/help",
  "/trust",
  "/plans",
  "/categories",
  "/search?q=phone",
  "/import",
  "/business/dashboard",
  "/saved",
];

for (const route of routes) {
  try {
    await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(2500);
    const name = route.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home";
    await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
    console.log("OK", route);
  } catch (error) {
    console.log("FAIL", route, error instanceof Error ? error.message : error);
  }
}

await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
const href = await page.locator('a[href^="/listing/"]').first().getAttribute("href").catch(() => null);
if (href) {
  await page.goto(`${base}${href}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(out, "listing_detail.png"), fullPage: true });
  console.log("OK", href);
}

await browser.close();
