import { describe, expect, it } from "vitest";
import {
  BUSINESS_PROTECTION_HOURS,
  INDIVIDUAL_PROTECTION_HOURS,
  LOST_PARCEL_SELLER_GUARANTEE_MAX_GBP,
  MIN_WITHDRAW_GBP,
  normalizeSellerContext,
  protectionHoursForSellerContext,
  resolveSellerContextFromBusinessProfile,
} from "@/lib/seller-context/seller-context-v1";
import { decideRelease } from "@/lib/commerce-engine/release-policy";
import { computeSellerGuaranteeNetGbp } from "@/lib/resolution-engine/lost-parcel-guarantee-math-v1";
import { calculateOrderTotals, PLATFORM_FEE_RATE } from "@/lib/orders/pricing";
import { calculateSellerNetAmount } from "@/lib/wallet/sales";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function src(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Stripe E2E canonical — seller context & protection", () => {
  it("normalizes seller contexts", () => {
    expect(normalizeSellerContext("business")).toBe("business");
    expect(normalizeSellerContext("individual")).toBe("individual");
    expect(normalizeSellerContext(null)).toBe("individual");
  });

  it("resolves business context from business profile fields", () => {
    expect(resolveSellerContextFromBusinessProfile({ businessName: "ACME Ltd" })).toBe("business");
    expect(resolveSellerContextFromBusinessProfile({})).toBe("individual");
  });

  it("Individual = 48h · Business = 14 days", () => {
    expect(INDIVIDUAL_PROTECTION_HOURS).toBe(48);
    expect(BUSINESS_PROTECTION_HOURS).toBe(336);
    expect(protectionHoursForSellerContext("individual")).toBe(48);
    expect(protectionHoursForSellerContext("business")).toBe(336);
  });

  it("decideRelease uses immutable seller_context hours (not UI switch)", () => {
    const deliveredAt = new Date(Date.now() - 50 * 3600_000).toISOString(); // 50h ago
    expect(
      decideRelease({
        status: "delivered",
        deliveredAt,
        hasRefund: false,
        hasOpenClaim: false,
        requireTimer: true,
        sellerContext: "individual",
      }),
    ).toBe("released");

    expect(
      decideRelease({
        status: "delivered",
        deliveredAt,
        hasRefund: false,
        hasOpenClaim: false,
        requireTimer: true,
        sellerContext: "business",
      }),
    ).toBe("within_hold_window");

    const after14d = new Date(Date.now() - 15 * 24 * 3600_000).toISOString();
    expect(
      decideRelease({
        status: "delivered",
        deliveredAt: after14d,
        hasRefund: false,
        hasOpenClaim: false,
        requireTimer: true,
        sellerContext: "business",
      }),
    ).toBe("released");
  });
});

describe("Stripe E2E canonical — fee & seller entitlement", () => {
  it("Buyer Protection is single 5.5% and seller fee is £0", () => {
    expect(PLATFORM_FEE_RATE).toBe(0.055);
    const totals = calculateOrderTotals(100, 4.99);
    expect(totals.platformFee).toBe(5.5);
    expect(totals.total).toBe(110.49);
    const { sellerAmount, platformFee } = calculateSellerNetAmount(100);
    expect(sellerAmount).toBe(100);
    expect(platformFee).toBe(5.5);
  });

  it("Checkout Stripe line item is named Buyer Protection", () => {
    expect(src("lib/orders/checkout.ts")).toContain('name: "Buyer Protection"');
    expect(src("lib/orders/checkout.ts")).not.toContain('name: "Platform Fee"');
  });
});

describe("Stripe E2E canonical — release & withdraw", () => {
  it("settlement releases to Available without Stripe Transfer", () => {
    const settlement = src("lib/commerce-engine/settlement.ts");
    expect(settlement).toContain("releaseSaleToAvailable");
    expect(settlement).not.toContain("transferSalePayoutToConnect");
    expect(settlement).toContain("available_not_transfer");
  });

  it("legacy automatic sale Connect Transfer is permanently disabled", () => {
    const payouts = src("lib/stripe/payouts.ts");
    expect(payouts).toContain("legacy_sale_connect_transfer_disabled");
    expect(payouts).not.toContain("stripe.transfers.create");
    const sales = src("lib/wallet/sales.ts");
    expect(sales).toContain("releaseEligibleOrders");
    expect(sales).not.toContain("processAutomaticSellerPayouts");
  });

  it("withdraw is the only Stripe payout path", () => {
    const withdraw = src("lib/stripe/withdraw-payout.ts");
    expect(withdraw).toContain("stripe.transfers.create");
    expect(withdraw).toContain("mustUseVirtualWallet");
  });

  it("minimum withdraw is £0.01", () => {
    expect(MIN_WITHDRAW_GBP).toBe(0.01);
    expect(src("lib/wallet/store.ts")).toContain("MIN_WITHDRAW_GBP");
  });
});

