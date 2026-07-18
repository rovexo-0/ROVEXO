/**
 * ROVEXO Absolute Final — Master Image Pack (100% platform)
 * Phone viewport only. Standard / classic / compact. No luxury chrome.
 *
 * Usage:
 *   BASE_URL=http://127.0.0.1:3000 node scripts/master-image-pack.mjs
 *   BASE_URL=https://rovexo-git-develop-rovexo.vercel.app node scripts/master-image-pack.mjs
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const OUT = join(process.cwd(), "owner-review-screenshots", "master-image-pack-v1");
const PHONE = { width: 398, height: 860 };
const BUYER = {
  email: process.env.DEMO_BUYER_EMAIL || "demo.buyer@rovexo.co.uk",
  password: process.env.DEMO_BUYER_PASSWORD || "RovexoBuyer@2026",
};

/** Routes that define the Master Image Pack (Absolute Final PO list). */
const ROUTES = [
  { id: "01-login", path: "/login", auth: false, label: "Login" },
  { id: "02-account", path: "/account", auth: true, label: "My Account" },
  { id: "03-buying", path: "/account/buying", auth: true, label: "Buying" },
  { id: "04-selling", path: "/seller", auth: true, label: "Selling" },
  { id: "05-business", path: "/business/dashboard", auth: true, label: "Business" },
  { id: "06-wallet", path: "/wallet", auth: true, label: "Wallet" },
  { id: "07-messages", path: "/messages", auth: true, label: "Messages" },
  { id: "08-trust", path: "/trust", auth: true, label: "Trust" },
  { id: "09-settings", path: "/account/settings", auth: true, label: "Settings" },
  { id: "10-search", path: "/search", auth: false, label: "Search" },
  { id: "11-orders", path: "/orders?tab=bought", auth: true, label: "Orders" },
  { id: "12-saved", path: "/saved", auth: true, label: "Saved" },
  { id: "13-notifications", path: "/inbox?tab=notifications", auth: true, label: "Notifications" },
  { id: "14-reviews", path: "/account/reviews", auth: true, label: "Reviews" },
  { id: "15-directory", path: "/business/directory", auth: true, label: "Directory" },
  { id: "16-help", path: "/help", auth: true, label: "Help" },
  { id: "17-legal", path: "/legal", auth: true, label: "Legal" },
  { id: "18-resolution", path: "/resolution", auth: true, label: "Resolution" },
  { id: "19-inbox", path: "/inbox?tab=messages", auth: true, label: "Inbox Conversations" },
  { id: "20-recently-viewed", path: "/account/recently-viewed", auth: true, label: "Recently Viewed" },
  { id: "21-seller-shipping", path: "/seller/shipping", auth: true, label: "Seller Shipping" },
  { id: "22-seller-performance", path: "/seller/performance", auth: true, label: "Performance" },
  { id: "23-verification", path: "/account/verification", auth: true, label: "Verification" },
  { id: "24-cart", path: "/cart", auth: true, label: "Cart" },
];

async function uiLogin(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(800);
  const email = page.locator('input[type="email"], input[name="email"]').first();
  const password = page.locator('input[type="password"], input[name="password"]').first();
  if (!(await email.count())) throw new Error("Login form not found");
  await email.fill(BUYER.email);
  await password.fill(BUYER.password);
  const submit = page.getByRole("button", { name: /sign in/i }).first();
  await submit.click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 45_000 }).catch(() => null);
  await page.waitForTimeout(1200);
}

async function capture(page, route) {
  const url = `${BASE}${route.path}`;
  const file = join(OUT, `${route.id}.png`);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(900);
    // Soft-hide animated loaders for stable shots
    await page.addStyleTag({
      content: `
        * { animation: none !important; transition: none !important; }
        [data-rx-float], .rx-toast { display: none !important; }
      `,
    }).catch(() => null);
    await page.screenshot({ path: file, fullPage: true });
    return { ...route, ok: true, file, url };
  } catch (error) {
    return { ...route, ok: false, error: String(error), url };
  }
}

function writeGallery(results) {
  const cards = results
    .map((r) => {
      const img = r.ok ? `<img src="${r.id}.png" alt="${r.label}" loading="lazy" />` : `<p class="err">${r.error || "failed"}</p>`;
      return `<figure data-ok="${r.ok}"><figcaption>${r.label}<br/><code>${r.path}</code></figcaption>${img}</figure>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ROVEXO Master Image Pack v1 — Absolute Final</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #fff; color: #111; }
    header { padding: 16px; border-bottom: 1px solid #e5e7eb; }
    h1 { margin: 0; font-size: 16px; font-weight: 700; }
    p { margin: 6px 0 0; font-size: 13px; color: #64748b; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; padding: 16px; }
    figure { margin: 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #f8fafc; }
    figure[data-ok="false"] { border-color: #ef4444; }
    figcaption { padding: 8px 10px; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e5e7eb; background: #fff; }
    code { font-weight: 400; color: #64748b; font-size: 11px; }
    img { display: block; width: 100%; height: auto; background: #fff; }
    .err { padding: 16px; font-size: 12px; color: #b91c1c; }
    .meta { padding: 0 16px 16px; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <header>
    <h1>ROVEXO Master Image Pack v1</h1>
    <p>Phone ${PHONE.width}×${PHONE.height} · 100% phone width · standard / classic / compact · purple / white / black / grey</p>
    <p>Base: ${BASE}</p>
  </header>
  <p class="meta">${results.filter((r) => r.ok).length}/${results.length} captured · Absolute Final Product Owner visual pack</p>
  <div class="grid">${cards}</div>
</body>
</html>`;
  writeFileSync(join(OUT, "index.html"), html, "utf8");
  writeFileSync(join(OUT, "manifest.json"), JSON.stringify({ base: BASE, phone: PHONE, results }, null, 2), "utf8");
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: PHONE,
    deviceScaleFactor: 2,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();

  let authed = false;
  try {
    await uiLogin(page);
    authed = true;
  } catch (error) {
    console.warn("UI login failed — public routes only:", error.message || error);
  }

  const results = [];
  for (const route of ROUTES) {
    if (route.auth && !authed) {
      results.push({ ...route, ok: false, error: "not authenticated", url: `${BASE}${route.path}` });
      console.log("SKIP", route.id);
      continue;
    }
    process.stdout.write(`SHOT ${route.id} … `);
    const result = await capture(page, route);
    console.log(result.ok ? "OK" : "FAIL");
    results.push(result);
  }

  writeGallery(results);
  await browser.close();

  const ok = results.filter((r) => r.ok).length;
  console.log(`\nMaster Image Pack: ${ok}/${results.length}`);
  console.log(`Gallery: ${join(OUT, "index.html")}`);
  if (ok < Math.ceil(ROUTES.length * 0.5)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
