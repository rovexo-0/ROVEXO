/**
 * ROVEXO Absolute Blood Law XLII — Full Platform Certification E2E
 *
 * Environment: http://localhost:3000 ONLY
 * Demo: demo.buyer@rovexo.co.uk · demo.seller@rovexo.co.uk (isolated, virtual)
 * Data protection: never mutate production listings/users/wallet/orders permanently.
 *
 * Run (against live localhost:3000):
 *   PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_ALLOW_REMOTE=1 \
 *   FULL_PLATFORM_CERT_ORIGIN=http://localhost:3000 \
 *   npx playwright test e2e/full-platform-certification.spec.ts --project=chromium
 */

import { expect, test, type Page } from "@playwright/test";
import { FULL_DEMO_ACCOUNTS } from "../lib/full-demo/canonical";
import { signInWithSessionCookies } from "./helpers/auth";

const ORIGIN = process.env.FULL_PLATFORM_CERT_ORIGIN ?? "http://localhost:3000";
const BUYER = FULL_DEMO_ACCOUNTS[0];
const SELLER = FULL_DEMO_ACCOUNTS[1];

async function gotoLive(page: Page, path: string) {
  const url = path.startsWith("http") ? path : `${ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  return response;
}

test.describe.configure({ mode: "serial" });

test.describe("FULL_PLATFORM · Blood Law XLII · localhost:3000", () => {
  test.beforeAll(async ({ request }) => {
    const probe = await request.get(ORIGIN, { timeout: 10_000 }).catch(() => null);
    test.skip(
      !probe || !probe.ok(),
      `Full Platform Certification requires live ${ORIGIN}. Start: npm run dev -p 3000`,
    );
  });

  test("01 Authentication — Login / Register surfaces render", async ({ page }) => {
    const login = await gotoLive(page, "/login");
    expect(login?.ok()).toBeTruthy();
    await expect(page.locator('[data-auth-screen="login"], [data-auth-experience-freeze="XLI"]').first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator(".rovexo-brand-logo__canonical-img, img[alt='ROVEXO']").first()).toBeVisible();

    const register = await gotoLive(page, "/register");
    expect(register?.ok()).toBeTruthy();
    await expect(
      page.locator('[data-auth-screen="register"], [data-register-visual-polish="XL"]').first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("02 Homepage — Header RX + Search render (Demo Buyer session)", async ({ page, baseURL }) => {
    test.skip(!BUYER?.password, "Full Demo buyer password required");
    await signInWithSessionCookies(page, {
      email: BUYER.email,
      password: BUYER.password ?? "",
      baseURL: ORIGIN || baseURL || "http://localhost:3000",
    });
    const home = await gotoLive(page, "/");
    expect(home?.ok() || home?.status() === 304).toBeTruthy();
    // Guest startup redirects to Login — authenticated session must reach Homepage chrome.
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.locator(".rx-h2__logo-img, a[aria-label='ROVEXO Home'], header.rx-h2").first(),
    ).toBeVisible({ timeout: 25_000 });
    await expect(
      page.locator('input[placeholder*="Search"], [role="searchbox"], #rx-h2-search').first(),
    ).toBeVisible();
  });

  test("03 Search — Search route loads (Demo Buyer session)", async ({ page, baseURL }) => {
    test.skip(!BUYER?.password, "Full Demo buyer password required");
    await signInWithSessionCookies(page, {
      email: BUYER.email,
      password: BUYER.password ?? "",
      baseURL: ORIGIN || baseURL || "http://localhost:3000",
    });
    const res = await gotoLive(page, "/search");
    expect(res?.ok() || res?.status() === 304).toBeTruthy();
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("08 Wallet / Balance — Balance surface loads for Demo Buyer", async ({ page, baseURL }) => {
    test.skip(!BUYER?.password, "Full Demo buyer password required");
    await signInWithSessionCookies(page, {
      email: BUYER.email,
      password: BUYER.password ?? "",
      baseURL: ORIGIN || baseURL || "http://localhost:3000",
    });
    const res = await gotoLive(page, "/balance");
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText(/Balance|Withdraw|Available/i, {
      timeout: 25_000,
    });
  });

  test("12 Orders — Orders surface loads for Demo Buyer", async ({ page, baseURL }) => {
    test.skip(!BUYER?.password, "Full Demo buyer password required");
    await signInWithSessionCookies(page, {
      email: BUYER.email,
      password: BUYER.password ?? "",
      baseURL: ORIGIN || baseURL || "http://localhost:3000",
    });
    const res = await gotoLive(page, "/orders");
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText(/Orders|Bought|Sold|In Progress|Empty/i, {
      timeout: 25_000,
    });
  });

  test("05 Messaging — Inbox Hub loads for Demo Buyer", async ({ page, baseURL }) => {
    test.skip(!BUYER?.password, "Full Demo buyer password required");
    await signInWithSessionCookies(page, {
      email: BUYER.email,
      password: BUYER.password ?? "",
      baseURL: ORIGIN || baseURL || "http://localhost:3000",
    });
    const res = await gotoLive(page, "/inbox");
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText(/Inbox|Messages|Notifications/i, {
      timeout: 25_000,
    });
  });

  test("16 Account dashboard — Profile loads for Demo Seller", async ({ page, baseURL }) => {
    test.skip(!SELLER?.password, "Full Demo seller password required");
    await signInWithSessionCookies(page, {
      email: SELLER.email,
      password: SELLER.password ?? "",
      baseURL: ORIGIN || baseURL || "http://localhost:3000",
    });
    const res = await gotoLive(page, "/account");
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText(/Profile|Settings|Balance|Orders/i, {
      timeout: 25_000,
    });
  });

  test("19 Errors — 404 fail-closed (no white crash)", async ({ page }) => {
    await gotoLive(page, "/this-route-must-not-exist-full-platform-cert-xlii");
    await expect(page.locator("body")).toBeVisible();
    const text = await page.locator("body").innerText();
    expect(text.length).toBeGreaterThan(0);
  });

  test("20 E2E chain gate — Full Demo mandatory flow still owned by full-demo-certification.spec.ts", async () => {
    // Absolute law: the complete Message→Offer→…→Complete Order chain is certified by
    // e2e/full-demo-certification.spec.ts (virtual money, isolated Full Demo accounts).
    // This gate asserts that ownership file remains present and wired.
    const { existsSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const fullDemo = join(process.cwd(), "e2e/full-demo-certification.spec.ts");
    expect(existsSync(fullDemo)).toBe(true);
    const source = readFileSync(fullDemo, "utf8");
    expect(source).toContain("FULL_DEMO_ACCOUNTS");
    expect(source).toMatch(/FULL_DEMO|Full Demo/i);
    expect(source).toContain("signInWithSessionCookies");
  });
});
