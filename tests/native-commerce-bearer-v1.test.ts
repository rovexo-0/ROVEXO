import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relative: string) => readFileSync(join(ROOT, relative), "utf8");

describe("Native commerce cookie+Bearer (existing APIs only)", () => {
  it("POST /api/offers accepts cookie or Native Bearer and does not take client senderId", () => {
    const route = read("app/api/offers/route.ts");
    expect(route).toContain("requireCookieOrBearerApiAuth");
    expect(route).toContain("requireCookieOrBearerApiAuth(request)");
    expect(route).not.toContain("requireAuthContext");
    expect(route).not.toContain("senderId");
    expect(route).not.toContain("senderRole");
    expect(route).toContain("buyer_id: user.id");
    expect(route).toContain("amount: z.number().positive()");
    expect(route).not.toContain("Offer must be below the listing price");
    expect(route).not.toContain("amount >= Number(product.price)");
  });

  it("POST /api/follows accepts cookie or Native Bearer without a second follow API", () => {
    const route = read("app/api/follows/route.ts");
    expect(route).toContain("requireCookieOrBearerApiAuth");
    expect(route).toContain("requireCookieOrBearerApiAuth(request)");
    expect(route).toContain("optionalCookieOrBearerApiAuth");
    expect(route).not.toContain("requireApiAuth()");
    expect(route).not.toContain("requireAuthContext");
  });

  it("POST /api/bundle accepts cookie or Native Bearer without a second bundle API", () => {
    const route = read("app/api/bundle/route.ts");
    expect(route).toContain("requireCookieOrBearerApiAuth");
    expect(route).toContain("requireCookieOrBearerApiAuth(request)");
    expect(route).not.toContain("requireAuthContext");
  });

  it("POST /api/messages passes verified supabase into findOrCreateConversation", () => {
    const route = read("app/api/messages/route.ts");
    const conversations = read("lib/messages/conversations.ts");
    expect(route).toContain("supabase: auth.supabase");
    expect(conversations).toContain("supabase?: SupabaseClient");
    expect(conversations).toContain("input.supabase ?? (await createClient())");
  });

  it("GET /api/store/[slug] is public and returns kind ok without a second store engine", () => {
    const route = read("app/api/store/[slug]/route.ts");
    expect(route).toContain("optionalCookieOrBearerApiAuth");
    expect(route).toContain("resolveStoreByRouteParam");
    expect(route).toContain('kind: "ok"');
    expect(route).toContain("getEligibleListings");
    expect(route).not.toContain("requireApiAuth");
    expect(route).not.toContain("requireAuthContext");
    expect(route).not.toContain("StoreV2");
  });

  it("POST /api/checkout/buy-now accepts cookie or Native Bearer without a second checkout API", () => {
    const route = read("app/api/checkout/buy-now/route.ts");
    expect(route).toContain("requireCookieOrBearerApiAuth");
    expect(route).toContain("BUY_NOW_ENGINE");
    expect(route).not.toContain("requireApiAuth");
  });

  it("POST /api/checkout/shipping-quotes accepts cookie or Native Bearer", () => {
    const route = read("app/api/checkout/shipping-quotes/route.ts");
    expect(route).toContain("requireCookieOrBearerApiAuth(request)");
    expect(route).not.toContain("requireApiAuth");
  });
});
