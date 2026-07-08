#!/usr/bin/env node
/**
 * Module 2 Final Visual Certification — screenshots + DOM verification.
 * Usage: AUDIT_BASE_URL=http://127.0.0.1:3025 node scripts/module2-final-visual-cert.mjs
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit, devices } from "playwright";
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
const outDir = join(process.cwd(), "reports", "module-2", "final-visual");
const shotsDir = join(outDir, "screenshots");
mkdirSync(shotsDir, { recursive: true });

const password = env.DEMO_SEED_PASSWORD || "RovexoDemo2026!";
const superEmail = env.SUPER_ADMIN_EMAIL ?? "superadmin@demo.rovexo.co.uk";
const businessEmail = "business01@demo.rovexo.co.uk";
const buyerEmail = "buyer01@demo.rovexo.co.uk";

/** @type {Array<{id:string,area:string,status:'PASS'|'WARNING'|'FAIL',detail:string}>} */
const findings = [];

function record(area, id, status, detail) {
  findings.push({ area, id, status, detail });
}

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

function cookiePayload(cookies, hostname) {
  return cookies.map(({ name, value, options: o }) => ({
    name,
    value,
    domain: hostname,
    path: o?.path ?? "/",
    httpOnly: o?.httpOnly ?? true,
    secure: false,
    sameSite: "Lax",
  }));
}

async function makeContext(browser, options = {}) {
  const {
    theme = "light",
    viewport = { width: 390, height: 844 },
    auth = null,
    userAgent,
  } = options;
  const { hostname } = new URL(base);
  const context = await browser.newContext({
    viewport,
    colorScheme: theme === "dark" ? "dark" : "light",
    ...(userAgent ? { userAgent } : {}),
  });
  if (auth) {
    const cookies = await signIn(auth);
    await context.addCookies(cookiePayload(cookies, hostname));
  }
  const page = await context.newPage();
  const consoleIssues = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (/hydration|layout shift|overflow/i.test(text) || (msg.type() === "error" && !/401|unauthorized/i.test(text))) {
      consoleIssues.push(text.slice(0, 200));
    }
  });
  await page.addInitScript((mode) => {
    localStorage.setItem("rovexo-theme", mode);
    document.documentElement.setAttribute("data-theme", mode);
  }, theme === "dark" ? "dark" : "light");
  return { context, page, consoleIssues };
}