describe("Stripe E2E canonical — lost parcel guarantee", () => {
  it("seller guarantee caps at £100 and nets carrier compensation", () => {
    expect(LOST_PARCEL_SELLER_GUARANTEE_MAX_GBP).toBe(100);
    expect(computeSellerGuaranteeNetGbp({ orderItemPriceGbp: 250 }).net).toBe(100);
    expect(
      computeSellerGuaranteeNetGbp({ orderItemPriceGbp: 80, carrierCompensationGbp: 30 }).net,
    ).toBe(50);
    expect(
      computeSellerGuaranteeNetGbp({ orderItemPriceGbp: 40, carrierCompensationGbp: 50 }).net,
    ).toBe(0);
  });
});

describe("Stripe E2E canonical — architecture wiring", () => {
  it("persists seller_context on order create and checkout session", () => {
    expect(src("lib/orders/create-order-from-checkout-session.server.ts")).toContain(
      "seller_context: sellerContext",
    );
    expect(src("lib/checkout/engines/checkout-session-engine-v1.ts")).toContain(
      "seller_context: sellerContext",
    );
  });

  it("Connect supports dual individual/business accounts", () => {
    const connect = src("lib/stripe/connect.ts");
    expect(connect).toContain("sellerContext");
    expect(connect).toContain("stripe_connect_account_id_individual");
    expect(connect).toContain("stripe_connect_account_id_business");
  });

  it("shipping sets shipped on carrier collection", () => {
    expect(src("lib/commerce-engine/shipping-hooks.server.ts")).toContain('status: "shipped"');
    expect(src("lib/commerce-engine/shipping-hooks.server.ts")).toContain("collected");
  });

  it("webhooks record ignored_unhandled_type", () => {
    expect(src("lib/stripe/webhook-handler.ts")).toContain("ignored_unhandled_type");
  });

  it("partial refunds accept amountGbp", () => {
    expect(src("lib/stripe/refunds.ts")).toContain("amountGbp");
    expect(src("lib/stripe/refund-math-v1.ts")).toContain("Invalid partial refund amount");
  });

  it("migration is additive for seller_context and dual connect", () => {
    const migration = src(
      "supabase/migrations/20260831170000_stripe_e2e_canonical_seller_context_v1.sql",
    );
    expect(migration).toContain("seller_context");
    expect(migration).toContain("stripe_connect_account_id_individual");
    expect(migration).toContain("wallet_context");
    expect(migration).toContain("lost_parcel_guarantee_events");
    expect(migration).toMatch(
      /alter table public\.lost_parcel_guarantee_events\s+enable row level security/i,
    );
    expect(migration).toContain(
      "revoke all on table public.lost_parcel_guarantee_events from anon, authenticated",
    );
    expect(migration).not.toMatch(/drop table/i);
  });
});

describe("Stripe E2E canonical — Phase 1D withdraw remediation", () => {
  it("withdraw rail requires explicit sellerContext", () => {
    expect(src("lib/stripe/withdraw-payout.ts")).toContain(
      "sellerContext: SellerContext",
    );
    expect(src("lib/stripe/withdraw-payout.ts")).toMatch(
      /assertWithdrawalRailReady\([\s\S]*sellerContext/,
    );
  });

  it("separates stripe_transfer_id from stripe_payout_id", () => {
    expect(src("lib/stripe/stripe-object-ids-v1.ts")).toContain("isStripeTransferId");
    expect(src("lib/stripe/stripe-object-ids-v1.ts")).toContain("isStripePayoutId");
    expect(src("lib/wallet/store.ts")).toContain("markWithdrawalTransferAwaitingPayout");
    expect(src("lib/wallet/store.ts")).toContain("confirmWithdrawalBankCompleted");
  });
});
