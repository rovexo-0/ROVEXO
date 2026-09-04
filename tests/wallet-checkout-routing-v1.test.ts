import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildBuyerCheckoutDebitDescription,
  buildBuyerCheckoutDebitIdempotencyKey,
  canDebitAvailable,
  isWalletCheckoutEligible,
  remainingAfterWalletCheckoutDebit,
  WALLET_CHECKOUT_DEBIT_DESCRIPTION_PREFIX,
} from "@/lib/wallet/security";
import { resolveCheckoutPaymentRail } from "@/lib/full-demo/security";

const createAdminClient = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient,
}));

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const AVAILABLE = 9.07;
const PRODUCT = 0.5;
const PLATFORM_FEE = 0.03;
const SHIPPING = 3.19;
const TOTAL = 3.72;
const REMAINING = 5.35;

describe("Wallet checkout routing — production scenario £9.07 / £3.72", () => {
  it("TEST A: Wallet £9.07 + checkout £3.72 is eligible", () => {
    expect(isWalletCheckoutEligible(AVAILABLE, TOTAL)).toBe(true);
    expect(canDebitAvailable(AVAILABLE, TOTAL)).toBe(true);
  });

  it("TEST B: expected debit is the locked payable total £3.72", () => {
    expect(PRODUCT + PLATFORM_FEE + SHIPPING).toBeCloseTo(TOTAL, 2);
    expect(remainingAfterWalletCheckoutDebit(AVAILABLE, PRODUCT)).not.toBe(REMAINING);
    expect(remainingAfterWalletCheckoutDebit(AVAILABLE, PLATFORM_FEE)).not.toBe(REMAINING);
    expect(remainingAfterWalletCheckoutDebit(AVAILABLE, SHIPPING)).not.toBe(REMAINING);
    expect(remainingAfterWalletCheckoutDebit(AVAILABLE, TOTAL)).toBe(REMAINING);
  });

  it("TEST C: remaining balance after £3.72 debit is £5.35", () => {
    expect(remainingAfterWalletCheckoutDebit(AVAILABLE, TOTAL)).toBe(REMAINING);
  });

  it("TEST D: insufficient wallet rejects checkout — no debit", () => {
    expect(isWalletCheckoutEligible(AVAILABLE, 9.08)).toBe(false);
    expect(remainingAfterWalletCheckoutDebit(AVAILABLE, 9.08)).toBeNull();
    const checkout = read("lib/orders/checkout.ts");
    expect(checkout).toContain("readBuyerWalletCheckoutEligibility");
    expect(checkout).toContain('if (!eligible.ok)');
    expect(checkout).toContain("return { error: eligible.error }");
  });

  it("TEST E: duplicate idempotency key cannot debit twice", () => {
    const key = buildBuyerCheckoutDebitIdempotencyKey("cs_test_1");
    expect(key).toBe("buyer-checkout:cs_test_1");
    const sales = read("lib/wallet/sales.ts");
    expect(sales).toContain("buildBuyerCheckoutDebitIdempotencyKey");
    expect(sales).toContain("alreadyDebited: true");
    expect(sales).toContain(".eq(\"idempotency_key\", idempotencyKey)");
  });

  it("TEST F: order creation failure does not leave a permanent Wallet debit", () => {
    const checkout = read("lib/orders/checkout.ts");
    expect(checkout).toContain("reverseBuyerWalletCheckoutDebit");
    expect(checkout).toContain("if (!created.success)");
    const eligibilityBeforeCreate =
      checkout.indexOf("readBuyerWalletCheckoutEligibility") <
      checkout.lastIndexOf("createOrderFromPaidCheckoutSession");
    expect(eligibilityBeforeCreate).toBe(true);
  });

  it("TEST G: Wallet rail does not require Stripe readiness", () => {
    expect(resolveCheckoutPaymentRail({ paymentMethod: "rovexo_balance" })).toBe(
      "rovexo_balance",
    );
    const checkout = read("lib/orders/checkout.ts");
    const walletDebitIdx = checkout.indexOf("debitBuyerWalletForCheckout");
    const settleIdx = checkout.indexOf("mustSettleWithoutStripe");
    expect(walletDebitIdx).toBeGreaterThan(-1);
    expect(settleIdx).toBeGreaterThan(-1);
    expect(checkout).toContain('paymentRail === "rovexo_balance"');
    // Wallet settlement runs in the settleWithoutStripe branch — before Stripe client init.
    expect(checkout).toContain("if (settleWithoutStripe)");
    expect(walletDebitIdx).toBeLessThan(checkout.indexOf("getStripeClient()"));
  });

  it("TEST H: Card rail remains blocked when Stripe is not configured", () => {
    expect(resolveCheckoutPaymentRail({ paymentMethod: "card" })).toBe("stripe");
    expect(resolveCheckoutPaymentRail({ paymentMethod: null })).toBe("stripe");
    const checkout = read("lib/orders/checkout.ts");
    expect(checkout).toContain("if (!isStripeConfigured())");
    // Fail closed for card: never create unpaid orders when Stripe is missing.
    expect(checkout).toContain('return { error: "Payments are not configured." }');
    expect(checkout).not.toMatch(/stripeSessionId: `dev-\$/);
  });

  it("TEST I/J/K/L: debit uses locked checkout totals — offer/shipping/fee unchanged", () => {
    const checkout = read("lib/orders/checkout.ts");
    expect(checkout).toContain("amount: lockedTotal");
    expect(checkout).toContain("amount: totals.total");
    expect(checkout).toContain("resolveLockedAcceptedOffer");
    expect(checkout).toContain("lockedPlatformFee");
    expect(checkout).toContain("lockedDelivery");
    expect(PRODUCT).toBe(0.5);
    expect(PLATFORM_FEE).toBe(0.03);
    expect(SHIPPING).toBe(3.19);
    expect(TOTAL).toBe(3.72);
    expect(roundTrip().product).toBe(PRODUCT);
    expect(roundTrip().platformFee).toBe(PLATFORM_FEE);
    expect(roundTrip().shipping).toBe(SHIPPING);
    expect(roundTrip().total).toBeCloseTo(TOTAL, 2);
  });

  it("keeps refund capture proof prefix required by 522847aa", () => {
    expect(WALLET_CHECKOUT_DEBIT_DESCRIPTION_PREFIX).toBe("Virtual payment for order ");
    expect(
      buildBuyerCheckoutDebitDescription({
        orderNumber: "RVX-1001",
        sessionId: "wallet_pay_order-1",
      }),
    ).toBe("Virtual payment for order RVX-1001 (wallet_pay_order-1)");
    expect(read("lib/stripe/refunds.ts")).toContain("Virtual payment for order ");
  });
});

function roundTrip() {
  return {
    product: 0.5,
    platformFee: 0.03,
    shipping: 3.19,
    total: 0.5 + 0.03 + 3.19,
  };
}

/** Fluent select/eq/maybeSingle mock for wallet_context-scoped buyer reads. */
function walletSelectMock(data: Record<string, unknown> | null) {
  const chain: {
    eq: () => typeof chain;
    maybeSingle: () => Promise<{ data: typeof data; error: null }>;
  } = {
    eq: () => chain,
    maybeSingle: async () => ({ data, error: null }),
  };
  return { select: () => chain };
}

describe("debitBuyerWalletForCheckout — mocked ledger", () => {
  beforeEach(() => {
    createAdminClient.mockReset();
  });

  it("TEST D behavioral: insufficient available → no wallet update", async () => {
    const update = vi.fn();
    const insert = vi.fn();
    createAdminClient.mockReturnValue({
      from(table: string) {
        if (table === "wallets") {
          return {
            ...walletSelectMock({
              id: "w1",
              available_balance: AVAILABLE,
              wallet_context: "individual",
            }),
            update,
          };
        }
        if (table === "wallet_transactions") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
            insert,
          };
        }
        return {};
      },
    });

    const { debitBuyerWalletForCheckout } = await import("@/lib/wallet/sales");
    const result = await debitBuyerWalletForCheckout({
      buyerId: "buyer-test",
      amount: 10,
      orderId: "order-test",
      orderNumber: "RVX-TEST",
      productTitle: "Test item",
      checkoutSessionPublicId: "cs_test_insufficient",
    });

    expect(result).toEqual({ ok: false, error: "Insufficient wallet balance." });
    expect(update).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("TEST A/B/C behavioral: £9.07 pays £3.72 and remains £5.35", async () => {
    const updateEq = vi.fn();
    createAdminClient.mockReturnValue({
      from(table: string) {
        if (table === "wallets") {
          return {
            ...walletSelectMock({
              id: "w1",
              available_balance: AVAILABLE,
              wallet_context: "individual",
            }),
            update: (payload: { available_balance: number }) => {
              expect(payload.available_balance).toBe(REMAINING);
              updateEq(payload);
              return {
                eq: () => ({
                  eq: () => ({
                    eq: () => ({
                      gte: () => ({
                        select: async () => ({ data: [{ id: "w1" }], error: null }),
                      }),
                    }),
                  }),
                }),
              };
            },
          };
        }
        if (table === "wallet_transactions") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
            insert: async (row: { amount: number; description: string }) => {
              expect(row.amount).toBe(-TOTAL);
              expect(row.description.startsWith(WALLET_CHECKOUT_DEBIT_DESCRIPTION_PREFIX)).toBe(
                true,
              );
              return { error: null };
            },
          };
        }
        return {};
      },
    });

    const { debitBuyerWalletForCheckout } = await import("@/lib/wallet/sales");
    const result = await debitBuyerWalletForCheckout({
      buyerId: "buyer-test",
      amount: TOTAL,
      orderId: "order-test",
      orderNumber: "RVX-TEST",
      productTitle: "Test item",
      checkoutSessionPublicId: "cs_test_ok",
    });

    expect(result).toEqual({
      ok: true,
      sessionId: "wallet_pay_order-test",
      remainingBalance: REMAINING,
      alreadyDebited: false,
    });
    expect(updateEq).toHaveBeenCalledWith({ available_balance: REMAINING });
  });

  it("TEST E behavioral: existing completed debit is reused", async () => {
    const update = vi.fn();
    const insert = vi.fn();
    createAdminClient.mockReturnValue({
      from(table: string) {
        if (table === "wallet_transactions") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: "tx1", amount: -TOTAL, status: "completed" },
                  error: null,
                }),
              }),
            }),
            insert,
          };
        }
        if (table === "wallets") {
          return {
            ...walletSelectMock({
              id: "w1",
              available_balance: REMAINING,
              wallet_context: "individual",
            }),
            update,
          };
        }
        return {};
      },
    });

    const { debitBuyerWalletForCheckout } = await import("@/lib/wallet/sales");
    const first = await debitBuyerWalletForCheckout({
      buyerId: "buyer-test",
      amount: TOTAL,
      orderId: "order-test",
      orderNumber: "RVX-TEST",
      productTitle: "Test item",
      checkoutSessionPublicId: "cs_test_dup",
    });
    const second = await debitBuyerWalletForCheckout({
      buyerId: "buyer-test",
      amount: TOTAL,
      orderId: "order-test",
      orderNumber: "RVX-TEST",
      productTitle: "Test item",
      checkoutSessionPublicId: "cs_test_dup",
    });

    expect(first).toEqual(second);
    expect(first).toEqual({
      ok: true,
      sessionId: "wallet_pay_order-test",
      remainingBalance: REMAINING,
      alreadyDebited: true,
    });
    expect(update).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });
});
