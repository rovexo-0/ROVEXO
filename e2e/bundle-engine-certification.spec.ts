/**
 * Bundle Engine v1.0 — Playwright certification smoke (API fail-closed + surfaces).
 * Full Owner Journey (Stripe / Wallet / Print Label) requires authenticated Demo Session — reported separately.
 */
import { expect, test } from "@playwright/test";

test.describe("Bundle Engine v1.0 Certification Smoke", () => {
  test("Review Bundle route loads (no white screen)", async ({ page }) => {
    const response = await page.goto("/bundle/review", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).not.toBeEmpty();
    const text = await page.locator("body").innerText();
    expect(text.length).toBeGreaterThan(20);
  });

  test("GET /api/bundle without auth fails closed", async ({ request }) => {
    const res = await request.get("/api/bundle");
    expect([401, 403]).toContain(res.status());
  });

  test("POST /api/bundle add without auth fails closed", async ({ request }) => {
    const res = await request.post("/api/bundle", {
      data: {
        action: "add",
        productId: "00000000-0000-4000-8000-000000000001",
        sellerId: "00000000-0000-4000-8000-000000000002",
        quantity: 1,
      },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("POST /api/checkout/buy-now with bundleId without auth fails closed", async ({ request }) => {
    const res = await request.post("/api/checkout/buy-now", {
      data: {
        bundleId: "00000000-0000-4000-8000-000000000099",
        productSlug: "probe",
      },
    });
    expect([401, 403]).toContain(res.status());
    const body = await res.json();
    expect(body.success).toBeFalsy();
  });

  test("POST /api/checkout/buy-now rejects empty payload", async ({ request }) => {
    // May be 401 first if unauthenticated — either is fail-closed.
    const res = await request.post("/api/checkout/buy-now", { data: {} });
    expect([400, 401, 403]).toContain(res.status());
  });
});
