/**
 * BLOOD III — localhost:3000 runtime proofs (Sold PDP · Saved SOLD · Seller fee isolation)
 * UI/UX only. Does not touch payment/checkout engines.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const ORIGIN = "http://localhost:3000";
const OUT = path.join(process.cwd(), "test-results", "blood-iii");
const SLUG = "xlviii-cert-1784997083128-ms0l6dp5";
const ORDER_ID = "319ca2fc-ac24-42cb-884e-ae3c3c7e2d34";
const BUYER = { email: "demo.buyer@rovexo.co.uk", password: "RovexoBuyer@2026" };
const SELLER = { email: "demo.seller@rovexo.co.uk", password: "RovexoSeller@2026" };

fs.mkdirSync(OUT, { recursive: true });

async function login(page: import("playwright").Page, account: { email: string; password: string }) {
  await page.goto(`${ORIGIN}/login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByLabel(/email/i).fill(account.email);
  await page.getByLabel(/^password$/i).or(page.locator('input[type="password"]')).first().fill(account.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 60_000 });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const report: Record<string, string> = {};

  // 1) Public Sold PDP (guest)
  await page.goto(`${ORIGIN}/listing/${SLUG}`, { waitUntil: "networkidle", timeout: 60_000 });
  const body1 = await page.locator("body").innerText();
  report.sold_pdp =
    /This item has been sold/i.test(body1) &&
    /SOLD/i.test(body1) &&
    /View Similar/i.test(body1) &&
    /More from this Seller/i.test(body1) &&
    !/Store unavailable/i.test(body1) &&
    !/BUY NOW/i.test(body1) &&
    !/MAKE OFFER/i.test(body1)
      ? "PASS"
      : "FAIL";
  await page.screenshot({ path: path.join(OUT, "01-sold-pdp.png"), fullPage: true });

  // 2) Saved — buyer session: save sold listing, verify badge
  await login(page, BUYER);
  await page.goto(`${ORIGIN}/listing/${SLUG}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const saveBtn = page.getByRole("button", { name: /wishlist|favourite|favorite|saved/i }).first();
  if (await saveBtn.isVisible().catch(() => false)) {
    const pressed = await saveBtn.getAttribute("aria-pressed");
    if (pressed !== "true") await saveBtn.click();
  }
  // API save fallback
  await page.evaluate(async (slug) => {
    await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlug: slug }),
    });
  }, SLUG);
  await page.goto(`${ORIGIN}/saved`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(800);
  const savedText = await page.locator("body").innerText();
  const soldBadge = page.locator('[data-tone="sold"], .badge').filter({ hasText: /SOLD/i }).first();
  const hasSoldBadge =
    (await soldBadge.isVisible().catch(() => false)) || /SOLD/i.test(savedText);
  const keptListing =
    savedText.includes("XLVIII") || savedText.includes(SLUG.slice(0, 12)) || (await page.locator("article").count()) > 0;
  report.saved_sold = hasSoldBadge && keptListing && !/Nothing saved/i.test(savedText) ? "PASS" : "FAIL";
  await page.screenshot({ path: path.join(OUT, "02-saved-sold.png"), fullPage: true });

  // 3) Seller order — fee isolation
  await context.clearCookies();
  const sellerPage = await context.newPage();
  await login(sellerPage, SELLER);
  await sellerPage.goto(`${ORIGIN}/seller/orders/${ORDER_ID}`, {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await sellerPage.waitForTimeout(1000);
  const sellerText = await sellerPage.locator("body").innerText();
  const hasSale = /Sale Price/i.test(sellerText);
  const hasReceive = /You.?ll Receive/i.test(sellerText);
  const hasShipping = /Shipping/i.test(sellerText);
  const forbidden =
    /Platform Fee/i.test(sellerText) ||
    /Total Paid/i.test(sellerText) ||
    /Buyer Total/i.test(sellerText) ||
    /Total buyer pays/i.test(sellerText);
  const feeIsolated = await sellerPage.locator('[data-buyer-fee-isolated="true"]').count();
  report.seller_fee_isolation =
    hasSale && hasReceive && hasShipping && !forbidden && feeIsolated > 0 ? "PASS" : "FAIL";
  report.seller_body_excerpt = sellerText.slice(0, 1200);
  await sellerPage.screenshot({ path: path.join(OUT, "03-seller-order-fee.png"), fullPage: true });

  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();

  const failed = Object.entries(report).some(([k, v]) => k !== "seller_body_excerpt" && v === "FAIL");
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
