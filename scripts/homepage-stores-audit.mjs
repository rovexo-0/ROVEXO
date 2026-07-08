#!/usr/bin/env node
/** STORES v1.0 — Playwright screenshots + computed CSS audit. */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = join(process.cwd(), "reports", "module-2", "homepage-stores");

mkdirSync(outDir, { recursive: true });

async function auditSection(page) {
  const section = page.locator("[data-home-stores]").first();
  await section.waitFor({ state: "visible", timeout: 90_000 });

  return section.evaluate((el) => {
    const pick = (sel) => {
      const node = el.querySelector(sel);
      if (!node) return null;
      const s = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        width: s.width,
        height: s.height,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
        margin: `${s.marginTop} ${s.marginRight} ${s.marginBottom} ${s.marginLeft}`,
        borderRadius: s.borderRadius,
        boxShadow: s.boxShadow,
        background: s.backgroundColor,
        color: s.color,
        rect: { w: Math.round(rect.width), h: Math.round(rect.height) },
      };
    };

    const cards = el.querySelectorAll("[data-store-card]");
    const card = cards[0];

    return {
      cardCount: cards.length,
      section: pick(":scope"),
      title: pick("h2"),
      header: pick("header"),
      visitBtn: pick('a[class*="visit"], header a:last-child'),
      viewStore: pick('a[class*="viewStore"]'),
      storeCard: card
        ? {
            width: getComputedStyle(card).width,
            height: getComputedStyle(card).height,
            background: getComputedStyle(card).backgroundColor,
            boxShadow: getComputedStyle(card).boxShadow,
            border: getComputedStyle(card).border,
          }
        : null,
      image: card ? pick("[class*='media']") : null,
      pin: card ? pick("[class*='pin']") : null,
      productTitle: card ? pick("[class*='title']") : null,
      price: card ? pick("[class*='price']") : null,
      incl: card ? pick("[class*='incl']") : null,
    };
  });
}

async function capture(viewport, name, browser) {
  const ctx = await browser.newContext({ viewport, colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  const section = page.locator("[data-home-stores]").first();
  await section.waitFor({ state: "visible", timeout: 90_000 });
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const outPath = join(outDir, name);
  await section.screenshot({ path: outPath, type: "png" });
  await ctx.close();
  if (!existsSync(outPath)) throw new Error(`Missing ${outPath}`);
  console.log("Saved:", outPath);
  return page;
}

async function main() {
  const browser = await chromium.launch();

  await capture({ width: 1440, height: 900 }, "stores-desktop.png", browser);
  await capture({ width: 390, height: 844 }, "stores-mobile.png", browser);

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  const audit = await auditSection(page);
  writeFileSync(join(outDir, "computed-css.json"), JSON.stringify(audit, null, 2));

  const checks = [
    ["max 3 cards", audit.cardCount <= 3 && audit.cardCount >= 1],
    ["title 28px", audit.title?.fontSize === "28px"],
    ["title weight 700", audit.title?.fontWeight === "700"],
    ["card width 140px", audit.storeCard?.width === "140px"],
    ["card no shadow", audit.storeCard?.boxShadow === "none"],
    ["image 140px", audit.image?.height === "140px"],
    ["pin 32px", audit.pin?.width === "32px" && audit.pin?.height === "32px"],
    ["price 18px/700", audit.price?.fontSize === "18px" && audit.price?.fontWeight === "700"],
    ["incl 15px", audit.incl?.fontSize === "15px"],
    ["view store 16px", audit.viewStore?.fontSize === "16px"],
  ];

  const lines = checks.map(([label, pass]) => `${pass ? "PASS" : "FAIL"} — ${label}`);
  writeFileSync(join(outDir, "VALIDATION.txt"), lines.join("\n") + "\n");
  console.log(lines.join("\n"));

  await browser.close();
  const failed = checks.filter(([, p]) => !p);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
