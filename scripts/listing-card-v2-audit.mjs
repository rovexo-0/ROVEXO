#!/usr/bin/env node
/**
 * Listing Card v2.0 — screenshots + computed CSS / DOM / spacing / typography audit.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = join(process.cwd(), "reports", "module-1", "listing-card-v2");

mkdirSync(outDir, { recursive: true });

async function main() {
  const browser = await chromium.launch();
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
  await mobilePage.screenshot({
    path: join(outDir, "homepage-mobile.png"),
    fullPage: false,
  });

  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
  });
  const desktopPage = await desktopCtx.newPage();
  await desktopPage.goto(`${base}/`, { waitUntil: "networkidle", timeout: 120_000 });
  await desktopPage.locator('[data-listing-card="rovexo"]').first().waitFor({ timeout: 60_000 });

  const cardDesktop = desktopPage.locator('[data-listing-card="rovexo"]').first();
  await cardDesktop.scrollIntoViewIfNeeded();
  await desktopPage.waitForTimeout(400);
  await cardDesktop.screenshot({ path: join(outDir, "card-desktop.png") });
  await desktopPage.screenshot({
    path: join(outDir, "homepage-desktop.png"),
    fullPage: false,
  });

  const audit = await cardDesktop.evaluate((el) => {
    const pick = (sel) => {
      const node = el.querySelector(sel);
      if (!node) return null;
      const s = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        part: node.getAttribute("data-rx-part"),
        className: node.className,
        text: node.textContent?.trim().slice(0, 80) ?? "",
        display: s.display,
        width: s.width,
        height: s.height,
        padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
        gap: s.gap,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        color: s.color,
        borderRadius: s.borderRadius,
        boxShadow: s.boxShadow,
        border: s.border,
        objectFit: node.tagName === "IMG" ? s.objectFit : undefined,
        rect: {
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        },
      };
    };

    const cardRect = el.getBoundingClientRect();
    const imgRect = el.querySelector('[data-rx-part="img"]')?.getBoundingClientRect();
    const bodyRect = el.querySelector('[data-rx-part="body"]')?.getBoundingClientRect();
    const endRect = el.querySelector('[data-rx-part="end"]')?.getBoundingClientRect();

    const legacyClasses = [];
    el.querySelectorAll("[class]").forEach((n) => {
      const c = n.className;
      if (typeof c === "string") {
        for (const token of c.split(/\s+/)) {
          if (/price|title|favorite|media|body|statsRow|statRating|lc|r2|v7/i.test(token)) {
            legacyClasses.push(token);
          }
        }
      }
    });

    const domTree = [];
    const walk = (node, depth = 0) => {
      if (node.nodeType !== 1) return;
      const part = node.getAttribute("data-rx-part");
      const rx = node.getAttribute("data-rx-card");
      const tag = node.tagName.toLowerCase();
      domTree.push({
        depth,
        tag,
        part,
        rxCard: rx,
        version: node.getAttribute("data-rx-card-version"),
      });
      for (const child of node.children) walk(child, depth + 1);
    };
    walk(el);

    const cardStyle = getComputedStyle(el);

    return {
      version: el.getAttribute("data-rx-card-version"),
      card: {
        width: cardStyle.width,
        height: cardStyle.height,
        borderRadius: cardStyle.borderRadius,
        border: cardStyle.border,
        boxShadow: cardStyle.boxShadow,
        background: cardStyle.backgroundColor,
        rect: { w: Math.round(cardRect.width), h: Math.round(cardRect.height) },
      },
      imageContainer: pick('[data-rx-part="img"]'),
      productImage: pick('[data-rx-part="img"] img'),
      featuredBadge: pick('[data-rx-part="tag"]'),
      favourite: pick('[data-rx-part="pin"]'),
      content: pick('[data-rx-part="body"]'),
      price: pick('[data-rx-part="val"]'),
      title: pick('[data-rx-part="name"]'),
      subtitle: pick('[data-rx-part="hint"]'),
      footer: pick('[data-rx-part="end"]'),
      rating: pick('[data-rx-part="score"]'),
      views: pick('[data-rx-part="reach"]'),
      spacing: {
        imageHeightPx: imgRect ? Math.round(imgRect.height) : null,
        contentHeightPx: bodyRect ? Math.round(bodyRect.height) : null,
        footerHeightPx: endRect ? Math.round(endRect.height) : null,
        sumPx:
          imgRect && bodyRect && endRect
            ? Math.round(imgRect.height + bodyRect.height + endRect.height)
            : null,
        imagePct: imgRect ? Math.round((imgRect.height / cardRect.height) * 100) : null,
      },
      legacyClassHits: legacyClasses,
      domTree,
      forbiddenText: {
        hasSeller: (el.textContent ?? "").toLowerCase().includes("seller"),
        hasLocation: (el.textContent ?? "").toLowerCase().includes("location"),
        hasBuyerProtection: (el.textContent ?? "").toLowerCase().includes("buyer protection"),
        hasPhotoCounter: /\d+\s*\/\s*\d+/.test(el.textContent ?? ""),
      },
    };
  });

  writeFileSync(join(outDir, "computed-css.json"), JSON.stringify(audit, null, 2));
  writeFileSync(join(outDir, "dom-tree.json"), JSON.stringify(audit.domTree, null, 2));
  writeFileSync(join(outDir, "spacing.json"), JSON.stringify(audit.spacing, null, 2));
  writeFileSync(
    join(outDir, "typography.json"),
    JSON.stringify(
      {
        price: audit.price,
        title: audit.title,
        subtitle: audit.subtitle,
        rating: audit.rating,
        views: audit.views,
        featuredBadge: audit.featuredBadge,
      },
      null,
      2,
    ),
  );

  const checks = [
    ["v2.0 version attr", audit.version === "2.0"],
    ["card width 168px", audit.card.width === "168px" && audit.card.rect.w === 168],
    ["card height 320px", audit.card.height === "320px" && audit.card.rect.h === 320],
    ["border radius 14px", audit.card.borderRadius === "14px"],
    ["image height 220px", audit.imageContainer?.height === "220px"],
    ["content height 76px", audit.content?.height === "76px"],
    ["footer height 24px", audit.footer?.height === "24px"],
    ["price 17px/600", audit.price?.fontSize === "17px" && audit.price?.fontWeight === "600"],
    ["title 15px/600", audit.title?.fontSize === "15px" && audit.title?.fontWeight === "600"],
    ["title height 44px", audit.title?.height === "44px"],
    ["footer space-between", audit.footer?.display === "flex"],
    ["rating icon area", audit.rating?.fontSize === "13px"],
    ["views icon area", audit.views?.fontSize === "13px"],
    ["zero legacy classes", audit.legacyClassHits.length === 0],
    ["no seller text", !audit.forbiddenText.hasSeller],
    ["no location text", !audit.forbiddenText.hasLocation],
    ["no buyer protection", !audit.forbiddenText.hasBuyerProtection],
    ["layout sum ~320", audit.spacing.sumPx != null && audit.spacing.sumPx >= 318 && audit.spacing.sumPx <= 322],
  ];

  const report = [
    "# Listing Card v2.0 Validation Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Base URL: ${base}`,
    "",
    "## Checklist",
    "",
    ...checks.map(([label, pass]) => `- ${pass ? "PASS" : "FAIL"} — ${label}`),
    "",
    "## Spacing",
    "",
    "```json",
    JSON.stringify(audit.spacing, null, 2),
    "```",
    "",
    "## Artifacts",
    "",
    "- card-desktop.png",
    "- card-mobile.png",
    "- homepage-desktop.png",
    "- homepage-mobile.png",
    "- computed-css.json",
    "- dom-tree.json",
    "- spacing.json",
    "- typography.json",
  ].join("\n");

  writeFileSync(join(outDir, "REPORT.md"), report);

  console.log(checks.map(([l, p]) => `${p ? "PASS" : "FAIL"} — ${l}`).join("\n"));
  console.log(`\nArtifacts: ${outDir}`);

  const failed = checks.filter(([, p]) => !p);
  await browser.close();
  await mobileCtx.close();
  await desktopCtx.close();

  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
