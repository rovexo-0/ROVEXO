#!/usr/bin/env node
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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnon) {
  console.error("Missing Supabase env.");
  process.exit(2);
}

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3025";
const outDir = join(process.cwd(), "audit-captures-auth");
mkdirSync(outDir, { recursive: true });

const password = env.DEMO_SEED_PASSWORD || "RovexoDemo2026!";
const sessions = [
  { prefix: "buyer01", email: "buyer01@demo.rovexo.co.uk", routes: [
    "/orders",
    "/account/wallet",
    "/saved",
    "/trust",
    "/plans",
    "/import",
    "/help",
    "/checkout/camping-tent-4-pers-mr87jyel",
  ]},
  { prefix: "business01", email: "business01@demo.rovexo.co.uk", routes: [
    "/business/dashboard",
    "/business/inventory",
  ]},
];

for (const session of sessions) {
  const pending = [];
  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll: () => pending.map((c) => ({ name: c.name, value: c.value })),
      setAll: (cookies) => {
        for (const cookie of cookies) {
          const index = pending.findIndex((entry) => entry.name === cookie.name);
          if (index >= 0) pending[index] = cookie;
          else pending.push(cookie);
        }
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: session.email,
    password,
  });
  if (error) {
    console.error("Sign-in failed:", session.email, error.message);
    continue;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const { hostname } = new URL(base);
  await context.addCookies(
    pending.map(({ name, value, options }) => ({
      name,
      value,
      domain: hostname,
      path: options?.path ?? "/",
      httpOnly: options?.httpOnly ?? true,
      secure: false,
      sameSite: "Lax",
    })),
  );

  const page = await context.newPage();
  for (const route of session.routes) {
    try {
      await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(3000);
      const name = `${session.prefix}_${route.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home"}`;
      await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: true });
      console.log("OK", session.prefix, route, "->", page.url());
    } catch (captureError) {
      console.log("FAIL", session.prefix, route, captureError instanceof Error ? captureError.message : captureError);
    }
  }
  await browser.close();
}
