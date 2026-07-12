#!/usr/bin/env node
/** Canonical Homepage — Playwright validation. */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = join(process.cwd(), "reports", "module-1", "homepage-canonical");
const prior = join(process.cwd(), "reports/module-1/homepage-mobile-v1/after-iphone17promax.png");

mkdirSync(outDir, { recursive: true });
if (existsSync(prior)) copyFileSync(prior, join(outDir, "before-prior-implementation.png"));

async function measure(page) {
  await page.locator('[data-hp-listing-card="official"]').first().waitFor({ state: "visible", timeout: 90_000 });

  return page.evaluate(() => {
    const card = document.querySelector('[data-hp-listing-card="official"]');
    const cardRect = card?.getBoundingClientRect();
    const img = card?.querySelector("figure");
    const imgRect = img?.getBoundingClientRect();
    const body = card?.querySelector('[class*="body"]');
    const protection = card?.querySelector('[class*="protection"]');
    const footer = card?.querySelector('[class*="footer"]');
    const grid = document.querySelector('[class*="feedGrid"]');
    const gridStyle = grid ? getComputedStyle(grid) : null;
    const storeCard = document.querySelector(
      '[data-hp-featured-store] [data-hp-listing-card="official"]',
    );
    const store = document.querySelector('[data-hp-featured-store-version="v1.0-canonical"]');
    const byi = document.querySelector('[class*="byi"]');
    const homepage = document.querySelector('[data-hp-homepage="canonical"]');
    const cards = [...document.querySelectorAll('[data-hp-listing-card="official"]')].slice(0, 2);
    const docWidth = document.documentElement.clientWidth;
    const overflowPx = Math.max(0, document.documentElement.scrollWidth - docWidth);

    return {
      homepageVersion: homepage?.getAttribute("data-hp-homepage-version"),
      listingVersion: card?.getAttribute("data-hp-listing-version"),
      storesVersion: store?.getAttribute("data-hp-featured-store-version"),
      storesTitle: store?.querySelector("h2")?.textContent ?? null,
      overflowPx,
      card: card
        ? { w: Math.round(cardRect.width), h: Math.round(cardRect.height) }
        : null,
      image: imgRect ? { w: Math.round(imgRect.width), h: Math.round(imgRect.height) } : null,
      imagePct: imgRect && cardRect ? Math.round((imgRect.height / cardRect.height) * 100) : null,
      imageAspect: imgRect ? Math.round((imgRect.width / imgRect.height) * 1000) / 1000 : null,
      hasProtection: Boolean(protection),
      hasFooter: Boolean(footer),
      bodyPadding: body ? getComputedStyle(body).padding : null,
      gridGap: gridStyle?.columnGap ?? null,
      storeCard: storeCard
        ? {
            w: Math.round(storeCard.getBoundingClientRect().width),
            h: Math.round(storeCard.getBoundingClientRect().height),
          }
        : null,
      byiH: byi ? Math.round(byi.getBoundingClientRect().height) : null,
      sameRow:
        cards.length >= 2
          ? Math.abs(cards[0].getBoundingClientRect().top - cards[1].getBoundingClientRect().top) < 8
          : false,
    };
  });
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 440, height: 956 });
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.locator('[data-hp-homepage="canonical"]').waitFor({ state: "visible", timeout: 90_000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(outDir, "after-iphone17promax.png"), type: "png" });
  const audit = await measure(page);
  writeFileSync(join(outDir, "computed-css.json"), JSON.stringify(audit, null, 2));

  const checks = [
    ["canonical homepage", audit.homepageVersion === "1.0"],
    ["official listing", audit.listingVersion === "official-2.1"],
    ["canonical store", audit.storesVersion === "ui-lock-1.0"],
    ["no STORES title", audit.storesTitle === null],
    ["image aspect 160:220", audit.imageAspect != null && Math.abs(audit.imageAspect - 160 / 220) < 0.03],
    ["image ~60%+", audit.imagePct != null && audit.imagePct >= 58 && audit.imagePct <= 72],
    ["buyer protection line", audit.hasProtection === true],
    ["seller footer", audit.hasFooter === true],
    ["body padding fluid", audit.bodyPadding != null],
    ["grid gap fluid", audit.gridGap != null && parseFloat(audit.gridGap) >= 10],
    ["store aspect 112:206", audit.storeCard != null && Math.abs(audit.storeCard.w / audit.storeCard.h - 112 / 206) < 0.03],
    ["BYI min 72px", audit.byiH != null && audit.byiH >= 72],
    ["mobile 2-col", audit.sameRow === true],
    ["no page overflow", audit.overflowPx <= 1],
  ];

  const allPass = checks.every(([, ok]) => ok);
  for (const [label, ok] of checks) console.log(`${ok ? "PASS" : "FAIL"} — ${label}`);

  writeFileSync(
    join(outDir, "VISUAL_AUDIT.md"),
    `# Canonical Homepage Visual Audit\n\nStatus: ${allPass ? "PASS" : "FAIL"}\n\n${checks.map(([l, ok]) => `- ${ok ? "PASS" : "FAIL"} — ${l}`).join("\n")}\n`,
  );

  await browser.close();
  console.log("Artifacts:", outDir);
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
