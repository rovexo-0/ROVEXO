import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { filterSoldOrdersBySellerContext } from "@/lib/orders/role";
import {
  resolveOrdersBackHref,
  resolveOrdersReturnTo,
  withOrdersReturnTo,
} from "@/lib/orders/orders-return-to-v1";
import type { Order } from "@/lib/orders/types";

function src(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

function order(id: string, sellerContext: Order["sellerContext"]): Order {
  return {
    id,
    orderNumber: id,
    status: "awaiting_shipment",
    product: { id: "p", slug: "p", title: "P", price: 10, imageUrl: "", condition: "good" },
    buyer: { id: "buyer", name: "Buyer" },
    seller: { id: "seller", name: "Seller" },
    totals: { itemPrice: 10, platformFee: 1, delivery: 2, total: 13 },
    deliveryCarrier: "Royal Mail",
    createdAt: new Date().toISOString(),
    disputesDisabled: false,
    sellerContext,
  };
}

describe("Business zero-gap P1 — Orders seller_context + returnTo", () => {
  it("isolates sold orders by seller_context without forking the engine", () => {
    const list = [
      order("ind", "individual"),
      order("biz", "business"),
      order("legacy", undefined),
    ];
    expect(filterSoldOrdersBySellerContext(list, "individual").map((row) => row.id)).toEqual([
      "ind",
      "legacy",
    ]);
    expect(filterSoldOrdersBySellerContext(list, "business").map((row) => row.id)).toEqual(["biz"]);
    expect(src("lib/orders/queries.ts")).toContain("filterSoldOrdersBySellerContext");
    expect(src("app/(platform)/orders/page.tsx")).toContain("loadActiveSellerContext");
    expect(src("app/(platform)/business/orders/page.tsx")).toContain("returnTo=/business/menu");
  });

  it("preserves allowlisted Business returnTo across tab/chip changes", () => {
    expect(resolveOrdersReturnTo("/evil")).toBeNull();
    expect(resolveOrdersReturnTo("/business/menu")).toBe("/business/menu");
    expect(resolveOrdersBackHref("/business/menu")).toEqual({
      href: "/business/menu",
      label: "Business",
    });
    expect(withOrdersReturnTo("sold", "in_progress", "/business/menu")).toBe(
      "/orders?tab=sold&status=in_progress&returnTo=%2Fbusiness%2Fmenu",
    );
    expect(src("features/orders/components/OrdersPage.tsx")).toContain("withOrdersReturnTo");
    expect(src("features/orders/components/OrdersPage.tsx")).not.toContain('backHref="/account"');
  });
});

describe("Business zero-gap P1 — Analytics canonical data", () => {
  it("does not invent channels, geo, or performance splits", () => {
    const store = src("lib/analytics/store.ts");
    expect(store).not.toContain("Ireland");
    expect(store).not.toContain('label: "Marketplace"');
    expect(store).not.toContain("0.02");
    expect(store).not.toContain("0.7 + index");
    expect(store).toContain('query = query.eq("seller_context", "business")');
    expect(store).toContain("trafficSources: []");
    expect(store).toContain("BUSINESS_ANALYTICS_CAPABILITIES");
    expect(src("lib/analytics/business-analytics-v1.ts")).toContain("trafficSources: false");
    expect(src("lib/analytics/business-analytics-v1.ts")).toContain("searchKeywords: false");
    expect(src("lib/business/dashboard.ts")).not.toContain("rating: 4.8");
  });
});

describe("Business zero-gap P1 — Stripe verification authority", () => {
  it("admin trust sync cannot set verified_business", () => {
    const trust = src("lib/trust/service.ts");
    expect(trust).not.toContain("if (type === \"business\") update.verified_business = true");
    expect(trust).toContain("Stripe Connect is the only authority for verified_business");
    expect(src("lib/stripe/connect.ts")).toContain("verified_business: verified");
  });
});

describe("Business zero-gap P1 — Wallet Connect overlay + tax SSOT", () => {
  it("overlays stripe_connect connected from context Connect status", () => {
    const wallet = src("lib/wallet/store.ts");
    expect(wallet).toContain("overlayWithdrawMethodsForConnectStatus");
    expect(wallet).toContain("getConnectAccountStatus(userId, context)");
    expect(wallet).toContain('method.provider === "stripe_connect"');
  });

  it("Business VAT consumes the one-account tax SSOT", () => {
    const tax = src("app/(platform)/business/tax/page.tsx");
    expect(tax).toContain("getSellerTaxProfile");
    expect(tax).toContain("SellerTaxRegistrationPage");
    expect(tax).toContain('createConnectAccountLink(profile.id, "business")');
    expect(tax).not.toContain("business_tax_profiles");
  });
});

describe("Business zero-gap P1 — Auth TS + Connect extra step", () => {
  it("Production auth sign-in does not ship localhost Production-auth mint", () => {
    const actions = src("lib/auth/actions.ts");
    expect(actions).not.toContain("as typeof data");
    expect(actions).not.toContain("localhost-production-auth-v1");
    expect(actions).not.toContain("mintLocalSessionForProductionUser");
    expect(actions).toContain("signInWithPassword");
  });

  it("Connect intro starts Stripe without an extra onboarding page hop", () => {
    const connect = src("features/business/onboarding/BusinessConnectStripe.tsx");
    expect(connect).not.toContain("stage=onboarding");
    expect(connect).toContain("void startStripe()");
  });

  it("Business Connect consumes UK tax/country SSOT instead of failing closed on empty tax country", () => {
    const connect = src("lib/stripe/connect.ts");
    expect(connect).toContain("UK_DEFAULT_COUNTRY");
    expect(connect).toContain("resolveConnectIdentityCountry");
  });
});
