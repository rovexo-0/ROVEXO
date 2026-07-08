#!/usr/bin/env node
/**
 * UI Polish Pass v1.0 — screenshot capture for visual approval.
 * Usage: AUDIT_BASE_URL=http://127.0.0.1:3025 node scripts/module2-ui-polish-screenshots.mjs
 */
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, webkit, devices } from "playwright";
import { createServerClient } from "@supabase/ssr";
import { readFileSync } from "node:fs";

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
const base = env.MODULE2_BASE_URL ?? env.AUDIT_BASE_URL ?? "http://127.0.0.1:3025";
const outDir = join(process.cwd(), "reports", "module-2", "ui-polish", "screenshots");
mkdirSync(outDir, { recursive: true });

const password = env.DEMO_SEED_PASSWORD || "RovexoDemo2026!";
const businessEmail = "business01@demo.rovexo.co.uk";
const superEmail = env.SUPER_ADMIN_EMAIL ?? "superadmin@demo.rovexo.co.uk";
const buyerEmail = "buyer01@demo.rovexo.co.uk";

async function signIn(email) {
  const pending = [];
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => pending.map((c) => ({ name: c.name, value: c.value })),
      setAll: (cookies) => {
        for (const cookie of cookies) {
          const i = pending.findIndex((e) => e.name === cookie.name);
          if (i >= 0) pending[i] = cookie;
          else pending.push(cookie);
        }
      },
    },
  });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${email}: ${error.message}`);
  return pending;
}

async function makeContext(browser, { theme = "light", viewport, auth, userAgent } = {}) {
  const { hostname } = new URL(base);
  const context = await browser.newContext({
    viewport: viewport ?? { width: 390, height: 844 },
    colorScheme: theme === "dark" ? "dark" : "light",
    ...(userAgent ? { userAgent } : {}),
  });
  if (auth) {
    const cookies = await signIn(auth);
    await context.addCookies(
      cookies.map(({ name, value, options: o }) => ({
        name,
        value,
        domain: hostname,
        path: o?.path ?? "/",
        httpOnly: o?.httpOnly ?? true,
        secure: false,
        sameSite: "Lax",
      })),
    );
  }
  const page = await context.newPage();
  await page.addInitScript((mode) => {
    localStorage.setItem("rovexo-theme", mode);
    document.documentElement.setAttribute("data-theme", mode);
  }, theme === "dark" ? "dark" : "light");
  return { context, page };
}

async function shot(page, name) {
  const file = join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

const captures = [];

async function main() {
  const chromiumBrowser = await chromium.launch();
  const webkitBrowser = await webkit.launch();

  // Homepage white
  {
    const { context, page } = await makeContext(chromiumBrowser, { theme: "light" });
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(2000);
    captures.push({ id: "01-homepage-white", file: await shot(page, "01-homepage-white") });
    await context.close();
  }

  // Homepage black
  {
    const { context, page } = await makeContext(chromiumBrowser, { theme: "dark" });
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(2000);
    captures.push({ id: "02-homepage-black", file: await shot(page, "02-homepage-black") });
    await context.close();
  }

  // Showcase
  {
    const { context, page } = await makeContext(chromiumBrowser, { theme: "light" });
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.querySelector(".home-v1-showcase-section")?.scrollIntoView());
    await page.waitForTimeout(1500);
    captures.push({ id: "03-showcase", file: await shot(page, "03-showcase") });
    await context.close();
  }

  // Sell + upload
  {
    const { context, page } = await makeContext(chromiumBrowser, { theme: "light", auth: buyerEmail });
    await page.goto(`${base}/sell`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    captures.push({ id: "04-sell", file: await shot(page, "04-sell") });
    const fileInput = page.locator('input[type="file"][accept*="image"][multiple]').first();
    const demos = ["phone-01.jpg", "headphones-01.jpg", "laptop-01.jpg", "watch-01.jpg", "shoes-01.jpg", "jacket-01.jpg", "handbag-01.jpg", "tv-01.jpg"].map(
      (n) => join(process.cwd(), "public", "demo", n),
    );
    if ((await fileInput.count()) > 0 && demos.every(existsSync)) {
      await fileInput.setInputFiles(demos);
      await page.waitForTimeout(2000);
    }
    captures.push({ id: "05-upload-photos", file: await shot(page, "05-upload-photos") });
    await context.close();
  }

  // Review listing / product
  {
    const { context, page } = await makeContext(chromiumBrowser, {
      theme: "light",
      viewport: { width: 1440, height: 900 },
    });
    await page.goto(`${base}/listing/demo-iphone-15-pro`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    captures.push({ id: "06-product-page", file: await shot(page, "06-product-page") });
    await context.close();
  }

  // My Account
  {
    const { context, page } = await makeContext(chromiumBrowser, { theme: "light", auth: buyerEmail });
    await page.goto(`${base}/account`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    captures.push({ id: "07-my-account", file: await shot(page, "07-my-account") });
    await context.close();
  }

  // Business
  {
    const { context, page } = await makeContext(chromiumBrowser, {
      theme: "light",
      auth: businessEmail,
      viewport: { width: 1440, height: 900 },
    });
    await page.goto(`${base}/business/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    captures.push({ id: "08-business", file: await shot(page, "08-business") });
    await context.close();
  }

  // Promotion
  {
    const { context, page } = await makeContext(chromiumBrowser, { theme: "light", auth: businessEmail });
    await page.goto(`${base}/plans`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    captures.push({ id: "09-promotion", file: await shot(page, "09-promotion") });
    await context.close();
  }

  // Super Admin
  {
    const { context, page } = await makeContext(chromiumBrowser, {
      theme: "light",
      auth: superEmail,
      viewport: { width: 1440, height: 900 },
    });
    await page.goto(`${base}/super-admin`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    captures.push({ id: "10-super-admin", file: await shot(page, "10-super-admin") });
    await context.close();
  }

  // Theme engine
  {
    const { context, page } = await makeContext(chromiumBrowser, {
      theme: "light",
      auth: superEmail,
      viewport: { width: 1440, height: 900 },
    });
    await page.goto(`${base}/super-admin/theme-manager`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    captures.push({ id: "11-theme-engine", file: await shot(page, "11-theme-engine") });
    await context.close();
  }

  // Android
  {
    const pixel = devices["Pixel 7"];
    const { context, page } = await makeContext(chromiumBrowser, {
      theme: "light",
      viewport: pixel.viewport,
      userAgent: pixel.userAgent,
    });
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    captures.push({ id: "12-android", file: await shot(page, "12-android") });
    await context.close();
  }

  // iPhone
  {
    const iphone = devices["iPhone 14"];
    const context = await webkitBrowser.newContext({ ...iphone, colorScheme: "light" });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    captures.push({ id: "13-iphone", file: await shot(page, "13-iphone") });
    await context.close();
  }

  // Desktop
  {
    const { context, page } = await makeContext(chromiumBrowser, {
      theme: "light",
      viewport: { width: 1440, height: 900 },
    });
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    captures.push({ id: "14-desktop", file: await shot(page, "14-desktop") });
    await context.close();
  }

  await chromiumBrowser.close();
  await webkitBrowser.close();

  console.log(`UI polish screenshots → ${outDir}`);
  for (const c of captures) console.log(`  ${c.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
