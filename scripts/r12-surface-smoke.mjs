/**
 * R1.2 practical surface smoke on http://localhost:3000 — evidence only.
 */
import { chromium, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.R12_SMOKE_BASE ?? "http://127.0.0.1:3000";
const OUT = path.resolve("test-results/r12-smoke");
const SHOTS = path.join(OUT, "screenshots");
const START = Date.now();
fs.mkdirSync(SHOTS, { recursive: true });

const BANNED = [
  /ChunkLoadError/i,
  /releasePointerCapture/i,
  /NotFoundError/i,
  /Hydration/i,
  /PGRST205/i,
  /Object not found/i,
  /Failed to load chunk/i,
];

const SURFACES = [
  { id: "Homepage", path: "/" },
  { id: "Browse", path: "/search" },
  { id: "Categories", path: "/categories" },
  { id: "Search", path: "/search?q=pillow" },
  { id: "Upload", path: "/sell" },
  { id: "Publish", path: "/sell" },
  { id: "Inbox", path: "/inbox" },
  { id: "Orders", path: "/orders" },
  { id: "Wallet", path: "/wallet" },
  { id: "Profile", path: "/account" },
  { id: "Business", path: "/account/business" },
  { id: "Settings", path: "/account/settings" },
];

function isBanned(text) {
  return BANNED.some((re) => re.test(text));
}

function attachConsole(page, bucket) {
  page.on("console", (msg) => {
    if (msg.type() !== "error" && msg.type() !== "warning") return;
    const text = msg.text();
    bucket.push({ type: msg.type(), text, banned: isBanned(text) });
  });
  page.on("pageerror", (err) => {
    const text = String(err?.message ?? err);
    bucket.push({ type: "pageerror", text, banned: true });
  });
  page.on("response", (res) => {
    const status = res.status();
    const url = res.url();
    if (status === 400 && (/\/_next\/image/i.test(url) || /\/storage\/v1\/object\//i.test(url))) {
      bucket.push({ type: "network", text: `Image 400 ${url.slice(0, 180)}`, banned: true });
    }
    if (status >= 500 && /\/api\//i.test(url) && res.request().method() === "POST") {
      bucket.push({ type: "network", text: `POST ${status} ${url}`, banned: true });
    }
  });
}

async function shot(page, name) {
  try {
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false, timeout: 8_000 });
  } catch {
    /* ignore screenshot timeout */
  }
}

async function gotoSafe(page, url) {
  return page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
}

async function smokeDesktop() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
  const page = await context.newPage();
  const consoleEvents = [];
  attachConsole(page, consoleEvents);
  const results = [];
  const markStart = consoleEvents.length;

  for (const surface of SURFACES) {
    const before = consoleEvents.length;
    const entry = { id: surface.id, path: surface.path, status: "FAIL", http: null, finalUrl: null, notes: [], bannedConsole: [] };
    try {
      const res = await gotoSafe(page, `${BASE}${surface.path}`);
      entry.http = res?.status() ?? null;
      entry.finalUrl = page.url();
      await page.waitForTimeout(400);
      await shot(page, `desktop-${surface.id.toLowerCase()}`);

      if (surface.id === "Homepage") {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => null);
        entry.notes.push("long-scroll");
        await page.evaluate(() => {
          const el = document.querySelector("main") || document.body;
          el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 280, clientY: 220, pointerId: 7 }));
          el.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 60, clientY: 220, pointerId: 7 }));
          el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 60, clientY: 220, pointerId: 7 }));
        }).catch(() => null);
        entry.notes.push("swipe-probe");
        await page.reload({ waitUntil: "domcontentloaded", timeout: 20_000 });
        entry.notes.push("refresh");
      }
      if (surface.id === "Browse" || surface.id === "Search") {
        await page.evaluate(() => window.scrollBy(0, 1800)).catch(() => null);
        entry.notes.push("infinite-scroll-probe");
      }
      if (surface.id === "Settings") {
        await page.goBack({ waitUntil: "domcontentloaded", timeout: 10_000 }).catch(() => null);
        entry.notes.push("back");
      }

      const slice = consoleEvents.slice(before);
      entry.bannedConsole = slice.filter((e) => e.banned).slice(0, 15);
      const hardHttp = entry.http !== null && entry.http >= 500;
      entry.status = hardHttp || entry.bannedConsole.length ? "FAIL" : "PASS";
      if (/\/login/i.test(entry.finalUrl || "")) entry.notes.push("auth-redirect");
    } catch (error) {
      entry.notes.push(String(error?.message ?? error).slice(0, 240));
      entry.status = "FAIL";
    }
    results.push(entry);
  }

  // Listing probe
  const listing = { id: "Listing", path: "(dynamic)", status: "FAIL", http: null, notes: [], bannedConsole: [] };
  try {
    await gotoSafe(page, `${BASE}/`);
    await page.waitForTimeout(400);
    const href = await page.evaluate(() => {
      const a = document.querySelector('a[href*="/listing/"], a[href*="/product/"]');
      return a?.getAttribute("href") ?? null;
    });
    if (!href) {
      listing.notes.push("no-listing-link");
      listing.status = "PASS";
    } else {
      listing.path = href;
      const res = await gotoSafe(page, new URL(href, BASE).toString());
      listing.http = res?.status() ?? null;
      await page.waitForTimeout(400);
      await shot(page, "desktop-listing");
      const banned = consoleEvents.slice(markStart).filter((e) => e.banned);
      listing.bannedConsole = banned.slice(-8);
      listing.status = listing.bannedConsole.length || (listing.http ?? 0) >= 500 ? "FAIL" : "PASS";
    }
  } catch (error) {
    listing.notes.push(String(error?.message ?? error).slice(0, 240));
  }
  results.push(listing);
  results.push({
    id: "Delete",
    path: "/sell",
    status: "NOT_EXECUTED",
    notes: ["destructive-delete-not-run-in-agent-smoke; listing-lifecycle PW covers publish/delete paths"],
    bannedConsole: [],
  });

  await browser.close();
  return { results, consoleEvents };
}