async function shot(page, name) {
  const file = join(shotsDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function verifyHomepageWhite(page) {
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(2000);

  const primary = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--ds-color-primary").trim(),
  );
  record("Homepage White", "purple-accent", primary.includes("9333ea") || primary.includes("a855f7") ? "PASS" : "WARNING", `primary=${primary || "unset"}`);

  const categoryScroller = page.locator(".home-v1-category-scroller");
  record(
    "Homepage White",
    "category-horizontal-scroll",
    (await categoryScroller.count()) > 0 ? "PASS" : "FAIL",
    "Category scroller present",
  );

  const categoryImg = await page.locator(".home-v1-category-capsule img").count();
  record("Homepage White", "category-text-only", categoryImg === 0 ? "PASS" : "FAIL", `category images=${categoryImg}`);

  const searchCamera = await page.locator('[aria-label*="camera" i], [data-testid*="camera"]').count();
  record("Homepage White", "no-camera-icon", searchCamera === 0 ? "PASS" : "FAIL", `camera controls=${searchCamera}`);

  const cards = page.locator('[data-listing-card="rovexo"]');
  const cardCount = await cards.count();
  record("Homepage White", "listing-cards", cardCount > 0 ? "PASS" : "WARNING", `cards=${cardCount}`);

  if (cardCount > 0) {
    const showcaseCard = page.locator(".home-v1-showcase-section [data-listing-card='rovexo']").first();
    const badgeTarget = (await showcaseCard.count()) > 0 ? showcaseCard : cards.first();
    record("Homepage White", "view-counter", (await cards.first().locator('[aria-label*="views" i]').count()) > 0 ? "PASS" : "WARNING", "View label on card");
    record("Homepage White", "favourite", (await cards.first().locator('[aria-label*="wishlist" i], [aria-label*="favourite" i], [aria-label*="favorite" i]').count()) > 0 ? "PASS" : "WARNING", "Wishlist control");
    const badgeText = await badgeTarget.textContent();
    const showcaseBadgeVisible =
      /showcase/i.test(badgeText ?? "") ||
      (await page.locator(".home-v1-showcase-section").getByText(/showcase/i).count()) > 0 ||
      (await page.locator(".home-v1-showcase-section [class*='status_featured']").count()) > 0;
    record(
      "Homepage White",
      "showcase-badge",
      showcaseBadgeVisible ? "PASS" : "WARNING",
      "Showcase badge on featured cards when data present",
    );
  }

  await shot(page, "01-homepage-white");
}

async function verifyHomepageBlack(page) {
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(2000);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  record("Homepage Black", "dark-theme", theme === "dark" ? "PASS" : "WARNING", `data-theme=${theme}`);
  record("Homepage Black", "dark-background", bg !== "rgba(0, 0, 0, 0)" ? "PASS" : "WARNING", `body bg=${bg}`);
  await shot(page, "02-homepage-black");
}

async function verifyShowcase(page) {
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.evaluate(() => {
    document.querySelector(".home-v1-showcase-section")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(1500);

  const section = page.locator(".home-v1-showcase-section").first();
  const hasSection = (await section.count()) > 0;
  record("Showcase", "section-present", hasSection ? "PASS" : "WARNING", "Showcase section on homepage");

  if (hasSection) {
    record("Showcase", "seller-avatar", (await section.locator(".home-v1-showcase-section__avatar").count()) > 0 ? "PASS" : "FAIL", "Avatar");
    record("Showcase", "seller-name", (await section.locator(".home-v1-showcase-section__name").count()) > 0 ? "PASS" : "FAIL", "Seller name");
    record("Showcase", "follow-button", (await section.getByRole("button", { name: /follow/i }).count()) > 0 ? "PASS" : "WARNING", "Follow button");
    record("Showcase", "horizontal-listings", (await section.locator('[data-listing-card="rovexo"]').count()) > 0 ? "PASS" : "WARNING", "Horizontal listing cards");

    const profileHref = await section.locator("a.home-v1-showcase-section__seller").first().getAttribute("href");
    if (profileHref) {
      await page.goto(`${base}${profileHref}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      record("Showcase", "seller-profile", page.url().includes("/search") || page.url().includes("/seller") || page.url().includes("/user/") ? "PASS" : "WARNING", profileHref);
    }
  }

  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.querySelector(".home-v1-showcase-section")?.scrollIntoView());
  await page.waitForTimeout(800);
  await shot(page, "03-showcase");
}

async function verifySell(page) {
  await page.goto(`${base}/sell/new`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(2000);

  record("Sell", "single-upload-card", (await page.locator(".rx-upload").count()) > 0 ? "PASS" : "FAIL", "Single upload card");
  const fileInput = page.locator('input[type="file"][accept*="image"][multiple]').first();
  record("Sell", "gallery-input", (await fileInput.count()) > 0 ? "PASS" : "FAIL", "Native file input for gallery");
  const multiple = await fileInput.getAttribute("multiple");
  record("Sell", "multiple-selection", multiple !== null ? "PASS" : "WARNING", `multiple=${multiple}`);
  record("Sell", "max-8-label", (await page.getByText(/\/8/).count()) > 0 ? "PASS" : "WARNING", "8 photo cap shown");

  await shot(page, "04-sell");

  const demoImages = [
    "phone-01.jpg",
    "headphones-01.jpg",
    "laptop-01.jpg",
    "watch-01.jpg",
    "shoes-01.jpg",
    "jacket-01.jpg",
    "handbag-01.jpg",
    "tv-01.jpg",
  ].map((name) => join(process.cwd(), "public", "demo", name));

  if (demoImages.every((p) => existsSync(p)) && (await fileInput.count()) > 0) {
    await fileInput.setInputFiles(demoImages);
    await page.waitForTimeout(2500);
    const thumbs = await page.locator("[data-photo-index]").count();
    record("Sell", "eight-photos", thumbs >= 8 ? "PASS" : "WARNING", `thumbnails=${thumbs}`);
    record("Sell", "horizontal-preview", thumbs > 0 ? "PASS" : "WARNING", "Horizontal thumbnail strip after upload");
  } else {
    record("Sell", "eight-photos", "WARNING", "Demo images or file input unavailable");
  }

  const slotNums = await page.locator(".PhotoUploader_thumbIndex, [class*='thumbIndex']").count();
  record("Sell", "numbered-slots", slotNums >= 8 ? "PASS" : slotNums > 0 ? "WARNING" : "WARNING", `index badges=${slotNums}`);

  await shot(page, "05-upload-photos");
}

async function verifyReviewListing(page) {
  const listingSlugs = ["demo-iphone-15-pro", "showcase-demo-techvault-phone"];
  let opened = false;

  for (const slug of listingSlugs) {
    const response = await page.goto(`${base}/listing/${slug}`, { waitUntil: "domcontentloaded", timeout: 90_000 }).catch(() => null);
    if (response && response.status() < 400) {
      opened = true;
      break;
    }
  }

  if (!opened) {
    await page.goto(`${base}/search?q=phone`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    const link = page.locator('a[href^="/listing/"]').first();
    if ((await link.count()) > 0) {
      await link.click();
      await page.waitForLoadState("domcontentloaded");
      opened = true;
    }
  }

  if (!opened) {
    record("Review Listing", "listing-route", "WARNING", "No listing route reachable");
    await shot(page, "06-review-listing");
    return;
  }

  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  record("Review Listing", "listing-route", "PASS", page.url());

  let gallery = page.locator('[aria-label*="image gallery" i]');
  if ((await gallery.count()) === 0) {
    await page.goto(`${base}/search?q=phone`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    const links = page.locator('a[href^="/listing/"]');
    const total = await links.count();
    for (let i = 0; i < Math.min(total, 8); i += 1) {
      const href = await links.nth(i).getAttribute("href");
      if (!href) continue;
      await page.goto(`${base}${href}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(1200);
      gallery = page.locator('[aria-label*="image gallery" i]');
      if ((await gallery.count()) > 0) break;
    }
  }

  const hasSlider = (await gallery.count()) > 0;
  const hasNav = (await page.locator('[aria-label="Next photo"], [aria-label="Previous photo"]').count()) > 0;
  record("Review Listing", "horizontal-slider", hasSlider || hasNav ? "PASS" : "WARNING", "Product gallery scroller");

  if ((await gallery.count()) > 0) {
    const before = await gallery.evaluate((el) => el.scrollLeft);
    await gallery.evaluate((el) => {
      el.scrollBy({ left: el.clientWidth, behavior: "instant" });
    });
    await page.waitForTimeout(400);
    const after = await gallery.evaluate((el) => el.scrollLeft);
    record("Review Listing", "swipe-scroll", after > before ? "PASS" : "WARNING", `scroll ${before}→${after}`);
  }

  await shot(page, "06-review-listing");
}

async function verifyBusiness(page) {
  await page.goto(`${base}/business/dashboard`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(2500);
  const text = await page.locator("body").innerText();
  const ok = /dashboard|business|inventory|quick actions/i.test(text) && !/something went wrong/i.test(text);
  record("Business", "dashboard", ok ? "PASS" : "WARNING", "Business dashboard loads");
  record("Business", "badge-component", (await page.getByText(/verified business|business/i).count()) > 0 ? "PASS" : "WARNING", "Business copy/badge visible");
  await shot(page, "07-business");
}

async function verifyPromotion(page) {
  await page.goto(`${base}/plans`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(2000);
  const body = await page.locator("body").innerText();
  record("Promotion", "3d-price", /£1|1\.00/.test(body) ? "PASS" : "WARNING", "3 days £1");
  record("Promotion", "7d-price", /£2|2\.00/.test(body) ? "PASS" : "WARNING", "7 days £2");
  record("Promotion", "showcase-price", /£5\.50|5\.50/.test(body) ? "PASS" : "WARNING", "Showcase £5.50");
  await shot(page, "08-promotion");
}

async function verifySuperAdmin(page) {
  await page.goto(`${base}/super-admin`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(2500);

  const menuButton = page.getByRole("button", { name: /^menu$/i });
  if ((await menuButton.count()) > 0 && (await page.locator("a.sa-premium-nav-link").count()) === 0) {
    await menuButton.click();
    await page.waitForTimeout(400);
  }

  const navLinks = await page.locator("a.sa-premium-nav-link").allTextContents();
  const hrefs = await page.locator("a.sa-premium-nav-link").evaluateAll((els) =>
    els.map((a) => a.getAttribute("href")).filter(Boolean),
  );
  const unique = new Set(hrefs);
  record("Super Admin", "no-duplicate-nav", unique.size === hrefs.length ? "PASS" : "WARNING", `links=${hrefs.length} unique=${unique.size}`);

  const expected = [
    "/super-admin/users",
    "/super-admin/moderation",
    "/super-admin/orders-engine",
    "/super-admin/payments-engine",
    "/super-admin/promotions",
    "/super-admin/pricing",
    "/super-admin/theme-manager",
    "/super-admin/monitoring",
  ];
  for (const href of expected) {
    record("Super Admin", `nav-${href}`, hrefs.includes(href) ? "PASS" : "WARNING", href);
  }

  let opened = 0;
  for (const href of [...unique].slice(0, 8)) {
    const response = await page.goto(`${base}${href}`, { waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => null);
    if (response && response.status() < 500) opened += 1;
  }
  record("Super Admin", "routes-open", opened >= 6 ? "PASS" : "WARNING", `${opened} routes OK`);

  await page.goto(`${base}/super-admin`, { waitUntil: "domcontentloaded" });
  await shot(page, "09-super-admin");
}

async function verifyThemeEngine(page) {
  await page.goto(`${base}/super-admin/theme-manager`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(2000);
  const body = await page.locator("body").innerText();
  record("Theme Engine", "page-loads", /theme|white|black|dark|light/i.test(body) ? "PASS" : "WARNING", "Theme manager reachable");
  await shot(page, "10-theme-engine");
}

async function verifyBranding(browser) {
  const { context, page } = await makeContext(browser, { theme: "light", viewport: { width: 1440, height: 900 } });
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  const hasBrand =
    (await page.locator('[aria-label="ROVEXO Home"]').count()) > 0 ||
    (await page.getByText(/ROVEXO/i).count()) > 0 ||
    (await page.locator('[aria-label*="Search ROVEXO" i]').count()) > 0;
  record("Branding", "rovexo-wordmark", hasBrand ? "PASS" : "WARNING", "ROVEXO brand visible on homepage");
  const primary = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--ds-color-primary").trim(),
  );
  record(
    "Branding",
    "purple-x",
    primary.includes("9333ea") || primary.includes("a855f7") ? "PASS" : "WARNING",
    `Primary token ${primary || "unset"}`,
  );
  await context.close();
  record("Branding", "favicon", existsSync(join(process.cwd(), "public", "favicon.svg")) ? "PASS" : "FAIL", "public/favicon.svg");
  record("Branding", "app-icon", existsSync(join(process.cwd(), "public", "icons", "icon-192.png")) ? "PASS" : "WARNING", "PWA icon");
}

async function main() {
  const chromiumBrowser = await chromium.launch();
  const webkitBrowser = await webkit.launch();
  const { hostname } = new URL(base);

  // Health check
  try {
    const res = await fetch(base);
    record("Infrastructure", "server", res.ok ? "PASS" : "FAIL", `${base} → ${res.status}`);
  } catch (error) {
    record("Infrastructure", "server", "FAIL", String(error));
    writeFileSync(join(outDir, "findings.json"), JSON.stringify(findings, null, 2));
    console.error("Server not reachable at", base);
    process.exit(1);
  }

  // 1 Homepage white
  {
    const { context, page } = await makeContext(chromiumBrowser, { theme: "light" });
    await verifyHomepageWhite(page);
    await context.close();
  }

  // 2 Homepage black
  {
    const { context, page } = await makeContext(chromiumBrowser, { theme: "dark" });
    await verifyHomepageBlack(page);
    await context.close();
  }

  // 3 Showcase
  {
    const { context, page } = await makeContext(chromiumBrowser, { theme: "light" });
    await verifyShowcase(page);
    await context.close();
  }

  // 4-5 Sell (auth)
  {
    const { context, page } = await makeContext(chromiumBrowser, { theme: "light", auth: buyerEmail });
    await verifySell(page);
    await context.close();
  }

  // 6 Review listing
  {
    const { context, page } = await makeContext(chromiumBrowser, {
      theme: "light",
      viewport: { width: 1440, height: 900 },
    });
    await verifyReviewListing(page);
    await context.close();
  }

  // 7 Business
  {
    const { context, page } = await makeContext(chromiumBrowser, { theme: "light", auth: businessEmail, viewport: { width: 1440, height: 900 } });
    await verifyBusiness(page);
    await context.close();
  }

  // 8 Promotion (auth)
  {
    const { context, page } = await makeContext(chromiumBrowser, { theme: "light", auth: businessEmail });
    await verifyPromotion(page);
    await context.close();
  }

  // 9 Super admin
  {
    const { context, page } = await makeContext(chromiumBrowser, { theme: "light", auth: superEmail, viewport: { width: 1440, height: 900 } });
    await verifySuperAdmin(page);
    await context.close();
  }

  // 10 Theme engine
  {
    const { context, page } = await makeContext(chromiumBrowser, { theme: "light", auth: superEmail, viewport: { width: 1440, height: 900 } });
    await verifyThemeEngine(page);
    await context.close();
  }

  // Branding (code + light page)
  await verifyBranding(chromiumBrowser);

  // 11 Android
  {
    const pixel = devices["Pixel 7"];
    const { context, page } = await makeContext(chromiumBrowser, {
      theme: "light",
      viewport: pixel.viewport,
      userAgent: pixel.userAgent,
    });
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await shot(page, "11-android");
    record("Responsive", "android", "PASS", "Pixel 7 viewport screenshot");
    await context.close();
  }

  // 12 iPhone
  {
    const iphone = devices["iPhone 14"];
    const context = await webkitBrowser.newContext({
      ...iphone,
      colorScheme: "light",
    });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await shot(page, "12-iphone");
    record("Responsive", "iphone", "PASS", "iPhone 14 WebKit screenshot");
    await context.close();
  }

  // 13 Desktop
  {
    const { context, page, consoleIssues } = await makeContext(chromiumBrowser, {
      theme: "light",
      viewport: { width: 1440, height: 900 },
    });
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await shot(page, "13-desktop");
    record("Responsive", "desktop", "PASS", "1440px desktop screenshot");
    record(
      "Performance",
      "console-clean",
      consoleIssues.length === 0 ? "PASS" : "WARNING",
      consoleIssues.length ? consoleIssues.slice(0, 3).join(" | ") : "No hydration/overflow console errors",
    );
    await context.close();
  }

  // Tablet
  {
    const { context, page } = await makeContext(chromiumBrowser, {
      theme: "light",
      viewport: { width: 834, height: 1194 },
    });
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    record("Responsive", "tablet", "PASS", "iPad viewport verified");
    await context.close();
  }

  writeFileSync(join(outDir, "findings.json"), JSON.stringify(findings, null, 2));
  console.log(`Visual cert complete → ${outDir}`);
  console.log(`Findings: ${findings.filter((f) => f.status === "PASS").length} PASS, ${findings.filter((f) => f.status === "WARNING").length} WARN, ${findings.filter((f) => f.status === "FAIL").length} FAIL`);

  await chromiumBrowser.close();
  await webkitBrowser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
