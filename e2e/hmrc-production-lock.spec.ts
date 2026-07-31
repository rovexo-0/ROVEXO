import { expect, test } from "@playwright/test";

/**
 * HMRC Production Lock — API + route smoke (auth-gated).
 * Engine / DOB / documents / Super Admin wiring covered by Vitest.
 * Uses request fixture (no browser binary) for CI-stable smoke.
 */
test.describe("HMRC Production Lock", () => {
  test("seller compliance route responds without server error", async ({ request }) => {
    const response = await request.get("/seller/compliance", { maxRedirects: 0 });
    expect(response.status()).toBeLessThan(500);
    expect([200, 302, 303, 307, 308, 401, 403]).toContain(response.status());
  });

  test("document endpoints reject unauthenticated requests", async ({ request }) => {
    for (const kind of ["sales_summary", "annual_report", "hmrc_export"] as const) {
      const response = await request.get(`/api/seller/compliance/documents/${kind}`, {
        maxRedirects: 0,
      });
      expect(response.status()).toBeLessThan(500);
      expect([401, 403, 302, 303, 307, 308]).toContain(response.status());
    }
  });

  test("seller compliance route redirects guests without server error", async ({ request }) => {
    const response = await request.get("/seller/compliance", { maxRedirects: 0 });
    expect(response.status()).toBeLessThan(500);
    expect([200, 302, 303, 307, 308, 401, 403]).toContain(response.status());
  });

  test("unknown document kind fail-closes", async ({ request }) => {
    const response = await request.get("/api/seller/compliance/documents/not_a_real_kind", {
      maxRedirects: 0,
    });
    expect(response.status()).toBeLessThan(500);
    expect([401, 403, 404, 302, 303, 307, 308]).toContain(response.status());
  });

  test("super admin HMRC settings route responds without server error", async ({ request }) => {
    const response = await request.get("/super-admin/hmrc", { maxRedirects: 0 });
    expect(response.status()).toBeLessThan(500);
    expect([200, 302, 303, 307, 308, 401, 403]).toContain(response.status());
  });

  test("seller tax DOB completion route responds without server error", async ({ request }) => {
    const response = await request.get("/seller/tax", { maxRedirects: 0 });
    expect(response.status()).toBeLessThan(500);
    expect([200, 302, 303, 307, 308, 401, 403]).toContain(response.status());
  });
});
