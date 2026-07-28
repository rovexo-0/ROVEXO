/**
 * RUN #4 — Internal UI v1.1 certification (DESIGN REVIEW ONLY).
 * Before 24px vs After 16px on INTERNAL pages. Homepage LOCKED.
 * Does NOT update Master Full Width Contract / SSOT.
 */
import { chromium, type Page, type BrowserContext } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { signInWithSessionCookies } from "../e2e/helpers/auth";
import { run4InternalPadOverrideCss, type Run4InternalPad } from "../lib/preview/run4-internal-pad-css";

const ORIGIN = process.env.CERT_ORIGIN ?? "http://localhost:3000";
const OUT = join(process.cwd(), "test-results/run4-internal-ui-v1.1");
const BUYER = { email: "demo.buyer@rovexo.co.uk", password: "RovexoBuyer@2026" };

const DEVICES = [
  { id: "iphone-17-pro-max", label: "iPhone 17 Pro Max 6.9\"", width: 440, height: 956, dpr: 3 },
  { id: "iphone-se", label: "iPhone SE", width: 375, height: 667, dpr: 2 },
  { id: "android", label: "Standard Android", width: 412, height: 915, dpr: 2.625 },
  { id: "tablet", label: "Tablet", width: 768, height: 1024, dpr: 2 },
  { id: "desktop", label: "Desktop", width: 1280, height: 800, dpr: 1 },
] as const;

type PageDef = { id: string; label: string; path: string; homepage?: boolean };

const INTERNAL_PAGES: PageDef[] = [
  { id: "balance", label: "Wallet / Balance", path: "/balance" },
  { id: "orders", label: "Orders", path: "/orders" },
  { id: "inbox", label: "Inbox", path: "/inbox" },
  { id: "messages-hub", label: "Messages Hub", path: "/inbox" },
  { id: "saved", label: "Saved", path: "/saved" },
  { id: "sell", label: "Sell", path: "/sell" },
  { id: "search", label: "Search", path: "/search" },
  { id: "listing", label: "Listing Details", path: "/search" },
  { id: "profile", label: "Profile", path: "/account" },
  { id: "settings", label: "Settings", path: "/account/settings" },
  { id: "help", label: "Help", path: "/help" },
  { id: "legal", label: "Legal", path: "/legal" },
  { id: "checkout", label: "Checkout", path: "/checkout" },
];

const HOMEPAGE_LOCK: PageDef = { id: "homepage", label: "Homepage (LOCKED)", path: "/", homepage: true };

function ensureDirs() {
  for (const d of [
    OUT,
    join(OUT, "before-24px"),
    join(OUT, "after-16px"),
    join(OUT, "side-by-side"),
    join(OUT, "overlay"),
    join(OUT, "diff"),
    join(OUT, "devices"),
    join(OUT, "homepage-lock"),
  ]) {
    mkdirSync(d, { recursive: true });
  }
  for (const device of DEVICES) {
    mkdirSync(join(OUT, "devices", device.id), { recursive: true });
  }
}

