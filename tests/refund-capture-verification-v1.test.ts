import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const applyOrderRefundLifecycle = vi.fn();
const isStripeConfigured = vi.fn();
const getStripeClient = vi.fn();
const mustUseVirtualPayments = vi.fn();
const createAdminClient = vi.fn();

vi.mock("@/lib/orders/refund-lifecycle.server", () => ({
  applyOrderRefundLifecycle,
}));

vi.mock("@/lib/stripe/server", () => ({
  isStripeConfigured,
  getStripeClient,
}));

vi.mock("@/lib/full-demo/security", () => ({
  mustUseVirtualPayments,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient,
}));

type OrderRow = {
  id: string;
  order_number: string;
  stripe_payment_intent_id: string | null;
  stripe_refund_id: string | null;
  refunded_amount?: number | null;
  total: number;
  buyer_id: string;
  seller_id: string;
  refund_completed_at?: string | null;
};

function liveOrder(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: "order-1",
    order_number: "RVX-1001",
    stripe_payment_intent_id: "pi_live_abc",
    stripe_refund_id: null,
    refunded_amount: null,
    total: 10,
    buyer_id: "buyer-1",
    seller_id: "seller-1",
    refund_completed_at: "2026-08-19T00:00:00Z",
    ...overrides,
  };
}

function virtualDebitRow(amount = -10) {
  return {
    amount,
    type: "fee",
    description: "Virtual payment for order RVX-1001 (demo_pay_order-1)",
    order_number: "RVX-1001",
  };
}

function mockAdmin(input: {
  order: OrderRow | null;
  virtualDebits?: Array<Record<string, unknown>>;
  virtualDebitError?: { message: string };
}) {
  createAdminClient.mockReturnValue({
    from(table: string) {
      if (table === "wallet_transactions") {
        const result = input.virtualDebitError
          ? { data: null, error: input.virtualDebitError }
          : { data: input.virtualDebits ?? [], error: null };
        const builder = {
          select: () => builder,
          eq: () => builder,
          then: (resolve: (value: typeof result) => unknown) => resolve(result),
        };
        return builder;
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: input.order, error: null }),
          }),
        }),
      };
    },
  });
}

function mockLiveCapture(amountCapturedPence: number) {
  getStripeClient.mockReturnValue({
    paymentIntents: {
      retrieve: vi.fn().mockResolvedValue({
        id: "pi_live_abc",
        latest_charge: {
          id: "ch_1",
          amount_captured: amountCapturedPence,
        },
      }),
    },
    charges: {
      retrieve: vi.fn(),
    },
  });
}

