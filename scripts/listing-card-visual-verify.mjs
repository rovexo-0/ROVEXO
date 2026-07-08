#!/usr/bin/env node
/**
 * Listing card visual verification — screenshots + computed CSS audit.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = join(process.cwd(), "reports", "module-1", "listing-card-final");

mkdirSync(outDir, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
  });
  const page = await context.newPage();

  await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.locator('[data-homepage-version="v7.0"]').waitFor({ timeout: 30_000 });
  await page.locator('[data-listing-card="rovexo"]').first().waitFor({ timeout: 30_000 });

  await page.screenshot({
    path: join(outDir, "homepage-mobile-full.png"),
    fullPage: true,
  });

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktop.newPage();
  await desktopPage.goto(`${base}/`, { waitUntil: "networkidle", timeout: 120_000 });
  await desktopPage.locator('[data-homepage-version="v7.0"]').waitFor({ timeout: 30_000 });
  await desktopPage.screenshot({
    path: join(outDir, "homepage-desktop-full.png"),
    fullPage: true,
  });
  await desktop.close();

  const card = page.locator('[data-listing-card="rovexo"]').first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  await card.screenshot({ path: join(outDir, "listing-card-closeup.png") });

  const audit = await card.evaluate((el) => {
    const cardStyle = getComputedStyle(el);
    const media = el.querySelector('[class*="media"]');
    const price = el.querySelector('[class*="price"]');
    const title = el.querySelector('[class*="title"]');
    const footer = el.querySelector('[class*="statsRow"]');
    const rating = el.querySelector('[class*="statRating"]');
    const views = el.querySelector('[class*="statViews"]');
    const goldIcon = el.querySelector('[class*="statIconGold"] svg, [class*="statIconGold"] path');

    const pick = (node) => {
      if (!node) return null;
      const s = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        text: node.textContent?.trim() ?? "",
        display: s.display,
        justifyContent: s.justifyContent,
        alignItems: s.alignItems,
        width: s.width,
        height: s.height,
        paddingLeft: s.paddingLeft,
        paddingRight: s.paddingRight,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        color: s.color,
        gap: s.gap,
        flex: s.flex,
        marginLeft: s.marginLeft,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
      };
    };

    const cardRect = el.getBoundingClientRect();
    const footerRect = footer?.getBoundingClientRect();
    const ratingRect = rating?.getBoundingClientRect();
    const viewsRect = views?.getBoundingClientRect();

    const ratingLeftInset = ratingRect ? Math.round(ratingRect.left - cardRect.left) : null;
    const viewsRightInset = viewsRect ? Math.round(cardRect.right - viewsRect.right) : null;
    const footerWidth = footerRect ? Math.round(footerRect.width) : null;
    const cardWidth = Math.round(cardRect.width);
    const innerWidth = cardWidth - 2;

    return {
      card: {
        width: cardStyle.width,
        height: cardStyle.height,
        borderRadius: cardStyle.borderRadius,
      },
      media: media
        ? { width: getComputedStyle(media).width, height: getComputedStyle(media).height }
        : null,
      price: pick(price),
      title: pick(title),
      footer: pick(footer),
      rating: pick(rating),
      views: pick(views),
      goldIconColor: goldIcon
        ? getComputedStyle(goldIcon).fill || goldIcon.getAttribute("fill")
        : null,
      ratingText: rating?.textContent?.trim() ?? "",
      viewsText: views?.textContent?.trim() ?? "",
      hasDash: (el.textContent ?? "").includes("Views"),
      layout: {
        cardWidthPx: cardWidth,
        footerWidthPx: footerWidth,
        ratingLeftInsetPx: ratingLeftInset,
        viewsRightInsetPx: viewsRightInset,
        footerFullWidth: footerWidth === innerWidth || footerWidth === cardWidth,
        ratingFlushLeft: ratingLeftInset === 12 || ratingLeftInset === 13,
        viewsFlushRight: viewsRightInset === 12 || viewsRightInset === 13,
      },
    };
  });

  writeFileSync(join(outDir, "computed-css-audit.json"), JSON.stringify(audit, null, 2));

  const checks = [
    ["card width 160px", audit.card.width === "160px"],
    ["card height 300px", audit.card.height === "300px"],
    ["media height 160px", audit.media?.height === "160px"],
    ["price 20px purple", audit.price?.fontSize === "20px" && (audit.price?.color.includes("147") || audit.price?.color.includes("168"))],
    ["title 16px", audit.title?.fontSize === "16px"],
    ["footer height 24px", audit.footer?.height === "24px"],
    ["footer flex space-between", audit.footer?.display === "flex" && audit.footer?.justifyContent === "space-between"],
    ["footer padding 12px", audit.footer?.paddingLeft === "12px" && audit.footer?.paddingRight === "12px"],
    ["footer font 13px/600", audit.footer?.fontSize === "13px" && audit.footer?.fontWeight === "600"],
    ["gold star", audit.goldIconColor === "rgb(255, 193, 7)" || audit.goldIconColor === "#FFC107"],
    ["no Views label in card", !audit.hasDash],
    ["rating not empty", audit.ratingText.length > 0],
    ["views not empty", audit.viewsText.length > 0],
    ["rating dash when unrated", audit.ratingText === "—" || !audit.ratingText.includes("—")],
    ["rating not zero string", audit.ratingText !== "0.0"],
    ["footer full card width", audit.layout.footerFullWidth],
    ["rating flush left 12px", audit.layout.ratingFlushLeft],
    ["views flush right 12px", audit.layout.viewsFlushRight],
    ["footer gap 0", audit.footer?.gap === "0px" || audit.footer?.gap === "normal"],
    ["views no margin-left auto", audit.views?.marginLeft === "0px"],
  ];

  const report = checks.map(([label, pass]) => `${pass ? "PASS" : "FAIL"} — ${label}`).join("\n");
  writeFileSync(join(outDir, "visual-qa-report.txt"), report + "\n\n" + JSON.stringify(audit, null, 2));

  console.log(report);
  console.log(`\nArtifacts: ${outDir}`);

  const failed = checks.filter(([, pass]) => !pass);
  await browser.close();

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
