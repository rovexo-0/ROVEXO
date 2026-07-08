#!/usr/bin/env node
/**
 * Module 1 — capture real screenshots from the running local app.
 * Usage: AUDIT_BASE_URL=http://127.0.0.1:3025 node scripts/module1-screenshots.mjs
 */
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
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
const base = env.MODULE1_BASE_URL ?? env.AUDIT_BASE_URL ?? "http://127.0.0.1:3025";
const outDir = join(process.cwd(), "reports", "module-1", "screenshots");
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
const browser = await chromium.launch();
const { hostname } = new URL(base);

async function capture(name, route, options = {}) {
  const { theme = "light", viewport = { width: 390, height: 844 }, auth = false } = options;
  const context = await browser.newContext({ viewport, colorScheme: theme });
  if (auth) {
    const cookies = await signIn("buyer01@demo.rovexo.co.uk", password);
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
  if (theme === "dark") {
    await page.addInitScript(() => {
      localStorage.setItem("rovexo-theme", "dark");
      document.documentElement.setAttribute("data-theme", "dark");
    });
  }
  await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(2500);
  const file = join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log("OK", file);
  await context.close();
}

await capture("homepage-mobile-light", "/", { theme: "light" });
await capture("homepage-mobile-dark", "/", { theme: "dark" });
await capture("search-mobile-light", "/search?q=phone", { theme: "light" });
await capture("categories-mobile-light", "/categories", { theme: "light" });
await capture("homepage-desktop-light", "/", { theme: "light", viewport: { width: 1280, height: 800 } });
await capture("search-desktop-light", "/search?q=phone", { theme: "light", viewport: { width: 1280, height: 800 } });
await capture("appearance-settings", "/account/preferences/appearance", { theme: "light", auth: true });

await browser.close();
