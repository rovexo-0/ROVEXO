#!/usr/bin/env node
/**
 * Listing Card v3.0 — screenshots + computed CSS audit.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = join(process.cwd(), "reports", "module-1", "listing-card-v3");

mkdirSync(outDir, { recursive: true });

async function main() {
  const browser = await chromium.launch();

  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
  });
  const desktopPage = await desktopCtx.newPage();
  await desktopPage.goto(`${base}/`, { waitUntil: "networkidle", timeout: 120_000 });
  await desktopPage.locator('[data-listing-card="rovexo"]').first().waitFor({ timeout: 60_000 });

  const card = desktopPage.locator('[data-listing-card="rovexo"]').first();
  await card.scrollIntoViewIfNeeded();
  await desktopPage.waitForTimeout(400);
  await card.screenshot({ path: join(outDir, "card-desktop.png") });

  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
  });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto(`${base}/`, { waitUntil: "networkidle", timeout: 120_000 });
  await mobilePage.locator('[data-listing-card="rovexo"]').first().waitFor({ timeout: 60_000 });
  const cardMobile = mobilePage.locator('[data-listing-card="rovexo"]').first();
  await cardMobile.scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(400);
  await cardMobile.screenshot({ path: join(outDir, "card-mobile.png") });

  const audit = await card.evaluate((el) => {
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
        whiteSpace: s.whiteSpace,
        marginBottom: s.marginBottom,
        marginTop: s.marginTop,
        padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
        display: s.display,
        justifyContent: s.justifyContent,
        rect: { w: Math.round(rect.width), h: Math.round(rect.height) },
        text: node.textContent?.trim().slice(0, 40) ?? "",
      };
    };

    const cardRect = el.getBoundingClientRect();
    const imgRect = el.querySelector('[data-rx-part="img"]')?.getBoundingClientRect();
    const bodyRect = el.querySelector('[data-rx-part="body"]')?.getBoundingClientRect();
    const titleRect = el.querySelector('[data-rx-part="name"]')?.getBoundingClientRect();
    const endRect = el.querySelector('[data-rx-part="end"]')?.getBoundingClientRect();
    const pinSvg = el.querySelector('[data-rx-part="pin"] svg');
    const pinSvgRect = pinSvg?.getBoundingClientRect();
    const tag = el.querySelector('[data-rx-part="tag"]');
    const hint = el.querySelector('[data-rx-part="hint"]');

    const cardStyle = getComputedStyle(el);

    return {
      version: el.getAttribute("data-rx-card-version"),
      card: {
        width: cardStyle.width,
        height: cardStyle.height,
        borderRadius: cardStyle.borderRadius,
        border: cardStyle.border,
        boxShadow: cardStyle.boxShadow,
        rect: { w: Math.round(cardRect.width), h: Math.round(cardRect.height) },
      },
      image: pick('[data-rx-part="img"]'),
      favourite: pick('[data-rx-part="pin"]'),
      heart: pinSvgRect ? { w: Math.round(pinSvgRect.width), h: Math.round(pinSvgRect.height) } : null,
      content: pick('[data-rx-part="body"]'),
      price: pick('[data-rx-part="val"]'),
      title: pick('[data-rx-part="name"]'),
      stats: pick('[data-rx-part="end"]'),
      rating: pick('[data-rx-part="score"]'),
      views: pick('[data-rx-part="reach"]'),
      spacing: {
        imagePx: imgRect ? Math.round(imgRect.height) : null,
        contentPx: bodyRect ? Math.round(bodyRect.height) : null,
        sumPx:
          imgRect && bodyRect ? Math.round(imgRect.height + bodyRect.height) : null,
        titleToStatsGap:
          titleRect && endRect ? Math.round(endRect.top - titleRect.bottom) : null,
      },
      removed: {
        hasFeaturedBadge: Boolean(tag),
        hasSubtitle: Boolean(hint),
      },
    };
  });

  writeFileSync(join(outDir, "computed-css.json"), JSON.stringify(audit, null, 2));

  const checks = [
    ["v3.0 version", audit.version === "3.0"],
    ["card 160×260", audit.card.width === "160px" && audit.card.height === "260px"],
    ["card rect 160×260", audit.card.rect.w === 160 && audit.card.rect.h === 260],
    ["border radius 16px", audit.card.borderRadius === "16px"],
    ["image 160×160", audit.image?.height === "160px" && audit.image?.rect.h === 160],
    ["content 100px", audit.content?.height === "100px"],
    ["sum 260", audit.spacing.sumPx === 260],
    ["favourite 28×28", audit.favourite?.width === "28px" && audit.favourite?.height === "28px"],
    ["heart 16px", audit.heart?.w === 16 && audit.heart?.h === 16],
    ["price 18px/700", audit.price?.fontSize === "18px" && audit.price?.fontWeight === "700"],
    ["title 16px/600", audit.title?.fontSize === "16px" && audit.title?.fontWeight === "600"],
    ["title one line", audit.title?.whiteSpace === "nowrap"],
    ["stats 20px", audit.stats?.height === "20px"],
    ["stats margin-top 0", audit.stats?.marginTop === "0px"],
    ["title-to-stats tight", audit.spacing.titleToStatsGap != null && audit.spacing.titleToStatsGap <= 8],
    ["no featured badge", !audit.removed.hasFeaturedBadge],
    ["no subtitle", !audit.removed.hasSubtitle],
    ["rating 13px", audit.rating?.fontSize === "13px"],
    ["views 13px", audit.views?.fontSize === "13px"],
  ];

  const report = [
    "# Listing Card v3.0 Validation",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    ...checks.map(([l, p]) => `- ${p ? "PASS" : "FAIL"} — ${l}`),
    "",
    "## Spacing",
    "",
    "```json",
    JSON.stringify(audit.spacing, null, 2),
    "```",
  ].join("\n");

  writeFileSync(join(outDir, "REPORT.md"), report);
  console.log(checks.map(([l, p]) => `${p ? "PASS" : "FAIL"} — ${l}`).join("\n"));
  console.log(`\nArtifacts: ${outDir}`);

  const failed = checks.filter(([, p]) => !p);
  await browser.close();
  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