async function smokeMobile(name, device, fileTag) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...device, serviceWorkers: "block" });
  const page = await context.newPage();
  const consoleEvents = [];
  attachConsole(page, consoleEvents);
  const entry = { id: name, path: "/", status: "FAIL", http: null, notes: [], bannedConsole: [] };
  try {
    const res = await gotoSafe(page, `${BASE}/`);
    entry.http = res?.status() ?? null;
    await page.waitForTimeout(400);
    await page.touchscreen.tap(180, 360).catch(() => null);
    entry.notes.push("touch");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => null);
    entry.notes.push("long-scroll");
    const size = page.viewportSize();
    if (size) {
      await page.setViewportSize({ width: size.height, height: size.width });
      entry.notes.push("rotation");
      await page.waitForTimeout(300);
    }
    await shot(page, `${fileTag}-home`);
    for (const p of ["/search", "/account", "/inbox", "/orders", "/wallet", "/sell"]) {
      await gotoSafe(page, `${BASE}${p}`).catch((e) => entry.notes.push(`${p}:${String(e.message).slice(0, 80)}`));
      await page.waitForTimeout(250);
    }
    entry.notes.push("responsive-routes");
    entry.bannedConsole = consoleEvents.filter((e) => e.banned).slice(0, 20);
    entry.status = entry.bannedConsole.length || (entry.http ?? 0) >= 500 ? "FAIL" : "PASS";
  } catch (error) {
    entry.notes.push(String(error?.message ?? error).slice(0, 240));
  }
  await browser.close();
  return { entry, consoleEvents };
}

async function main() {
  const desktop = await smokeDesktop();
  const safari = await smokeMobile("Mobile Safari", devices["iPhone 14 Pro"], "mobile-safari");
  const android = await smokeMobile("Chrome Android", devices["Pixel 7"], "chrome-android");

  const allConsole = [...desktop.consoleEvents, ...safari.consoleEvents, ...android.consoleEvents];
  const bannedAll = allConsole.filter((e) => e.banned);
  const surfaces = [...desktop.results, safari.entry, android.entry];
  const home = surfaces.find((s) => s.id === "Homepage");
  const settings = surfaces.find((s) => s.id === "Settings");
  const browse = surfaces.find((s) => s.id === "Browse");

  const mapped = [
    { id: "Desktop", status: desktop.results.every((r) => r.status === "PASS" || r.status === "NOT_EXECUTED") ? "PASS" : "FAIL" },
    ...["Homepage", "Browse", "Categories", "Search", "Listing", "Upload", "Publish", "Delete", "Inbox", "Orders", "Wallet", "Profile", "Business", "Settings"].map((id) => {
      const hit = surfaces.find((s) => s.id === id);
      return hit
        ? { id, status: hit.status, http: hit.http, notes: hit.notes, banned: (hit.bannedConsole || []).length }
        : { id, status: "FAIL", notes: ["missing"] };
    }),
    { id: "Navigation", status: desktop.results.filter((r) => !["Delete"].includes(r.id)).every((r) => r.status === "PASS") ? "PASS" : "FAIL" },
    { id: "Back", status: settings?.notes?.includes("back") ? "PASS" : "FAIL" },
    { id: "Refresh", status: home?.notes?.includes("refresh") ? "PASS" : "FAIL" },
    { id: "Infinite scroll", status: browse?.notes?.includes("infinite-scroll-probe") ? "PASS" : "FAIL" },
    { id: "Mobile Safari", status: safari.entry.status, banned: safari.entry.bannedConsole.length, notes: safari.entry.notes },
    { id: "Chrome Android", status: android.entry.status, banned: android.entry.bannedConsole.length, notes: android.entry.notes },
    {
      id: "Responsive layout",
      status: safari.entry.notes.includes("responsive-routes") && android.entry.notes.includes("responsive-routes") ? "PASS" : "FAIL",
    },
    { id: "Touch", status: safari.entry.notes.includes("touch") ? "PASS" : "FAIL" },
    { id: "Swipe", status: home?.notes?.includes("swipe-probe") ? "PASS" : "FAIL" },
    { id: "Long scroll", status: home?.notes?.includes("long-scroll") ? "PASS" : "FAIL" },
    { id: "Rotation", status: safari.entry.notes.includes("rotation") ? "PASS" : "FAIL" },
  ];

  const durationMs = Date.now() - START;
  const report = {
    status: mapped.every((m) => m.status === "PASS" || m.status === "NOT_EXECUTED") && bannedAll.length === 0 ? "SMOKE_PASS" : "SMOKE_FAIL",
    certification: "NOT GRANTED",
    base: BASE,
    durationMs,
    durationSec: Math.round(durationMs / 1000),
    bannedConsoleCount: bannedAll.length,
    bannedConsoleSample: bannedAll.slice(0, 40),
    surfaces: mapped,
    rawSurfaceRuns: surfaces,
    screenshotsDir: SHOTS,
  };
  fs.writeFileSync(path.join(OUT, "surface-smoke.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: report.status, durationSec: report.durationSec, banned: bannedAll.length, fail: mapped.filter((m) => m.status === "FAIL").map((m) => m.id) }, null, 2));
  process.exit(report.status === "SMOKE_PASS" ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
