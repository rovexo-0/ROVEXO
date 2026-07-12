#!/usr/bin/env node
/** Canonical Homepage — full responsive matrix validation. */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const HP_RESPONSIVE_VIEWPORTS = [
  { id: "iphone-se", label: "iPhone SE", width: 375, height: 667 },
  { id: "iphone-13", label: "iPhone 13", width: 390, height: 844 },
  { id: "iphone-15", label: "iPhone 15", width: 393, height: 852 },
  { id: "iphone-16", label: "iPhone 16", width: 393, height: 852 },
  { id: "iphone-pro-max", label: "iPhone Pro Max", width: 440, height: 956 },
  { id: "android-small", label: "Android Small", width: 360, height: 780 },
  { id: "android-medium", label: "Android Medium", width: 412, height: 915 },
  { id: "android-large", label: "Android Large", width: 480, height: 1014 },
  { id: "foldable", label: "Foldable", width: 717, height: 512 },
  { id: "tablet", label: "Tablet", width: 768, height: 1024 },
  { id: "ipad", label: "iPad", width: 820, height: 1180 },
  { id: "laptop", label: "Laptop", width: 1280, height: 800 },
  { id: "desktop", label: "Desktop", width: 1440, height: 900 },
  { id: "ultrawide", label: "UltraWide", width: 2560, height: 1080 },
];

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = join(process.cwd(), "reports", "module-1", "homepage-canonical-responsive");

mkdirSync(outDir, { recursive: true });

async function measure(page) {
  return page.evaluate(() => {
    const card = document.querySelector('[data-hp-listing-card="official"]');
    const cardRect = card?.getBoundingClientRect();
    const img = card?.querySelector("figure");
    const imgRect = img?.getBoundingClientRect();
    const storeCard = document.querySelector(
      '[data-hp-featured-store] [data-hp-listing-card="official"]',
    );
    const storeRect = storeCard?.getBoundingClientRect();
    const byi = document.querySelector('[class*="byi"]');
    const homepage = document.querySelector('[data-hp-homepage="canonical"]');
    const grid = document.querySelector('[class*="feedGrid"]');
    const gridStyle = grid ? getComputedStyle(grid) : null;
    const cards = [...document.querySelectorAll('[data-hp-listing-card="official"]')].slice(0, 2);

    const docWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const overflowPx = Math.max(0, scrollWidth - docWidth);

    return {
      homepageVersion: homepage?.getAttribute("data-hp-homepage-version"),
      listingVersion: card?.getAttribute("data-hp-listing-version"),
      card: cardRect
        ? { w: Math.round(cardRect.width), h: Math.round(cardRect.height) }
        : null,
      imagePct:
        imgRect && cardRect ? Math.round((imgRect.height / cardRect.height) * 100) : null,
      imageAspect: imgRect ? Math.round((imgRect.width / imgRect.height) * 1000) / 1000 : null,
      refImageAspect: Math.round((160 / 220) * 1000) / 1000,
      hasProtection: Boolean(card?.querySelector('[class*="protection"]')),
      hasFooter: Boolean(card?.querySelector('[class*="footer"]')),
      storeCard: storeRect
        ? { w: Math.round(storeRect.width), h: Math.round(storeRect.height) }
        : null,
      storeAspect: storeRect
        ? Math.round((storeRect.width / storeRect.height) * 1000) / 1000
        : null,
      refStoreAspect: Math.round((112 / 206) * 1000) / 1000,
      byiH: byi ? Math.round(byi.getBoundingClientRect().height) : null,
      gridCols: gridStyle?.gridTemplateColumns?.split(" ").length ?? 0,
      sameRow:
        cards.length >= 2
          ? Math.abs(cards[0].getBoundingClientRect().top - cards[1].getBoundingClientRect().top) < 8
          : false,
      overflowPx,
      docWidth,
    };
  });
}

async function main() {
  const browser = await chromium.launch();
  const results = [];

  for (const viewport of HP_RESPONSIVE_VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.locator('[data-hp-homepage="canonical"]').waitFor({ state: "visible", timeout: 90_000 });
    await page.locator('[data-hp-listing-card="official"]').first().waitFor({ state: "visible", timeout: 90_000 });
    await page.waitForTimeout(400);

    const audit = await measure(page);
    const expectedCols =
      viewport.width >= 1920
        ? 6
        : viewport.width >= 1440
          ? 5
          : viewport.width >= 1024
            ? 4
            : viewport.width >= 834
              ? 3
              : viewport.width >= 640
                ? 3
                : 2;

    const checks = [
      ["canonical homepage", audit.homepageVersion === "1.0"],
      ["official listing", audit.listingVersion === "official-2.1"],
      ["no horizontal overflow", audit.overflowPx <= 1],
      ["image aspect 160:220", audit.imageAspect != null && Math.abs(audit.imageAspect - audit.refImageAspect) < 0.03],
      ["image dominant", audit.imagePct != null && audit.imagePct >= 54 && audit.imagePct <= 75],
      ["buyer protection line", audit.hasProtection === true],
      ["seller footer", audit.hasFooter === true],
      ["store aspect ~112:206", audit.storeAspect == null || Math.abs(audit.storeAspect - audit.refStoreAspect) < 0.03],
      ["BYI min 72px", audit.byiH == null || audit.byiH >= 72],
      ["grid columns", audit.gridCols === expectedCols],
      ["mobile 2-col row", expectedCols > 2 || audit.sameRow === true],
    ];

    const pass = checks.every(([, ok]) => ok);
    results.push({ viewport: viewport.id, label: viewport.label, pass, checks, audit });

    const shot = join(outDir, `${viewport.id}.png`);
    await page.screenshot({ path: shot, type: "png", fullPage: false });
    await page.close();

    console.log(`${pass ? "PASS" : "FAIL"} — ${viewport.label} (${viewport.width}×${viewport.height})`);
    if (!pass) {
      for (const [label, ok] of checks) {
        if (!ok) console.log(`  FAIL — ${label}`);
      }
    }
  }

  writeFileSync(join(outDir, "responsive-audit.json"), JSON.stringify(results, null, 2));

  const report = [
    "# Canonical Homepage Responsive Audit",
    "",
    `Status: ${results.every((r) => r.pass) ? "PASS" : "FAIL"}`,
    "",
    ...results.map(
      (r) =>
        `- ${r.pass ? "PASS" : "FAIL"} — **${r.label}** (${r.audit.docWidth}px) — cols ${r.audit.gridCols}, card ${r.audit.card?.w}×${r.audit.card?.h}, overflow ${r.audit.overflowPx}px`,
    ),
    "",
  ].join("\n");

  writeFileSync(join(outDir, "RESPONSIVE_AUDIT.md"), report);
  await browser.close();

  console.log("\nArtifacts:", outDir);
  process.exit(results.every((r) => r.pass) ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
