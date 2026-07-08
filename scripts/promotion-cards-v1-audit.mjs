#!/usr/bin/env node
/** Promotion Cards UI v1.0 — responsive + structure audit. */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const VIEWPORTS = [
  { id: "iphone-se", width: 375, height: 667 },
  { id: "iphone-pro-max", width: 440, height: 956 },
  { id: "tablet", width: 768, height: 1024 },
  { id: "desktop", width: 1440, height: 900 },
];

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = join(process.cwd(), "reports", "module-1", "promotion-cards-v1");
mkdirSync(outDir, { recursive: true });

async function measure(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-promotion-cards-version="v1.0"]');
    const grid = document.querySelector('[data-testid="promotion-cards-grid"]');
    const cards = [...document.querySelectorAll(".promo-v1-card")];
    const trust = document.querySelector(".promo-v1-trust");
    const docWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;

    return {
      hasRoot: Boolean(root),
      cardCount: cards.length,
      gridCols: grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 0,
      trustItems: trust ? trust.querySelectorAll(".promo-v1-trust__item").length : 0,
      overflowPx: Math.max(0, scrollWidth - docWidth),
      firstCard: cards[0]
        ? {
            w: Math.round(cards[0].getBoundingClientRect().width),
            h: Math.round(cards[0].getBoundingClientRect().height),
          }
        : null,
    };
  });
}

async function main() {
  const browser = await chromium.launch();
  const results = [];

  for (const viewport of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    await page.goto(`${base}/seller/promotions`, { waitUntil: "networkidle", timeout: 60_000 });

    const metrics = await measure(page);
    const pass =
      metrics.hasRoot &&
      metrics.cardCount === 5 &&
      metrics.trustItems === 4 &&
      metrics.overflowPx <= 1;

    results.push({ viewport: viewport.id, pass, ...metrics });
    await page.screenshot({ path: join(outDir, `${viewport.id}.png`), fullPage: true });
    await page.close();
  }

  await browser.close();

  const summary = {
    generatedAt: new Date().toISOString(),
    route: "/seller/promotions",
    pass: results.every((result) => result.pass),
    results,
  };

  writeFileSync(join(outDir, "audit.json"), JSON.stringify(summary, null, 2));
  writeFileSync(
    join(outDir, "AUDIT.md"),
    `# Promotion Cards v1.0 Audit\n\n**Overall:** ${summary.pass ? "PASS" : "FAIL"}\n\n${results
      .map((result) => `- ${result.viewport}: ${result.pass ? "PASS" : "FAIL"} (${result.cardCount} cards, overflow ${result.overflowPx}px)`)
      .join("\n")}\n`,
  );

  console.log(summary.pass ? "PROMOTION CARDS AUDIT: PASS" : "PROMOTION CARDS AUDIT: FAIL");
  process.exit(summary.pass ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
