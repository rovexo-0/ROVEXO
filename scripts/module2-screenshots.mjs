#!/usr/bin/env node
/**
 * Module 2 v2.0 — certification screenshots.
 * Usage: AUDIT_BASE_URL=http://127.0.0.1:3025 node scripts/module2-screenshots.mjs
 */
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, webkit } from "playwright";
import { createServerClient } from "@supabase/ssr";

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
const outDir = join(process.cwd(), "reports", "module-2", "screenshots");
mkdirSync(outDir, { recursive: true });

async function signIn(email, password) {
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
  if (error) throw new Error(error.message);
  return pending;
}

const password = env.DEMO_SEED_PASSWORD || "RovexoDemo2026!";
const { hostname } = new URL(base);

async function capture(browser, name, route, options = {}) {
  const {
    theme = "light",
    viewport = { width: 390, height: 844 },
    auth = false,
    email = "buyer01@demo.rovexo.co.uk",
    prepare,
    engine = "chromium",
  } = options;

  const context = await browser.newContext({
    viewport,
    colorScheme: theme === "dark" ? "dark" : "light",
    ...(engine === "chromium" && options.userAgent === "android"
      ? {
          userAgent:
            "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        }
      : {}),
  });

  if (auth) {
    const cookies = await signIn(email, password);
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

  await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  if (prepare) await prepare(page);
  await page.waitForTimeout(2500);

  const file = join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log("OK", file);
  await context.close();
}

const chromiumBrowser = await chromium.launch();
const webkitBrowser = await webkit.launch();

const scrollToShowcase = async (page) => {
  await page.evaluate(() => {
    const section = document.querySelector('[aria-labelledby="showcase-heading"], [data-showcase-section]');
    section?.scrollIntoView({ block: "start", behavior: "instant" });
  });
};

await capture(chromiumBrowser, "01-homepage-white", "/", { theme: "light" });
await capture(chromiumBrowser, "02-homepage-black", "/", { theme: "dark" });
await capture(chromiumBrowser, "03-showcase", "/", { theme: "light", prepare: scrollToShowcase });
await capture(chromiumBrowser, "04-sell", "/sell/new", {
  theme: "light",
  auth: true,
  email: "buyer01@demo.rovexo.co.uk",
});
await capture(chromiumBrowser, "05-review-listing", "/search?q=phone", {
  theme: "light",
  prepare: async (page) => {
    const link = page.locator('a[href^="/listing/"]').first();
    if ((await link.count()) > 0) {
      await link.click();
      await page.waitForLoadState("domcontentloaded");
    }
  },
});
await capture(chromiumBrowser, "06-business", "/business/dashboard", {
  theme: "light",
  auth: true,
  email: "business01@demo.rovexo.co.uk",
});
await capture(chromiumBrowser, "07-super-admin", "/super-admin", {
  theme: "light",
  auth: true,
  email: env.SUPER_ADMIN_EMAIL ?? "superadmin@demo.rovexo.co.uk",
});
await capture(chromiumBrowser, "08-promotion-manager", "/super-admin/pricing", {
  theme: "light",
  auth: true,
  email: env.SUPER_ADMIN_EMAIL ?? "superadmin@demo.rovexo.co.uk",
});
await capture(chromiumBrowser, "09-theme-engine", "/super-admin/theme-manager", {
  theme: "light",
  auth: true,
  email: env.SUPER_ADMIN_EMAIL ?? "superadmin@demo.rovexo.co.uk",
});
await capture(chromiumBrowser, "10-android", "/", {
  theme: "light",
  viewport: { width: 412, height: 915 },
  userAgent: "android",
});
await capture(webkitBrowser, "11-iphone", "/", {
  theme: "light",
  viewport: { width: 390, height: 844 },
  engine: "webkit",
});
await capture(chromiumBrowser, "12-desktop", "/", {
  theme: "light",
  viewport: { width: 1440, height: 900 },
});

await chromiumBrowser.close();
await webkitBrowser.close();

console.log(`Screenshots saved to ${outDir}`);
