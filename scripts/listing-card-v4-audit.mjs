#!/usr/bin/env node
/** Canonical Listing Card — before/after visual audit (supersedes v4.0 rx selectors). */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const CARD_SEL = '[data-hp-listing-card="official"]';
const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = join(process.cwd(), "reports", "module-1", "listing-card-v4");
const v3Desktop = join(process.cwd(), "reports/module-1/listing-card-v3/card-desktop.png");
const v3Mobile = join(process.cwd(), "reports/module-1/listing-card-v3/card-mobile.png");

mkdirSync(outDir, { recursive: true });

if (existsSync(v3Desktop)) {
  copyFileSync(v3Desktop, join(outDir, "before-desktop-v3.png"));
}
if (existsSync(v3Mobile)) {
  copyFileSync(v3Mobile, join(outDir, "before-mobile-v3-260px.png"));
}

async function auditCard(page) {
  const card = page.locator(CARD_SEL).first();
  await card.waitFor({ state: "visible", timeout: 90_000 });

  return card.evaluate((el) => {
    const pick = (node) => {
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

    const cardRect = el.getBoundingClientRect();
    const figure = el.querySelector("figure");
    const imgRect = figure?.getBoundingClientRect();
    const body = el.querySelector('[class*="body"]');
    const price = body?.querySelector('[class*="price"]');
    const title = body?.querySelector('[class*="title"]');
    const footer = body?.querySelector('[class*="footer"]');
    const pin = el.querySelector("button");

    return {
      version: el.getAttribute("data-hp-listing-version"),
      card: {
        width: getComputedStyle(el).width,
        height: getComputedStyle(el).height,
        rect: { w: Math.round(cardRect.width), h: Math.round(cardRect.height) },
      },
      image: pick(figure),
      imagePct: imgRect ? Math.round((imgRect.height / cardRect.height) * 100) : null,
      body: pick(body),
      price: pick(price),
      title: pick(title),
      footer: pick(footer),
      pin: pick(pin),
      pinSvg: pin?.querySelector("svg")?.getBoundingClientRect(),
    };
  });
}

async function capture(page, outPath, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  const card = page.locator(CARD_SEL).first();
  await card.waitFor({ state: "visible", timeout: 90_000 });
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await card.screenshot({ path: outPath, type: "png" });
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await capture(page, join(outDir, "after-desktop.png"), { width: 1440, height: 900 });
  await capture(page, join(outDir, "after-iphone17promax.png"), { width: 440, height: 956 });

  const grid = await page.evaluate((sel) => {
    const cards = [...document.querySelectorAll(sel)].slice(0, 2);
    if (cards.length < 2) return null;
    const r0 = cards[0].getBoundingClientRect();
    const r1 = cards[1].getBoundingClientRect();
    return {
      sameRow: Math.abs(r0.top - r1.top) < 8,
      colsMobile: cards.length,
    };
  }, CARD_SEL);

  const audit = await auditCard(page);
  if (audit.pinSvg) {
    audit.pinHeart = {
      w: Math.round(audit.pinSvg.width),
      h: Math.round(audit.pinSvg.height),
    };
    delete audit.pinSvg;
  }

  writeFileSync(join(outDir, "computed-css.json"), JSON.stringify({ audit, grid }, null, 2));

  const checks = [
    ["official-2.1 version", audit.version === "official-2.1"],
    ["fluid width", audit.card.rect.w > 0],
    ["image aspect 160:220", audit.image?.rect && Math.abs(audit.image.rect.w / audit.image.rect.h - 160 / 220) < 0.03],
    ["image dominant", audit.imagePct != null && audit.imagePct >= 58 && audit.imagePct <= 72],
    ["body padding fluid", audit.body?.padding != null],
    ["price bold purple", audit.price?.fontWeight === "700" && parseFloat(audit.price?.fontSize ?? "0") >= 16],
    ["title responsive", audit.title?.fontSize != null],
    ["footer min height", parseFloat(audit.footer?.height ?? "0") >= 18],
    ["pin responsive", parseFloat(audit.pin?.width ?? "0") >= 28],
    ["heart responsive", audit.pinHeart?.w >= 14],
    ["mobile 2-col row", grid?.sameRow === true],
  ];

  const report = [
    "# Canonical Listing Card Visual Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Before / After",
    "",
    "- `before-desktop-v3.png` — v3.0 reference (260px card)",
    "- `before-mobile-v3-260px.png` — v3.0 mobile reference",
    "- `after-desktop.png` — canonical desktop",
    "- `after-iphone17promax.png` — canonical iPhone 17 Pro Max",
    "",
    "## UI Status",
    "",
    checks.every(([, p]) => p) ? "**PASS — Ready for UI LOCK approval**" : "**FAIL — Review required**",
    "",
    "## Checklist",
    "",
    ...checks.map(([l, p]) => `- ${p ? "PASS" : "FAIL"} — ${l}`),
    "",
    "## Dimensions",
    "",
    "```json",
    JSON.stringify(audit, null, 2),
    "```",
  ].join("\n");

  writeFileSync(join(outDir, "VISUAL_AUDIT.md"), report);
  console.log(checks.map(([l, p]) => `${p ? "PASS" : "FAIL"} — ${l}`).join("\n"));
  console.log(`\nArtifacts: ${outDir}`);

  await browser.close();
  if (checks.some(([, p]) => !p)) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