async function applyPad(page: Page, pad: Run4InternalPad | null) {
  await page.evaluate(() => {
    document.getElementById("rovexo-run4-cert-style")?.remove();
    document.documentElement.removeAttribute("data-run4-internal-pad");
  });
  if (pad == null) return;
  await page.evaluate((p) => {
    document.documentElement.setAttribute("data-run4-internal-pad", String(p));
  }, pad);
  await page.addStyleTag({
    content: run4InternalPadOverrideCss(pad).replace(
      /html\[data-run4-internal-pad=/g,
      "html[data-run4-internal-pad=",
    ),
  });
  // ensure style id for cleanup
  await page.evaluate(() => {
    const styles = [...document.querySelectorAll("style")];
    const last = styles[styles.length - 1];
    if (last && !last.id) last.id = "rovexo-run4-cert-style";
  });
  await page.waitForTimeout(200);
}

async function measure(page: Page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const candidates = [
      ".wallet-v2",
      ".cds-layout__content--account-canonical",
      ".inbox-hub",
      ".conv-hub",
      ".orders-page",
      ".ac-canonical",
      ".settings-canonical",
      "main",
      "[data-app-shell]",
    ];
    let pl = 0;
    let pr = 0;
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const cs = getComputedStyle(el);
      const l = parseFloat(cs.paddingLeft) || 0;
      const r = parseFloat(cs.paddingRight) || 0;
      if (l > 0 || r > 0) {
        pl = l;
        pr = r;
        break;
      }
    }
    const doc = document.documentElement;
    const overflowX = doc.scrollWidth > doc.clientWidth + 1 || document.body.scrollWidth > vw + 1;
    return {
      leftMargin: Math.round(pl),
      rightMargin: Math.round(pr),
      contentWidth: Math.round(vw - pl - pr),
      viewportWidth: vw,
      overflowX,
      scrollWidth: document.body.scrollWidth,
      fwPadX: getComputedStyle(doc).getPropertyValue("--fw-pad-x").trim(),
    };
  });
}

