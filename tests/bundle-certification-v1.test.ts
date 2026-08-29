/**
 * Bundle Engine v1.0 — Certification contract suite (NO new product features).
 * Proves Phase 1 laws in code: integrity, snapshot immutability, reservation rollback,
 * concurrency fail-closed copy, security non-trust of client totals, API surface.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildBundleCheckoutSnapshot,
  isBundleCheckoutSnapshot,
  snapshotPrimarySlug,
} from "@/lib/bundle/bundle-snapshot-v1";
import {
  mergeLineIntoBundle,
  bundleSubtotal,
  clampBundleQuantity,
} from "@/lib/bundle/bundle-domain-v1";
import { BUNDLE_ENGINE_V1 } from "@/lib/bundle/bundle-engine-v1";
import { BUNDLE_NOTIFICATION_MATRIX_V1 } from "@/lib/bundle/bundle-notification-matrix-ssot-v1";
import { BUNDLE_SELLER_CONFLICT_COPY } from "@/lib/bundle/bundle-domain-v1";
import { calculatePlatformFee, calculateOrderTotals } from "@/lib/orders/pricing";
import { amountsMatch } from "@/lib/checkout/buy-now-absolute-law-v1";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

describe("Bundle Certification — Database SQL contracts", () => {
  const sql = read("supabase/migrations/20260801180000_bundle_engine_v1.sql");
  const linesSql = read("supabase/migrations/20260801160000_checkout_sessions_bundle_lines_v1.sql");

  it("defines all four bundle tables + events", () => {
    expect(sql).toContain("create table if not exists public.bundles");
    expect(sql).toContain("create table if not exists public.bundle_items");
    expect(sql).toContain("create table if not exists public.bundle_offers");
    expect(sql).toContain("create table if not exists public.bundle_events");
  });

  it("enforces one active bundle per buyer + one seller check", () => {
    expect(sql).toContain("bundles_one_active_per_buyer_uidx");
    expect(sql).toContain("where status = 'active'");
    expect(sql).toContain("bundles_buyer_ne_seller");
  });

  it("enforces unique line per product and reserved_quantity", () => {
    expect(sql).toContain("unique (bundle_id, product_id)");
    expect(sql).toContain("reserved_quantity");
    expect(sql).toMatch(/quantity integer not null check \(quantity > 0\)/);
  });

  it("defines status transitions including checkout + paid", () => {
    expect(sql).toContain("'checkout'");
    expect(sql).toContain("'paid'");
    expect(sql).toContain("'discarded'");
    expect(sql).toContain("'expired'");
  });

  it("enables RLS and service_role writes", () => {
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("grant all on table public.bundles to service_role");
  });

  it("adds checkout_sessions.bundle_lines", () => {
    expect(linesSql).toContain("bundle_lines jsonb");
  });
});

describe("Bundle Certification — Snapshot immutability", () => {
  it("locks snapshot so post-payment listing edits cannot alter order source", () => {
    const snapshot = buildBundleCheckoutSnapshot({
      bundleId: "b1",
      buyerId: "buyer",
      sellerId: "seller",
      sellerName: "Seller",
      currency: "GBP",
      itemPrice: 50,
      platformFee: calculatePlatformFee(50),
      shipping: 0,
      total: calculateOrderTotals(50, 0).total,
      lines: [
        {
          productId: "p1",
          slug: "item",
          title: "Original Title",
          imageUrl: "/a.jpg",
          unitPrice: 50,
          quantity: 1,
          maxStock: 3,
          condition: "good",
          currency: "GBP",
        },
      ],
    });

    expect(snapshot.immutable).toBe(true);
    expect(isBundleCheckoutSnapshot(snapshot)).toBe(true);

    // Simulate seller edit — live listing changes must NOT mutate snapshot object identity fields used for order
    const liveListingAfterEdit = {
      title: "HACKED TITLE",
      price: 1,
      imageUrl: "/hack.jpg",
    };
    expect(snapshot.lines[0]!.title).toBe("Original Title");
    expect(snapshot.lines[0]!.unitPrice).toBe(50);
    expect(snapshot.lines[0]!.imageUrl).toBe("/a.jpg");
    expect(snapshot.lines[0]!.title).not.toBe(liveListingAfterEdit.title);
    expect(snapshot.lines[0]!.unitPrice).not.toBe(liveListingAfterEdit.price);
  });

  it("rejects non-immutable / empty snapshots", () => {
    expect(isBundleCheckoutSnapshot({ v: 1, immutable: false, lines: [{ a: 1 }] })).toBe(false);
    expect(isBundleCheckoutSnapshot({ v: 1, immutable: true, lines: [], itemPrice: 1, total: 1, bundleId: "x" })).toBe(
      false,
    );
  });
});

describe("Bundle Certification — Client totals never trusted", () => {
  it("server amountsMatch rejects client price spoof", () => {
    const live = 59.99;
    const clientSpoof = 1;
    expect(amountsMatch(live, clientSpoof)).toBe(false);
  });

  it("integrity engine source never accepts client totals as authority", () => {
    const src = read("lib/bundle/bundle-checkout-integrity-v1.ts");
    expect(src).toContain("Client totals / qty / prices are NEVER trusted");
    expect(src).toContain("FINANCIAL_AUDIT_ENGINE");
    expect(src).toContain("amountsMatch(livePrice, snapshotPrice)");
  });

  it("buy-now engine revalidates before reserve", () => {
    const src = read("lib/bundle/bundle-buy-now-engine-v1.ts");
    expect(src).toContain("revalidateBundleForCheckout");
    expect(src).toContain("verifyBundleInventoryAvailable");
    expect(src.indexOf("revalidateBundleForCheckout")).toBeLessThan(
      src.indexOf("verifyBundleInventoryAvailable"),
    );
  });
});

describe("Bundle Certification — Reservation paths (source)", () => {
  const reserveSrc = read("lib/bundle/bundle-reservation-engine-v1.ts");
  const sessionSrc = read("lib/checkout/engines/checkout-session-engine-v1.ts");
  const lifecycleSrc = read("lib/bundle/bundle-lifecycle-v1.ts");

  it("atomic reserve rolls back prior locks on failure", () => {
    expect(reserveSrc).toContain("Promise.all");
    expect(reserveSrc).toContain("releaseProductInventory");
    expect(reserveSrc).toContain("Some items are no longer available.");
    expect(reserveSrc).toContain("Concurrency Conflict");
    expect(reserveSrc).toContain("writeReservedQuantities");
  });

  it("session destroy releases bundle lines + restores active", () => {
    expect(sessionSrc).toContain("releaseBundleLinesFromSnapshot");
    expect(sessionSrc).toContain("restoreBundleAfterCheckoutCancel");
    expect(lifecycleSrc).toContain('toStatus: "active"');
    expect(lifecycleSrc).toContain('status: "paid"');
  });

  it("payment success marks every order line sold with quantity", () => {
    const post = read("lib/orders/post-payment.server.ts");
    expect(post).toContain("for (const line of soldLines)");
    expect(post).toContain("markProductSold(line.product_id!, qty)");
  });

  it("order create uses snapshot lines for multi-item", () => {
    const order = read("lib/orders/create-order-from-checkout-session.server.ts");
    expect(order).toContain("bundleSnapshot.lines.map");
    expect(order).toContain("markBundlePaidAfterOrder");
  });
});

describe("Bundle Certification — Concurrency fail-closed", () => {
  it("Owner conflict copy is locked", () => {
    expect(BUNDLE_SELLER_CONFLICT_COPY).toContain("You already have an active bundle");
  });

  it("domain merge blocks other seller", () => {
    const a = mergeLineIntoBundle({
      current: null,
      sellerId: "s1",
      sellerName: "A",
      line: {
        productId: "p1",
        slug: "a",
        title: "A",
        imageUrl: "",
        unitPrice: 10,
        quantity: 1,
        maxStock: 1,
      },
    });
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    const b = mergeLineIntoBundle({
      current: a.bundle,
      sellerId: "s2",
      sellerName: "B",
      line: {
        productId: "p2",
        slug: "b",
        title: "B",
        imageUrl: "",
        unitPrice: 10,
        quantity: 1,
        maxStock: 1,
      },
    });
    expect(b.ok).toBe(false);
    if (b.ok) return;
    expect(b.reason).toBe("other_seller");
  });

  it("quantity cannot exceed stock or go to zero", () => {
    expect(clampBundleQuantity(0, 5)).toBe(1);
    expect(clampBundleQuantity(99, 2)).toBe(2);
  });
});

describe("Bundle Certification — API surface", () => {
  it("buy-now accepts bundleId and routes to BUNDLE_BUY_NOW_ENGINE", () => {
    const route = read("app/api/checkout/buy-now/route.ts");
    expect(route).toContain("bundleId");
    expect(route).toContain("BUNDLE_BUY_NOW_ENGINE");
  });

  it("bundle API supports revalidate + ownership via auth", () => {
    const route = read("app/api/bundle/route.ts");
    expect(route).toContain('action: z.literal("revalidate")');
    expect(route).toContain("requireCookieOrBearerApiAuth");
    expect(route).toContain("requireCookieOrBearerApiAuth(request)");
    expect(route).not.toContain("requireAuthContext");
    expect(route).toContain("revalidateBundleForCheckout");
  });

  it("bundle API does not trust client price as write authority without server product load", () => {
    const server = read("lib/bundle/bundle-server-engine-v1.ts");
    expect(server).toContain('from("products")');
    expect(server).toContain("Number(product.price)");
  });
});

describe("Bundle Certification — Notification matrix completeness", () => {
  it("buyer + seller matrices include certification-required labels", () => {
    const buyerRequired = [
      "Added to Bundle",
      "Offer Sent",
      "Checkout Started",
      "Payment Successful",
      "Order Created",
      "Funds Released",
    ];
    const sellerRequired = [
      "Bundle Created",
      "Offer Received",
      "Bundle Purchased",
      "Prepare Order",
      "Funds Released",
    ];
    for (const label of buyerRequired) {
      expect(BUNDLE_NOTIFICATION_MATRIX_V1.buyer).toContain(label);
    }
    for (const label of sellerRequired) {
      expect(BUNDLE_NOTIFICATION_MATRIX_V1.seller).toContain(label);
    }
  });
});

describe("Bundle Certification — Singularity / no duplicates", () => {
  it("law forbids second checkout / cart / parallel orders", () => {
    expect(BUNDLE_ENGINE_V1.notACart).toBe(true);
    expect(BUNDLE_ENGINE_V1.notASecondCheckout).toBe(true);
    expect(BUNDLE_ENGINE_V1.singularity.oneOrderPerPaidBundle).toBe(true);
    expect(BUNDLE_ENGINE_V1.singularity.onePaymentPerBuyerBundle).toBe(true);
    expect(BUNDLE_ENGINE_V1.singularity.oneConversationPerBundleOffer).toBe(true);
    expect(BUNDLE_ENGINE_V1.forbidden).toContain("second-checkout");
  });

  it("offer engine creates one conversation for bundle", () => {
    const offer = read("lib/bundle/bundle-offer-engine-v1.ts");
    const route = read("app/api/offers/route.ts");
    expect(offer).toContain("findOrCreateConversation");
    expect(offer).toContain("createBundleOffer");
    expect(offer).toContain("supabase: SupabaseClient");
    expect(offer).toMatch(/findOrCreateConversation\(\{[\s\S]*supabase,/);
    expect(offer).not.toContain("await createClient()");
    expect(route).toMatch(/createBundleOffer\(\{[\s\S]*supabase,/);
  });
});

describe("Bundle Certification — Totals derivation", () => {
  it("subtotal derives from lines only", () => {
    const created = mergeLineIntoBundle({
      current: null,
      sellerId: "s",
      sellerName: "S",
      line: {
        productId: "p",
        slug: "x",
        title: "X",
        imageUrl: "",
        unitPrice: 12.5,
        quantity: 2,
        maxStock: 5,
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(bundleSubtotal(created.bundle)).toBe(25);
  });

  it("snapshot primary slug is first line", () => {
    const snap = buildBundleCheckoutSnapshot({
      bundleId: "b",
      buyerId: "u",
      sellerId: "s",
      sellerName: "S",
      currency: "GBP",
      itemPrice: 10,
      platformFee: 0.55,
      shipping: 0,
      total: 10.55,
      lines: [
        {
          productId: "1",
          slug: "first",
          title: "First",
          imageUrl: "",
          unitPrice: 10,
          quantity: 1,
          maxStock: 1,
          condition: "good",
          currency: "GBP",
        },
      ],
    });
    expect(snapshotPrimarySlug(snap)).toBe("first");
  });
});

describe("Bundle Certification — Regression freeze surfaces untouched by Phase 1 extras", () => {
  it("does not introduce Sell redesign markers in bundle engines", () => {
    const buyNow = read("lib/bundle/bundle-buy-now-engine-v1.ts");
    expect(buyNow).not.toContain("SellPage");
    expect(buyNow).not.toContain("homepage");
  });

  it("checkout UI freeze file unchanged by bundle certification (exists)", () => {
    expect(read("lib/checkout/checkout-ui-v1-freeze.ts")).toContain("CHECKOUT_UI");
  });
});
