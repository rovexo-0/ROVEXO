import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildBuyerRefundDescription,
  buildBuyerRefundIdempotencyKey,
  canDebitAvailable,
  isRovexoWalletRefundCreditEligible,
  isStripeCardRefundReference,
  ROVEXO_WALLET_REFUND_METHOD,
  roundWalletMoney,
} from "@/lib/wallet/security";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO refund → wallet credit eligibility", () => {
  it("treats Stripe card refund ids as ineligible (no double pay)", () => {
    expect(isStripeCardRefundReference("re_1Nxyz")).toBe(true);
    expect(
      isRovexoWalletRefundCreditEligible({
        refundId: "re_1Nxyz",
        paymentMethod: "Original payment method",
      }),
    ).toBe(false);
    expect(
      isRovexoWalletRefundCreditEligible({
        refundId: "re_1Nxyz",
        paymentMethod: ROVEXO_WALLET_REFUND_METHOD,
      }),
    ).toBe(false);
  });

  it("allows virtual and wallet-refund references", () => {
    expect(
      isRovexoWalletRefundCreditEligible({
        refundId: "virtual-refund-order-1",
        paymentMethod: ROVEXO_WALLET_REFUND_METHOD,
      }),
    ).toBe(true);
    expect(
      isRovexoWalletRefundCreditEligible({
        refundId: "wallet-refund-order-1",
        paymentMethod: ROVEXO_WALLET_REFUND_METHOD,
      }),
    ).toBe(true);
  });

  it("rejects original-card payment method even without re_ prefix", () => {
    expect(
      isRovexoWalletRefundCreditEligible({
        refundId: "wallet-refund-order-1",
        paymentMethod: "Original payment method",
      }),
    ).toBe(false);
  });

  it("builds stable buyer-refund idempotency keys", () => {
    expect(buildBuyerRefundIdempotencyKey("wallet-refund-abc")).toBe(
      "buyer-refund:wallet-refund-abc",
    );
    expect(buildBuyerRefundDescription("ord-1", "wallet-refund-ord-1")).toContain("ord-1");
    expect(buildBuyerRefundDescription("ord-1", "wallet-refund-ord-1")).toContain(
      "wallet-refund-ord-1",
    );
  });
});

describe("withdraw safety (existing rail)", () => {
  it("prevents negative and over-withdrawal", () => {
    expect(canDebitAvailable(10, 10.01)).toBe(false);
    expect(canDebitAvailable(0, 1)).toBe(false);
    expect(canDebitAvailable(10, -1)).toBe(false);
    expect(canDebitAvailable(10, 10)).toBe(true);
    expect(roundWalletMoney(10.005)).toBe(10.01);
  });
});

describe("canonical refund architecture (no second engine)", () => {
  it("credits buyer wallet only through Commerce Engine + existing ledger", () => {
    const commerce = readSource("lib/commerce-engine/index.ts");
    const sales = readSource("lib/wallet/sales.ts");
    const lifecycle = readSource("lib/orders/refund-lifecycle.server.ts");
    const refunds = readSource("lib/stripe/refunds.ts");

    expect(commerce).toContain("creditBuyerWallet");
    expect(commerce).toContain("creditBuyerWalletForConfirmedRefund");
    expect(sales).toContain("creditBuyerWalletForConfirmedRefund");
    expect(sales).toContain("buildBuyerRefundIdempotencyKey");
    expect(sales).toContain("isRovexoWalletRefundCreditEligible");
    expect(lifecycle).toContain("CommerceEngine.creditBuyerWallet");
    expect(lifecycle).not.toMatch(/creditBuyerWalletForConfirmedRefund\s*\(/);
    expect(refunds).toContain("ROVEXO_WALLET_REFUND_METHOD");
    expect(refunds).toContain("wallet-refund-");
    expect(refunds).toContain("getStripeClient");
    expect(refunds).toContain("amount_captured");
    expect(refunds).not.toContain("stripe.refunds.create");
  });

  it("keeps ITEM_JUST_SOLD as a Stripe card refund (not wallet credit)", () => {
    const webhook = readSource("lib/stripe/webhook-handler.ts");
    expect(webhook).toContain("stripe.refunds.create");
    expect(webhook).toContain("item-just-sold-refund-");
  });

  it("does not introduce a second wallet or ledger table", () => {
    const migration = readSource(
      "supabase/migrations/20260816220000_wallet_bank_account_refund_credit_v1.sql",
    );
    expect(migration).toContain("withdraw_methods_user_bank_account_uidx");
    expect(migration).not.toMatch(/create table if not exists public\.wallets_/i);
    expect(migration).not.toMatch(/create table if not exists public\.wallet_ledger/i);

    const contextMigration = readSource(
      "supabase/migrations/20260903210000_withdraw_methods_seller_context_v1.sql",
    );
    expect(contextMigration).toContain("withdraw_methods_user_bank_account_context_uidx");
    expect(contextMigration).toContain("drop index if exists public.withdraw_methods_user_bank_account_uidx");
  });
});