describe("refund capture verification v1", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isStripeConfigured.mockReturnValue(true);
    mustUseVirtualPayments.mockReturnValue(false);
    applyOrderRefundLifecycle.mockResolvedValue("completed");
  });

  it("TEST 1: live Stripe captured £0 → no refund / no wallet credit", async () => {
    mockAdmin({ order: liveOrder() });
    mockLiveCapture(0);
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(result).toEqual({ error: "No captured payment to refund." });
    expect(applyOrderRefundLifecycle).not.toHaveBeenCalled();
  });

  it("TEST 2: live Stripe total £10 captured £6 → refund £6", async () => {
    mockAdmin({ order: liveOrder({ total: 10 }) });
    mockLiveCapture(600);
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(result).toMatchObject({ refundId: "wallet-refund-order-1", refundedAmount: 6 });
    expect(applyOrderRefundLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "order-1", amount: 6, refundId: "wallet-refund-order-1" }),
    );
  });

  it("TEST 3: live Stripe total £10 captured £10 → refund £10", async () => {
    mockAdmin({ order: liveOrder({ total: 10 }) });
    mockLiveCapture(1000);
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(result).toMatchObject({ refundId: "wallet-refund-order-1", refundedAmount: 10 });
    expect(applyOrderRefundLifecycle).toHaveBeenCalledWith(expect.objectContaining({ amount: 10 }));
  });

  it("TEST 4: live Stripe total £10 captured £15 → refund £10", async () => {
    mockAdmin({ order: liveOrder({ total: 10 }) });
    mockLiveCapture(1500);
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(result).toMatchObject({ refundedAmount: 10 });
    expect(applyOrderRefundLifecycle).toHaveBeenCalledWith(expect.objectContaining({ amount: 10 }));
  });

  it("TEST 5: PaymentIntent exists but captured £0 → no refund", async () => {
    mockAdmin({ order: liveOrder({ stripe_payment_intent_id: "pi_exists_uncaptured" }) });
    mockLiveCapture(0);
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(result).toEqual({ error: "No captured payment to refund." });
    expect(applyOrderRefundLifecycle).not.toHaveBeenCalled();
  });

  it("TEST 6: paid_at is not payment proof when captured £0", async () => {
    mockAdmin({ order: liveOrder() });
    mockLiveCapture(0);
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(result).toEqual({ error: "No captured payment to refund." });
    expect(applyOrderRefundLifecycle).not.toHaveBeenCalled();
    const source = readFileSync(join(process.cwd(), "lib/stripe/refunds.ts"), "utf8");
    expect(source).not.toMatch(/select\("[^"]*paid_at/);
    expect(source).not.toMatch(/order\.paid_at|context\.paidAt/);
  });

  it("TEST 7: Stripe capture lookup fails → no refund / no wallet credit", async () => {
    mockAdmin({ order: liveOrder() });
    getStripeClient.mockReturnValue({
      paymentIntents: {
        retrieve: vi.fn().mockRejectedValue(new Error("network")),
      },
      charges: { retrieve: vi.fn() },
    });
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(result).toEqual({ error: "Unable to verify captured payment." });
    expect(applyOrderRefundLifecycle).not.toHaveBeenCalled();
  });

  it("TEST 8: virtual payment with successful debit preserves virtual refund", async () => {
    isStripeConfigured.mockReturnValue(false);
    mockAdmin({
      order: liveOrder({
        stripe_payment_intent_id: "pi_virtual_abc",
        total: 10,
      }),
      virtualDebits: [virtualDebitRow(-10)],
    });
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(getStripeClient).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      refundId: "virtual-refund-order-1",
      refundedAmount: 10,
      skipped: true,
    });
    expect(applyOrderRefundLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        refundId: "virtual-refund-order-1",
        amount: 10,
      }),
    );
  });

  it("TEST 9: virtual payment with no debit → no refund / no wallet credit", async () => {
    isStripeConfigured.mockReturnValue(false);
    mockAdmin({
      order: liveOrder({ stripe_payment_intent_id: "pi_virtual_abc" }),
      virtualDebits: [],
    });
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(getStripeClient).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "No captured payment to refund." });
    expect(applyOrderRefundLifecycle).not.toHaveBeenCalled();
  });

  it("TEST 10: existing stripe_refund_id + valid refunded_amount is preserved", async () => {
    mockAdmin({
      order: liveOrder({ stripe_refund_id: "wallet-refund-order-1", refunded_amount: 6, total: 10 }),
    });
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(result).toEqual({
      refundId: "wallet-refund-order-1",
      refundedAmount: 6,
      refundedAt: undefined,
    });
    expect(result).not.toMatchObject({ refundedAmount: 10 });
    expect(applyOrderRefundLifecycle).not.toHaveBeenCalled();
    expect(getStripeClient).not.toHaveBeenCalled();
  });

  it("CASE 2: existing stripe_refund_id + refunded_amount null fails closed", async () => {
    mockAdmin({
      order: liveOrder({ stripe_refund_id: "wallet-refund-order-1", refunded_amount: null, total: 10 }),
    });
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(result).toEqual({ error: "Unable to verify captured payment." });
    expect(result).not.toMatchObject({ refundedAmount: 10 });
    expect(applyOrderRefundLifecycle).not.toHaveBeenCalled();
    expect(getStripeClient).not.toHaveBeenCalled();
  });

  it("CASE 3: existing stripe_refund_id + refunded_amount undefined fails closed", async () => {
    mockAdmin({
      order: liveOrder({ stripe_refund_id: "wallet-refund-order-1", refunded_amount: undefined, total: 10 }),
    });
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(result).toEqual({ error: "Unable to verify captured payment." });
    expect(result).not.toMatchObject({ refundedAmount: 10 });
    expect(applyOrderRefundLifecycle).not.toHaveBeenCalled();
  });

  it("CASE 4: existing stripe_refund_id + refunded_amount NaN fails closed", async () => {
    mockAdmin({
      order: liveOrder({ stripe_refund_id: "wallet-refund-order-1", refunded_amount: Number.NaN, total: 10 }),
    });
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(result).toEqual({ error: "Unable to verify captured payment." });
    expect(result).not.toMatchObject({ refundedAmount: 10 });
    expect(applyOrderRefundLifecycle).not.toHaveBeenCalled();
  });

  it("CASE 5: existing stripe_refund_id + refunded_amount 0 fails closed", async () => {
    mockAdmin({
      order: liveOrder({ stripe_refund_id: "wallet-refund-order-1", refunded_amount: 0, total: 10 }),
    });
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(result).toEqual({ error: "Unable to verify captured payment." });
    expect(result).not.toMatchObject({ refundedAmount: 10 });
    expect(applyOrderRefundLifecycle).not.toHaveBeenCalled();
  });

  it("CASE 6/7: existing stripe_refund_id + positive amount is exact and does not re-credit", async () => {
    mockAdmin({
      order: liveOrder({ stripe_refund_id: "wallet-refund-order-1", refunded_amount: 2.95, total: 10 }),
    });
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(result).toEqual({
      refundId: "wallet-refund-order-1",
      refundedAmount: 2.95,
      refundedAt: undefined,
    });
    expect(applyOrderRefundLifecycle).not.toHaveBeenCalled();
    expect(getStripeClient).not.toHaveBeenCalled();
    const refunds = readFileSync(join(process.cwd(), "lib/stripe/refunds.ts"), "utf8");
    expect(refunds).not.toMatch(/alreadyRefunded\) \? alreadyRefunded : Number\(order\.total\)/);
    expect(refunds).not.toMatch(/refundedAmount: Number\(order\.total\)/);
  });

  it("TEST 11: wallet-credit path still uses existing lifecycle + wallet-refund id", async () => {
    mockAdmin({ order: liveOrder({ total: 10 }) });
    mockLiveCapture(1000);
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    await createOrderStripeRefund("order-1");
    expect(applyOrderRefundLifecycle).toHaveBeenCalledTimes(1);
    expect(applyOrderRefundLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        refundId: "wallet-refund-order-1",
        paymentMethod: "ROVEXO Wallet",
      }),
    );
    const sales = readFileSync(join(process.cwd(), "lib/wallet/sales.ts"), "utf8");
    expect(sales).toContain("buildBuyerRefundIdempotencyKey");
    expect(sales).toContain('type: "refund"');
  });

  it("TEST 12: cancel callers stay on createOrderStripeRefund and allow £0 cancel", () => {
    const cancel = readFileSync(join(process.cwd(), "lib/orders/cancel-order.server.ts"), "utf8");
    expect(cancel).toContain("export async function cancelBuyerOrder");
    expect(cancel).toContain("export async function cancelSellerOrder");
    expect(cancel).toContain("createOrderStripeRefund");
    expect(cancel).toContain("isZeroCaptureRefundError");
    expect(cancel).toContain("refundCapturedPaymentOrZero");
    expect(cancel).toContain("context.paidAt || context.stripePaymentIntentId");
  });

  it("retrieves Charge.amount_captured when latest_charge is an id", async () => {
    mockAdmin({ order: liveOrder({ total: 10 }) });
    getStripeClient.mockReturnValue({
      paymentIntents: {
        retrieve: vi.fn().mockResolvedValue({
          id: "pi_live_abc",
          latest_charge: "ch_detached",
        }),
      },
      charges: {
        retrieve: vi.fn().mockResolvedValue({ id: "ch_detached", amount_captured: 600 }),
      },
    });
    const { createOrderStripeRefund } = await import("@/lib/stripe/refunds");
    const result = await createOrderStripeRefund("order-1");
    expect(result).toMatchObject({ refundedAmount: 6 });
  });

  it("never creates a Stripe card refund", () => {
    const refunds = readFileSync(join(process.cwd(), "lib/stripe/refunds.ts"), "utf8");
    expect(refunds).toContain("getStripeClient");
    expect(refunds).toContain("amount_captured");
    expect(refunds).not.toContain("stripe.refunds.create");
    expect(refunds).not.toContain("paymentIntents.create");
  });
});
