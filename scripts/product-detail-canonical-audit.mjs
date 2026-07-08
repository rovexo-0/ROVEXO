#!/usr/bin/env node
/** Product Details v1.1 — Playwright visual validation. */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3033";
const slug = process.env.AUDIT_LISTING_SLUG ?? "demo-iphone-15-pro";
const outDir = join(process.cwd(), "reports", "module-1", "product-detail-v1.1");

mkdirSync(outDir, { recursive: true });

async function measure(page) {
  await page.locator('[data-pd-detail-version="v1.1"]').waitFor({ state: "visible", timeout: 90_000 });
  await page.locator("#pd-similar-title").scrollIntoViewIfNeeded().catch(() => undefined);
  await page.waitForTimeout(300);

  return page.evaluate(() => {
    const root = document.querySelector('[data-pd-detail-version="v1.1"]');
    const shell = document.querySelector(".pd-v1__shell");
    const firstChild = shell?.firstElementChild;
    const header = document.querySelector("[data-pd-detail-header]");
    const gallery = document.querySelector(".pd-v1__gallery");
    const galleryBadge = document.querySelector(".pd-v1__gallery-badge");
    const counter = document.querySelector(".pd-v1__gallery-counter");
    const thumbs = document.querySelectorAll(".pd-v1__thumb");
    const actionBar = document.querySelector(".pd-v1__action-bar");
    const shellRect = shell?.getBoundingClientRect();
    const galleryRect = gallery?.getBoundingClientRect();
    const similarCard = document.querySelector('.pd-v1__similar-rail [data-hp-listing-card="official"]');
    const docWidth = document.documentElement.clientWidth;
    const overflowPx = Math.max(0, document.documentElement.scrollWidth - docWidth);

    return {
      version: root?.getAttribute("data-pd-detail-version"),
      headerPresent: Boolean(header),
      galleryIsFirst: firstChild?.classList.contains("pd-v1__gallery") ?? false,
      galleryTop: galleryRect ? Math.round(galleryRect.top) : null,
      shellTop: shellRect ? Math.round(shellRect.top) : null,
      galleryBadgePresent: Boolean(galleryBadge),
      counterText: counter?.textContent?.trim() ?? null,
      thumbCount: thumbs.length,
      actionButtons: [...(actionBar?.querySelectorAll("button") ?? [])].map((btn) => btn.textContent?.trim()),
      similarListingVersion: similarCard?.getAttribute("data-hp-listing-version"),
      overflowPx,
    };
  });
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 440, height: 956 });
  await page.goto(`${base}/listing/${slug}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(outDir, "iphone17promax.png"), type: "png" });
  const audit = await measure(page);
  writeFileSync(join(outDir, "computed-css.json"), JSON.stringify(audit, null, 2));

  const checks = [
    ["product detail v1.1", audit.version === "v1.1"],
    ["no sticky header", audit.headerPresent === false],
    ["gallery is first", audit.galleryIsFirst === true],
    ["gallery starts at top", audit.galleryTop !== null && audit.shellTop !== null && audit.galleryTop <= audit.shellTop + 1],
    ["no gallery promotion badge", audit.galleryBadgePresent === false],
    ["image counter", Boolean(audit.counterText?.includes("/"))],
    ["thumbnails", audit.thumbCount >= 2],
    ["add to cart", audit.actionButtons.some((label) => label?.includes("Add to Cart"))],
    ["buy now", audit.actionButtons.some((label) => label?.includes("Buy Now"))],
    ["similar listing card", audit.similarListingVersion === "official-2.1"],
    ["no horizontal overflow", audit.overflowPx <= 1],
  ];

  const report = checks.map(([label, pass]) => ({ label, pass }));
  writeFileSync(join(outDir, "audit.json"), JSON.stringify({ audit, report }, null, 2));

  const failed = report.filter((item) => !item.pass);
  await browser.close();

  if (failed.length > 0) {
    console.error("Product detail audit failed:", failed);
    process.exit(1);
  }

  console.log("Product detail audit passed:", outDir);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
