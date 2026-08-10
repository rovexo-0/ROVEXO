/**
 * Platform fee pence SSOT + checkout shipping pending display.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  calculateOrderTotals,
  calculatePlatformFee,
  calculatePlatformFeePence,
  toPence,
} from "@/lib/orders/pricing";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("checkout money SSOT — platform fee pence", () => {
  it("£6.99 → fee £0.38 (5.5% rounded in pence)", () => {
    expect(toPence(6.99)).toBe(699);
    expect(calculatePlatformFeePence(699)).toBe(38);
    expect(calculatePlatformFee(6.99)).toBe(0.38);
  });

  it("order totals = item + fee + shipping in pence", () => {
    const totals = calculateOrderTotals(6.99, 2.5);
    expect(totals.platformFee).toBe(0.38);
    expect(totals.delivery).toBe(2.5);
    expect(totals.deliveryPending).toBe(false);
    expect(totals.total).toBe(9.87);
  });

  it("pending delivery does not claim Included in price summary", () => {
    const pending = calculateOrderTotals(6.99, null);
    expect(pending.deliveryPending).toBe(true);
    const summary = readSource("features/checkout/components/CheckoutPriceSummary.tsx");
    expect(summary).toContain("deliveryPending");
    expect(summary).toContain("Calculated at checkout");
  });

  it("seller-wallet fee reuses calculatePlatformFee (no duplicate formula)", () => {
    const wallet = readSource("lib/transaction-hub/seller-wallet.ts");
    expect(wallet).toContain("calculatePlatformFee");
    expect(wallet).not.toMatch(/itemPrice \* PLATFORM_FEE_RATE \* 100/);
  });

  it("pay path recreates Stripe session when shipping refined", () => {
    const checkout = readSource("lib/orders/checkout.ts");
    expect(checkout).toContain("shippingRefinedFromQuote");
    expect(checkout).toContain("amount_total");
    expect(checkout).toContain("sessions.expire");
  });
});
