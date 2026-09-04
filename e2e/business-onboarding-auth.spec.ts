import { test, expect } from "@playwright/test";
import { signInDemoSeller } from "./helpers/sell";

test.describe("Business onboarding APIs — auth fail closed", () => {
  test("GET /api/business/status requires authentication", async ({ request }) => {
    const response = await request.get("/api/business/status");
    expect(response.status()).toBe(401);
  });

  test("PATCH /api/business/profile requires authentication", async ({ request }) => {
    const response = await request.patch("/api/business/profile", {
      data: { businessName: "Nope" },
    });
    expect(response.status()).toBe(401);
  });

  test("POST /api/business/connect requires authentication", async ({ request }) => {
    const response = await request.post("/api/business/connect", { data: {} });
    expect(response.status()).toBe(401);
  });

  test("GET /api/business/home requires authentication", async ({ request }) => {
    const response = await request.get("/api/business/home");
    expect(response.status()).toBe(401);
  });

  test("GET /api/business/inventory requires authentication", async ({ request }) => {
    const response = await request.get("/api/business/inventory");
    expect(response.status()).toBe(401);
  });

  test("GET /api/seller/review-center requires authentication", async ({ request }) => {
    const response = await request.get("/api/seller/review-center");
    expect(response.status()).toBe(401);
  });

  test("GET /api/seller/review-center?surface=business requires authentication", async ({
    request,
  }) => {
    const response = await request.get("/api/seller/review-center?surface=business");
    expect(response.status()).toBe(401);
  });

  test("GET /api/business/directory requires authentication", async ({ request }) => {
    const response = await request.get("/api/business/directory");
    expect(response.status()).toBe(401);
  });

  test("PATCH /api/business/context requires authentication", async ({ request }) => {
    const response = await request.patch("/api/business/context", {
      data: { context: "business" },
    });
    expect(response.status()).toBe(401);
  });

  test("POST /api/business/connect with PWA surface still requires authentication", async ({
    request,
  }) => {
    const response = await request.post("/api/business/connect", {
      data: { surface: "pwa" },
    });
    expect(response.status()).toBe(401);
  });

  test("unauthenticated Business Information redirects away from the form", async ({ request }) => {
    const response = await request.get("/business/information", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
  });

  test("legacy Business Verification redirects to Stripe Connect", async ({ request }) => {
    const response = await request.get("/business/verification", { maxRedirects: 0 });
    expect([301, 302, 303, 307, 308]).toContain(response.status());
    const location = response.headers()["location"] ?? "";
    expect(location).toMatch(/\/business\/connect|\/login|\/auth\//);
  });

  test("authenticated GET /business/information compiles without 500", async ({ page, baseURL }) => {
    await signInDemoSeller(page, baseURL!);
    const response = await page.request.get("/business/information", { maxRedirects: 0 });
    const body = await response.text();
    expect(response.status(), body.slice(0, 800)).not.toBe(500);
    expect([200, 303, 307, 308]).toContain(response.status());
    expect(body).not.toContain("build-manifest.json");
    expect(body).not.toContain("ENOENT");
    if (response.status() === 200) {
      expect(body).toMatch(/BUSINESS INFORMATION|Business or trading name|Connect with Stripe/i);
    }
  });
});