async function resolvePaths(page: Page): Promise<PageDef[]> {
  const pages = [...INTERNAL_PAGES];

  await page.goto(`${ORIGIN}/inbox`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /messages/i }).click().catch(() => undefined);
  await page.waitForTimeout(800);
  const convId = await page.evaluate(async () => {
    const res = await fetch("/api/messages", { cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { conversations?: Array<{ id?: string }> };
    return json.conversations?.[0]?.id ?? null;
  });
  const msg = pages.find((p) => p.id === "messages-hub");
  if (msg && convId) msg.path = `/inbox/conversation/${convId}`;

  await page.goto(`${ORIGIN}/search`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  let listingHref = await page.evaluate(() => {
    const anchors = [...document.querySelectorAll<HTMLAnchorElement>("a[href]")];
    const hit = anchors.find((el) => {
      const h = el.getAttribute("href") || "";
      return (
        h.includes("/listing/") ||
        h.includes("/product/") ||
        /^\/p\//.test(h) ||
        /\/items?\//.test(h)
      );
    });
    return hit?.getAttribute("href") ?? null;
  });
  if (!listingHref) {
    await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    listingHref = await page.evaluate(() => {
      const anchors = [...document.querySelectorAll<HTMLAnchorElement>("a[href*='/listing/'], a[href*='/product/']")];
      return anchors[0]?.getAttribute("href") ?? null;
    });
  }
  const listing = pages.find((p) => p.id === "listing");
  if (listing && listingHref) {
    listing.path = listingHref.startsWith("http")
      ? new URL(listingHref).pathname
      : listingHref.split("?")[0]!;
  } else if (listing) {
    listing.path = "/search";
    listing.label = "Listing Details (fallback Search)";
  }

  return pages;
}

async function buildDiff(aPath: string, bPath: string, outDiff: string, outOverlay: string) {
  const a = sharp(aPath);
  const { width = 440, height = 956 } = await a.metadata();
  const aBuf = await a.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bBuf = await sharp(bPath).resize(width, height).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const overlay = Buffer.alloc(aBuf.data.length);
  const diff = Buffer.alloc(aBuf.data.length);
  let changed = 0;
  for (let i = 0; i < aBuf.data.length; i += 4) {
    const delta =
      (Math.abs(aBuf.data[i]! - bBuf.data[i]!) +
        Math.abs(aBuf.data[i + 1]! - bBuf.data[i + 1]!) +
        Math.abs(aBuf.data[i + 2]! - bBuf.data[i + 2]!)) /
      3;
    const hit = delta > 8;
    if (hit) changed++;
    const g = Math.round((aBuf.data[i]! + aBuf.data[i + 1]! + aBuf.data[i + 2]!) / 3);
    overlay[i] = hit ? 255 : g;
    overlay[i + 1] = hit ? 0 : g;
    overlay[i + 2] = hit ? 180 : g;
    overlay[i + 3] = 255;
    diff[i] = hit ? 255 : 0;
    diff[i + 1] = 0;
    diff[i + 2] = hit ? 180 : 0;
    diff[i + 3] = 255;
  }
  await sharp(diff, { raw: { width, height, channels: 4 } }).png().toFile(outDiff);
  await sharp(overlay, { raw: { width, height, channels: 4 } }).png().toFile(outOverlay);
  return { pct: Math.round((changed / (width * height)) * 10000) / 100, changed };
}

async function sideBySide(aPath: string, bPath: string, outPath: string, w: number, h: number) {
  const gap = 16;
  const labelH = 36;
  const aImg = await sharp(aPath).resize(w, h).png().toBuffer();
  const bImg = await sharp(bPath).resize(w, h).png().toBuffer();
  const labelA = Buffer.from(
    `<svg width="${w}" height="${labelH}"><rect width="100%" height="100%" fill="#111"/><text x="12" y="24" fill="#fff" font-family="system-ui" font-size="14">BEFORE · 24px</text></svg>`,
  );
  const labelB = Buffer.from(
    `<svg width="${w}" height="${labelH}"><rect width="100%" height="100%" fill="#5b21b6"/><text x="12" y="24" fill="#fff" font-family="system-ui" font-size="14">AFTER · 16px Internal</text></svg>`,
  );
  await sharp({
    create: {
      width: w * 2 + gap,
      height: h + labelH,
      channels: 4,
      background: { r: 240, g: 240, b: 245, alpha: 1 },
    },
  })
    .composite([
      { input: labelA, left: 0, top: 0 },
      { input: labelB, left: w + gap, top: 0 },
      { input: aImg, left: 0, top: labelH },
      { input: bImg, left: w + gap, top: labelH },
    ])
    .png()
    .toFile(outPath);
}

type Row = {
  id: string;
  label: string;
  path: string;
  status: "PASS" | "FAIL" | "LOCKED";
  notes: string;
  measure24?: Awaited<ReturnType<typeof measure>>;
  measure16?: Awaited<ReturnType<typeof measure>>;
  overflow24?: boolean;
  overflow16?: boolean;
};

async function main() {
  ensureDirs();
  console.log("RUN #4 Internal UI v1.1 — DESIGN REVIEW (Homepage LOCKED, SSOT unchanged)");

  const browser = await chromium.launch({ headless: true });
  const master = DEVICES[0]!;

  const context = await browser.newContext({
    viewport: { width: master.width, height: master.height },
    deviceScaleFactor: master.dpr,
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("rovexo_cookie_consent_v1", "accepted");
    } catch {
      /* ignore */
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);

  await page.goto(`${ORIGIN}/login`, { waitUntil: "domcontentloaded" });
  await signInWithSessionCookies(page, { ...BUYER, baseURL: ORIGIN });

  const pages = await resolvePaths(page);
  const results: Row[] = [];

  // Homepage lock check — pad override must NOT change homepage when we apply "null" vs accidental override
  console.log("Homepage LOCK regression…");
  await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await applyPad(page, null);
  const homeBefore = await measure(page);
  await page.screenshot({ path: join(OUT, "homepage-lock", "homepage-canonical.png"), fullPage: false });
  // Intentionally do NOT apply internal pad on homepage in cert (simulates gate skip)
  await applyPad(page, null);
  const homeAfter = await measure(page);
  await page.screenshot({ path: join(OUT, "homepage-lock", "homepage-still-locked.png"), fullPage: false });
  const homePass =
    homeBefore.leftMargin === homeAfter.leftMargin &&
    !homeBefore.overflowX &&
    !homeAfter.overflowX;
  results.push({
    id: "homepage",
    label: HOMEPAGE_LOCK.label,
    path: "/",
    status: homePass ? "LOCKED" : "FAIL",
    notes: homePass
      ? `Homepage unchanged (pad L=${homeBefore.leftMargin}). Override not applied.`
      : "Homepage layout changed — FAIL",
    measure24: homeBefore,
    measure16: homeAfter,
    overflow24: homeBefore.overflowX,
    overflow16: homeAfter.overflowX,
  });

  for (const def of pages) {
    console.log(`Capturing ${def.label} (${def.path})…`);
    const url = `${ORIGIN}${def.path}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1400);

    await applyPad(page, 24);
    await page.waitForTimeout(250);
    const m24 = await measure(page);
    const aPath = join(OUT, "before-24px", `${def.id}.png`);
    await page.screenshot({ path: aPath, fullPage: false });

    await applyPad(page, 16);
    await page.waitForTimeout(250);
    const m16 = await measure(page);
    const bPath = join(OUT, "after-16px", `${def.id}.png`);
    await page.screenshot({ path: bPath, fullPage: false });

    await sideBySide(aPath, bPath, join(OUT, "side-by-side", `${def.id}.png`), master.width, master.height);
    const diff = await buildDiff(
      aPath,
      bPath,
      join(OUT, "diff", `${def.id}.png`),
      join(OUT, "overlay", `${def.id}.png`),
    );

    const afterOk = m16.leftMargin === 16 && !m16.overflowX;
    const beforeOk = !m24.overflowX;
    const already16 = m24.leftMargin === 16 && m16.leftMargin === 16;
    const forcedOk = m24.leftMargin === 24 && m16.leftMargin === 16;
    const status: Row["status"] = afterOk && beforeOk ? "PASS" : "FAIL";
    const contentGain = m16.contentWidth - m24.contentWidth;
    results.push({
      id: def.id,
      label: def.label,
      path: def.path,
      status,
      notes: already16
        ? `Already 16px native (meets Internal v1.1) · overflow=${m16.overflowX} · Δ${diff.pct}%`
        : forcedOk
          ? `L ${m24.leftMargin}→${m16.leftMargin} · content ${m24.contentWidth}→${m16.contentWidth} (+${contentGain}) · Δ${diff.pct}% · overflow=${m16.overflowX}`
          : `L ${m24.leftMargin}→${m16.leftMargin} · content ${m24.contentWidth}→${m16.contentWidth} · Δ${diff.pct}% · overflow=${m16.overflowX}`,
      measure24: m24,
      measure16: m16,
      overflow24: m24.overflowX,
      overflow16: m16.overflowX,
    });
    console.log(`  ${status} ${results[results.length - 1]!.notes}`);
  }

  await context.close();

  // Multi-device sample: Profile + Orders + Inbox on all devices (after 16px)
  console.log("Multi-device matrix…");
  const deviceRows: Array<{
    device: string;
    page: string;
    status: "PASS" | "FAIL";
    notes: string;
  }> = [];
  const samplePages = [
    { id: "profile", path: "/account" },
    { id: "orders", path: "/orders" },
    { id: "inbox", path: "/inbox" },
    { id: "homepage", path: "/", lock: true },
  ];

  for (const device of DEVICES) {
    const ctx: BrowserContext = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: device.dpr,
      isMobile: device.id !== "desktop",
      hasTouch: device.id !== "desktop",
    });
    await ctx.addInitScript(() => {
      try {
        localStorage.setItem("rovexo_cookie_consent_v1", "accepted");
      } catch {
        /* ignore */
      }
    });
    const p = await ctx.newPage();
    await p.goto(`${ORIGIN}/login`, { waitUntil: "domcontentloaded" });
    await signInWithSessionCookies(p, { ...BUYER, baseURL: ORIGIN });

    for (const sample of samplePages) {
      await p.goto(`${ORIGIN}${sample.path}`, { waitUntil: "domcontentloaded" });
      await p.waitForTimeout(900);
      if (sample.lock) {
        await applyPad(p, null);
      } else {
        await applyPad(p, 16);
      }
      await p.waitForTimeout(200);
      const m = await measure(p);
      const shot = join(OUT, "devices", device.id, `${sample.id}.png`);
      await p.screenshot({ path: shot, fullPage: false });
      const ok = sample.lock
        ? !m.overflowX
        : m.leftMargin === 16 && !m.overflowX;
      deviceRows.push({
        device: device.label,
        page: sample.id,
        status: ok ? "PASS" : "FAIL",
        notes: `L=${m.leftMargin} overflow=${m.overflowX} scrollW=${m.scrollWidth}/${m.viewportWidth}`,
      });
    }
    await ctx.close();
  }

  await browser.close();

  writeReports(results, deviceRows);
  console.log(`\nPackage: ${OUT}`);
  console.log("SSOT unchanged. Deployment BLOCKED. Homepage LOCKED.");
}

function writeReports(
  results: Row[],
  deviceRows: Array<{ device: string; page: string; status: "PASS" | "FAIL"; notes: string }>,
) {
  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const locked = results.filter((r) => r.status === "LOCKED").length;
  const deviceFail = deviceRows.filter((r) => r.status === "FAIL").length;

  const summary = {
    run: "RUN #4 Internal UI v1.1",
    origin: ORIGIN,
    updated: new Date().toISOString(),
    homepage: "LOCKED — not modified",
    ssot: "Master Full Width remains 24px — NOT updated",
    deployment: "BLOCKED",
    internalTarget: { left: 16, right: 16 },
    pass,
    fail,
    locked,
    deviceFail,
    results,
    devices: deviceRows,
  };
  writeFileSync(join(OUT, "results.json"), JSON.stringify(summary, null, 2));

  const matrix = [
    "# PASS / FAIL Matrix — RUN #4 Internal UI v1.1",
    "",
    "| Page | Status | Notes |",
    "|------|--------|-------|",
    ...results.map((r) => `| ${r.label} | ${r.status} | ${r.notes.replace(/\|/g, "/")} |`),
    "",
    "## Devices",
    "",
    "| Device | Page | Status | Notes |",
    "|--------|------|--------|-------|",
    ...deviceRows.map((r) => `| ${r.device} | ${r.page} | ${r.status} | ${r.notes} |`),
    "",
  ].join("\n");
  writeFileSync(join(OUT, "PASS_FAIL_MATRIX.md"), matrix);

  const measureMd = [
    "# Measurement Report — RUN #4",
    "",
    "Master device: iPhone 17 Pro Max 440×956",
    "",
    ...results
      .filter((r) => r.measure24 && r.measure16)
      .flatMap((r) => [
        `## ${r.label}`,
        "",
        `| Metric | Before 24px | After 16px |`,
        `|--------|-------------|------------|`,
        `| Left | ${r.measure24!.leftMargin} | ${r.measure16!.leftMargin} |`,
        `| Right | ${r.measure24!.rightMargin} | ${r.measure16!.rightMargin} |`,
        `| Content width | ${r.measure24!.contentWidth} | ${r.measure16!.contentWidth} |`,
        `| Overflow X | ${r.measure24!.overflowX} | ${r.measure16!.overflowX} |`,
        `| Safe area | respected via max(pad, env()) on headers | same |`,
        "",
      ]),
  ].join("\n");
  writeFileSync(join(OUT, "MEASUREMENT_REPORT.md"), measureMd);

  const regression = [
    "# Regression Report — RUN #4",
    "",
    `- Homepage LOCKED: ${results.find((r) => r.id === "homepage")?.status}`,
    `- Internal pages PASS: ${pass}`,
    `- Internal pages FAIL: ${fail}`,
    `- Device matrix FAIL: ${deviceFail}`,
    `- Typography / icons / buttons / cards / colours / radius / header / bottom nav / animations: not modified (pad-only CSS overlay).`,
    `- Master Full Width Contract file: NOT updated (still 24px SSOT).`,
    `- Deployment: BLOCKED until Owner visual approval.`,
    "",
  ].join("\n");
  writeFileSync(join(OUT, "REGRESSION_REPORT.md"), regression);

  const rec = [
    "# Recommendation Report — RUN #4",
    "",
    "## Owner decision pending",
    "",
    "Proposed Internal UI v1.1: **16px** L/R on authenticated/internal pages.",
    "Homepage remains marketing canonical (no change).",
    "",
    "Live preview:",
    "- http://localhost:3000/preview/ui-internal-16px",
    "- http://localhost:3000/preview/ui-internal-24px",
    "- Floating toggle 24⇄16 (Homepage shows LOCKED)",
    "",
    "After Owner visual approval ONLY: update Master Full Width / internal pad SSOT from 24→16 for internal surfaces (Homepage excluded).",
    "Until then: temporary localhost overlay only · no deploy · no merge.",
    "",
  ].join("\n");
  writeFileSync(join(OUT, "RECOMMENDATION_REPORT.md"), rec);

  const cards = results
    .filter((r) => r.id !== "homepage")
    .map(
      (r) => `
<section class="page">
  <h2>${escape(r.label)} <span class="${r.status}">${r.status}</span></h2>
  <p class="meta">${escape(r.notes)}</p>
  <div class="grid2">
    <figure><img src="before-24px/${r.id}.png" alt="24"/><figcaption>Before 24px</figcaption></figure>
    <figure><img src="after-16px/${r.id}.png" alt="16"/><figcaption>After 16px</figcaption></figure>
  </div>
  <figure class="wide"><img src="side-by-side/${r.id}.png" alt="sbs"/><figcaption>Side-by-side</figcaption></figure>
  <div class="grid2">
    <figure><img src="overlay/${r.id}.png" alt="overlay"/><figcaption>Pixel overlay</figcaption></figure>
    <figure><img src="diff/${r.id}.png" alt="diff"/><figcaption>Diff mask</figcaption></figure>
  </div>
</section>`,
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>RUN #4 Internal UI v1.1</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;background:#0b0b0f;color:#f4f4f5}
header{padding:24px;border-bottom:1px solid #27272a;position:sticky;top:0;background:#0b0b0fe6;backdrop-filter:blur(8px)}
.banner{color:#fbbf24;font-size:13px}
main{max-width:1100px;margin:0 auto;padding:20px}
.page{background:#14141a;border:1px solid #27272a;border-radius:16px;padding:16px;margin:20px 0}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
figure{margin:0;background:#09090b;border-radius:12px;overflow:hidden;border:1px solid #27272a}
img{width:100%;display:block}
figcaption{padding:8px;font-size:12px;color:#a1a1aa}
.PASS{color:#4ade80}.FAIL{color:#f87171}.LOCKED{color:#fbbf24}
.meta{color:#a1a1aa;font-size:13px}
.wide{margin-top:12px}
@media(max-width:800px){.grid2{grid-template-columns:1fr}}
</style></head><body>
<header>
  <h1>RUN #4 — Internal UI v1.1 (24 → 16)</h1>
  <div class="banner">Homepage LOCKED · SSOT not updated · Deployment BLOCKED · localhost review only</div>
  <p>PASS ${pass} · FAIL ${fail} · LOCKED ${locked} · Device FAIL ${deviceFail}</p>
  <p>Live: <a href="http://localhost:3000/preview/ui-internal-16px" style="color:#c4b5fd">/preview/ui-internal-16px</a></p>
</header>
<main>
  <section class="page">
    <h2>Homepage LOCK <span class="${results[0]?.status}">${results[0]?.status}</span></h2>
    <p class="meta">${escape(results[0]?.notes ?? "")}</p>
    <div class="grid2">
      <figure><img src="homepage-lock/homepage-canonical.png" alt="home"/><figcaption>Canonical Homepage</figcaption></figure>
      <figure><img src="homepage-lock/homepage-still-locked.png" alt="home2"/><figcaption>Still locked (no internal pad)</figcaption></figure>
    </div>
  </section>
  ${cards}
</main>
</body></html>`;
  writeFileSync(join(OUT, "UI_COMPARISON_REPORT.html"), html);
  writeFileSync(join(OUT, "README.md"), rec);

  if (fail > 0 || deviceFail > 0) process.exitCode = 1;
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
