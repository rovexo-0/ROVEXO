/**
 * ROVEXO homepage pixel audit — measures rendered box dimensions at 390px.
 * Run: node scripts/pixel-audit-homepage.mjs
 */
import { chromium } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

const SPEC = {
  headerInnerHeight: 64,
  logo: 44,
  searchHeight: 48,
  searchRadius: 24,
  headerIcon: 24,
  headerIconGap: 16,
  headerPadding: 16,
  bannerHeight: 120,
  bannerRadius: 22,
  bannerPadding: 20,
  categoryTileW: 78,
  categoryTileH: 92,
  categoryIconCircle: 60,
  categoryIcon: 34,
  categoryGap: 16,
  cardW: 171,
  cardH: 292,
  cardImageH: 172,
  cardRadius: 22,
  gridGapH: 16,
  gridGapV: 20,
  bottomNavH: 84,
  bottomNavFab: 68,
  headerDesktopH: 72,
};

function near(actual, expected, tolerance = 2) {
  return Math.abs(actual - expected) <= tolerance;
}

async function measure(page, selector) {
  const el = page.locator(selector).first();
  if ((await el.count()) === 0) return null;
  return el.boundingBox();
}

async function measureStyle(page, selector, prop) {
  const el = page.locator(selector).first();
  if ((await el.count()) === 0) return null;
  return el.evaluate((node, p) => getComputedStyle(node)[p], prop);
}

async function auditViewport(page, width, label) {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-v1-header", { timeout: 20000 });
  await page.locator(".home-v1-all-listings").scrollIntoViewIfNeeded().catch(() => undefined);
  await page.waitForTimeout(1200);

  const results = [];
  const fail = (name, expected, actual, unit = "px") => {
    results.push({ label, name, expected: `${expected}${unit}`, actual: `${Math.round(actual * 10) / 10}${unit}`, ok: near(actual, expected) });
  };

  const headerInner = await measure(page, ".home-v1-header__inner");
  const expectedHeaderH = width >= 768 ? SPEC.headerDesktopH : SPEC.headerInnerHeight;
  if (headerInner) fail("header inner height", expectedHeaderH, headerInner.height);

  const logo = await measure(page, ".home-v1-header__logo");
  if (logo) {
    fail("logo width", SPEC.logo, logo.width);
    fail("logo height", SPEC.logo, logo.height);
  }

  const search = await measure(page, ".home-v1-search-bar");
  if (search) fail("search height", SPEC.searchHeight, search.height);

  const searchRadius = await measureStyle(page, ".home-v1-search-bar", "borderRadius");
  if (searchRadius) {
    const parsed = parseFloat(searchRadius);
    fail("search radius", SPEC.searchRadius, parsed);
  }

  const headerPosition = await measureStyle(page, ".home-v1-header", "position");
  results.push({
    label,
    name: "header sticky",
    expected: "sticky",
    actual: headerPosition ?? "missing",
    ok: headerPosition === "sticky",
  });

  const icon = page.locator(".home-v1-header__actions svg").first();
  const iconBox = await icon.boundingBox().catch(() => null);
  if (iconBox) fail("header icon size", SPEC.headerIcon, iconBox.width);

  const media = await measure(page, ".home-v1-listing-scroller article div[class*='media'], .home-v1-listing-grid--feed article div[class*='media']");
  if (media) fail("card image height", SPEC.cardImageH, media.height);

  const gridGap = await page.evaluate(() => {
    const articles = document.querySelectorAll(".home-v1-listing-grid--feed > article");
    if (articles.length < 2) return null;
    const first = articles[0].getBoundingClientRect();
    const second = articles[1].getBoundingClientRect();
    return second.left - first.right;
  });
  if (gridGap !== null) {
    fail("grid horizontal gap", SPEC.gridGapH, gridGap);
  }

  const banner = await measure(page, ".home-v1-import-banner");
  if (banner) {
    fail("promo banner height", SPEC.bannerHeight, banner.height);
  }

  const bannerRadius = await measureStyle(page, ".home-v1-import-banner", "borderRadius");
  if (bannerRadius) fail("promo banner radius", SPEC.bannerRadius, parseFloat(bannerRadius));

  const tile = await measure(page, ".home-v1-category-tile");
  if (tile) {
    fail("category tile width", SPEC.categoryTileW, tile.width);
    fail("category tile height", SPEC.categoryTileH, tile.height);
  }

  const categoryIconBox = await measure(page, ".home-v1-category-tile__box");
  if (categoryIconBox) {
    fail("category icon circle", SPEC.categoryIconCircle, categoryIconBox.width);
  }

  const cardEl = page.locator(".home-v1-listing-scroller article, .home-v1-listing-grid--feed article").first();
  const cardBox = await cardEl.boundingBox().catch(() => null);
  if (cardBox) {
    fail("listing card width", SPEC.cardW, cardBox.width);
    fail("listing card height", SPEC.cardH, cardBox.height);
  }

  const bottomNav = await measure(page, ".home-v1-bottom-nav__shell");
  if (bottomNav) fail("bottom nav shell height", SPEC.bottomNavH, bottomNav.height);

  const fab = await measure(page, ".home-v1-bottom-nav__sell");
  if (fab) {
    fail("bottom nav FAB width", SPEC.bottomNavFab, fab.width);
    fail("bottom nav FAB height", SPEC.bottomNavFab, fab.height);
  }

  const main = await measure(page, ".home-v1-main");
  if (main) fail("main max content width", Math.min(width, 390), main.width, "px");

  return results;
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.addInitScript(() => {
  document.documentElement.dataset.theme = "light";
  localStorage.setItem("theme", "light");
});

const widths = [390, 430, 768, 1024, 1280, 1440];
const all = {};

for (const w of widths) {
  all[w] = await auditViewport(page, w, String(w));
}

await browser.close();

let failures = 0;
for (const [w, rows] of Object.entries(all)) {
  console.log(`\n=== Viewport ${w}px ===`);
  for (const r of rows) {
    const mark = r.ok ? "OK" : "FAIL";
    if (!r.ok) failures++;
    console.log(`[${mark}] ${r.name}: expected ${r.expected}, got ${r.actual}`);
  }
}

console.log(`\nTotal failures: ${failures}`);
process.exit(failures > 0 ? 1 : 0);
