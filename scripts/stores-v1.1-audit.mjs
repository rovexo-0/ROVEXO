#!/usr/bin/env node
/** STORES v1.1 — Playwright audit + screenshots. */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = join(process.cwd(), "reports", "module-1", "stores-v1.1");

mkdirSync(outDir, { recursive: true });

async function measureSection(page) {
  const section = page.locator('[data-stores-version="1.1"]').first();
  await section.waitFor({ state: "visible", timeout: 90_000 });

  return section.evaluate((root) => {
    const pick = (scope, sel) => {
      const node = scope.querySelector(sel);
      if (!node) return null;
      const s = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        letterSpacing: s.letterSpacing,
        lineHeight: s.lineHeight,
        width: s.width,
        height: s.height,
        padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
        margin: `${s.marginTop} ${s.marginRight} ${s.marginBottom} ${s.marginLeft}`,
        borderRadius: s.borderRadius,
        boxShadow: s.boxShadow,
        rect: { w: Math.round(rect.width), h: Math.round(rect.height), x: Math.round(rect.left) },
      };
    };

    const cards = [...root.querySelectorAll("[data-store-card]")];
    const cardRects = cards.map((c) => c.getBoundingClientRect());
    const sectionRect = root.getBoundingClientRect();
    const rail = root.querySelector('[class*="rail"]');
    const railRect = rail?.getBoundingClientRect();

    let fullVisible = 0;
    let partialThird = 0;
    if (railRect && cardRects.length >= 3) {
      const leftEdge = railRect.left + 16;
      const rightEdge = railRect.right - parseFloat(getComputedStyle(rail).paddingRight || "0");
      for (let i = 0; i < cardRects.length; i += 1) {
        const r = cardRects[i];
        const visibleW = Math.min(r.right, rightEdge) - Math.max(r.left, leftEdge);
        if (visibleW >= r.width * 0.95) fullVisible += 1;
        if (i === 2) partialThird = Math.max(0, visibleW / r.width);
      }
    }

    const card = cards[0];

    return {
      cardCount: cards.length,
      title: pick(root, "h2"),
      header: pick(root, "header"),
      visit: pick(root, 'a[class*="visit"]'),
      viewStore: pick(root, 'a[class*="viewStore"]'),
      rail: rail ? pick(root, '[class*="rail"]') : null,
      storeCard: card
        ? {
            width: getComputedStyle(card).width,
            minHeight: getComputedStyle(card).minHeight,
            background: getComputedStyle(card).backgroundColor,
            boxShadow: getComputedStyle(card).boxShadow,
          }
        : null,
      image: card ? pick(card, "[class*='media']") : null,
      pin: card ? pick(card, "[class*='pin']") : null,
      productTitle: card ? pick(card, "p") : null,
      price: card ? pick(card, "[class*='price']") : null,
      total: card ? pick(card, "[class*='total']") : null,
      peek: {
        fullCardsVisible: fullVisible,
        thirdCardVisibleRatio: Math.round(partialThird * 100) / 100,
        railWidth: railRect ? Math.round(railRect.width) : null,
        sectionWidth: Math.round(sectionRect.width),
      },
    };
  });
}

async function capture(browser, viewport, scale, filename) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  const section = page.locator('[data-stores-version="1.1"]').first();
  await section.waitFor({ state: "visible", timeout: 90_000 });
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const outPath = join(outDir, filename);
  await section.screenshot({ path: outPath, type: "png" });
  await ctx.close();
  if (!existsSync(outPath)) throw new Error(`Missing ${outPath}`);
  console.log("Saved:", outPath);
}

async function main() {
  const browser = await chromium.launch();

  await capture(browser, { width: 1440, height: 900 }, 1, "desktop.png");
  await capture(browser, { width: 440, height: 956 }, 3, "iphone17promax.png");
  await capture(browser, { width: 412, height: 915 }, 2.625, "android.png");

  const page = await browser.newPage();
  await page.setViewportSize({ width: 440, height: 956 });
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  const audit = await measureSection(page);
  writeFileSync(join(outDir, "computed-css.json"), JSON.stringify(audit, null, 2));

  const checks = [
    ["title 32px/800", audit.title?.fontSize === "32px" && audit.title?.fontWeight === "800"],
    ["title letter-spacing", audit.title?.letterSpacing === "-0.4px"],
    ["card width 116px", audit.storeCard?.width === "116px"],
    ["card min-height 168px", audit.storeCard?.minHeight === "168px"],
    ["image 116px", audit.image?.height === "116px"],
    ["pin 28px", audit.pin?.width === "28px"],
    ["preview title 14px/600", audit.productTitle?.fontSize === "14px" && audit.productTitle?.fontWeight === "600"],
    ["price 18px/700", audit.price?.fontSize === "18px" && audit.price?.fontWeight === "700"],
    ["total 16px/600", audit.total?.fontSize === "16px" && audit.total?.fontWeight === "600"],
    ["view store 15px", audit.viewStore?.fontSize === "15px"],
    ["view store margin-top 8px", audit.viewStore?.margin.startsWith("8px")],
    [
      "2 full + ~35% third (when 3 cards)",
      audit.cardCount < 3 ||
        (audit.peek.fullCardsVisible >= 2 &&
          audit.peek.thirdCardVisibleRatio >= 0.25 &&
          audit.peek.thirdCardVisibleRatio <= 0.45),
    ],
    ["max 3 cards", audit.cardCount <= 3],
  ];

  const lines = checks.map(([label, pass]) => `- ${pass ? "PASS" : "FAIL"} — ${label}`);
  const report = [
    "# STORES v1.1 UI Polish Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Base URL: ${base}`,
    "",
    "## UI Status",
    "",
    checks.every(([, p]) => p) ? "**PASS — Ready for UI LOCK**" : "**FAIL — Review required**",
    "",
    "## Checklist",
    "",
    ...lines,
    "",
    "## Peek metrics (iPhone 17 Pro Max viewport)",
    "",
    "```json",
    JSON.stringify(audit.peek, null, 2),
    "```",
  ].join("\n");

  writeFileSync(join(outDir, "audit.md"), report);
  console.log(lines.join("\n"));

  await browser.close();
  const failed = checks.filter(([, p]) => !p);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
