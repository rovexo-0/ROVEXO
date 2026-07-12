#!/usr/bin/env node
/** Homepage Mobile v1.0 — Playwright visual audit + before/after screenshots. */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = join(process.cwd(), "reports", "module-1", "homepage-mobile-v1");
const prior = join(process.cwd(), "reports/module-1/listing-card-v4/homepage-iphone17promax-v4-fresh.png");

mkdirSync(outDir, { recursive: true });

if (existsSync(prior)) {
  copyFileSync(prior, join(outDir, "before-mobile-v4-prior.png"));
}

async function measure(page) {
  const card = page.locator('[data-hp-listing-card="official"]').first();
  await card.waitFor({ state: "visible", timeout: 90_000 });

  return page.evaluate(() => {
    const pick = (el, sel) => {
      const node = el?.querySelector(sel);
      if (!node) return null;
      const s = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        width: s.width,
        height: s.height,
        padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        rect: { w: Math.round(rect.width), h: Math.round(rect.height) },
      };
    };

    const cardEl = document.querySelector('[data-hp-listing-card="official"]');
    const cardRect = cardEl?.getBoundingClientRect();
    const imgRect = cardEl?.querySelector("figure")?.getBoundingClientRect();
    const grid = document.querySelector('[class*="feedGrid"]');
    const gridStyle = grid ? getComputedStyle(grid) : null;
    const storeCard = document.querySelector(
      '[data-hp-featured-store] [data-hp-listing-card="official"]',
    );
    const stores = document.querySelector('[data-hp-featured-store-version="v1.0-canonical"]');
    const byi = document.querySelector('[class*="byi"]');
    const homepage = document.querySelector('[data-hp-homepage="canonical"]');

    const cards = [...document.querySelectorAll('[data-hp-listing-card="official"]')].slice(0, 2);
    const sameRow =
      cards.length >= 2
        ? Math.abs(cards[0].getBoundingClientRect().top - cards[1].getBoundingClientRect().top) < 8
        : false;

    return {
      homepageVersion: homepage?.getAttribute("data-hp-homepage-version"),
      storesVersion: stores?.getAttribute("data-hp-featured-store-version"),
      storesTitle: stores?.querySelector("h2")?.textContent ?? null,
      card: cardEl
        ? {
            width: getComputedStyle(cardEl).width,
            height: getComputedStyle(cardEl).height,
            rect: { w: Math.round(cardRect.width), h: Math.round(cardRect.height) },
          }
        : null,
      image: pick(cardEl, "figure"),
      imagePct: imgRect && cardRect ? Math.round((imgRect.height / cardRect.height) * 100) : null,
      body: pick(cardEl, "a > div"),
      gridGap: gridStyle?.columnGap ?? null,
      gridRowGap: gridStyle?.rowGap ?? null,
      storeCard: storeCard
        ? {
            width: getComputedStyle(storeCard).width,
            height: getComputedStyle(storeCard).height,
            rect: {
              w: Math.round(storeCard.getBoundingClientRect().width),
              h: Math.round(storeCard.getBoundingClientRect().height),
            },
          }
        : null,
      storeAvatar: pick(stores, '[class*="avatar"]'),
      byi: byi
        ? {
            height: getComputedStyle(byi).height,
            rect: { h: Math.round(byi.getBoundingClientRect().height) },
          }
        : null,
      sameRow,
    };
  });
}

async function capture(page, outPath, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.locator('[data-hp-homepage="canonical"]').waitFor({ state: "visible", timeout: 90_000 });
  await page.locator('[data-hp-listing-card="official"]').first().waitFor({ state: "visible", timeout: 90_000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: outPath, type: "png", fullPage: false });
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const iphone = { width: 440, height: 956 };
  await capture(page, join(outDir, "after-iphone17promax.png"), iphone);

  const audit = await measure(page);
  writeFileSync(join(outDir, "computed-css.json"), JSON.stringify(audit, null, 2));

  const checks = [
    ["canonical homepage", audit.homepageVersion === "1.0"],
    ["canonical store", audit.storesVersion === "ui-lock-1.0"],
    ["no STORES title", audit.storesTitle === null],
    ["card 160×340", audit.card?.width === "160px" && audit.card?.rect.h === 340],
    ["image 220px", audit.image?.height === "220px"],
    ["image ~65%", audit.imagePct != null && audit.imagePct >= 64 && audit.imagePct <= 66],
    ["body padding 10px", audit.body?.padding === "10px 10px 10px 10px"],
    ["grid gap 12px", audit.gridGap === "12px"],
    ["store card 112×206", audit.storeCard?.width === "112px" && audit.storeCard?.rect.h === 206],
    ["BYI 72px", audit.byi?.height === "72px"],
    ["mobile 2-col row", audit.sameRow === true],
  ];

  const lines = checks.map(([label, ok]) => `- ${ok ? "PASS" : "FAIL"} — ${label}`);
  const allPass = checks.every(([, ok]) => ok);

  for (const [label, ok] of checks) {
    console.log(`${ok ? "PASS" : "FAIL"} — ${label}`);
  }

  const report = [
    "# Canonical Homepage Mobile Visual Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Before / After",
    "",
    "- `before-mobile-v4-prior.png` — prior v4 feed screenshot",
    "- `after-iphone17promax.png` — mobile v1.0 iPhone 17 Pro Max",
    "",
    "## UI Status",
    "",
    allPass ? "**PASS — Ready for UI LOCK approval**" : "**FAIL — review checklist**",
    "",
    "## Checklist",
    "",
    ...lines,
    "",
    "## Dimensions",
    "",
    "```json",
    JSON.stringify(audit, null, 2),
    "```",
    "",
  ].join("\n");

  writeFileSync(join(outDir, "VISUAL_AUDIT.md"), report);
  await browser.close();
  console.log("\nArtifacts:", outDir);
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
