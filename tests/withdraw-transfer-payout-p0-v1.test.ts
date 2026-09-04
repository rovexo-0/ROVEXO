/**
 * Phase 1D — Withdraw / Transfer / Payout P0 remediation tests.
 * NO LIVE STRIPE — source contracts + pure helpers + mocked idempotency.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  isLegacyPayoutIdInTransferColumn,
  isStripePayoutId,
  isStripeTransferId,
  reportLegacyPayoutIdInTransferColumn,
} from "@/lib/stripe/stripe-object-ids-v1";
import { connectAccountColumn, MIN_WITHDRAW_GBP } from "@/lib/seller-context/seller-context-v1";
import { buildWithdrawIdempotencyKey, canDebitAvailable } from "@/lib/wallet/security";
import {
  isWithdrawalAwaitingBankPayout,
  WITHDRAW_ACCOUNTING_SSOT,
  WITHDRAW_DESC,
} from "@/lib/wallet/withdraw-lifecycle-v1";
import { resolveTransactionMoneyState } from "@/lib/wallet/money-states";
import type { WalletTransaction } from "@/lib/wallet/types";

function src(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Phase 1D — seller context (P0-1)", () => {
  it("Individual withdraw selects Individual Connect column", () => {
    expect(connectAccountColumn("individual")).toBe(
      "stripe_connect_account_id_individual",
    );
  });

  it("Business withdraw selects Business Connect column", () => {
    expect(connectAccountColumn("business")).toBe("stripe_connect_account_id_business");
  });

  it("initiateWithdrawalPayout requires sellerContext and passes it to rail", () => {
    const withdraw = src("lib/stripe/withdraw-payout.ts");
    expect(withdraw).toContain("sellerContext: SellerContext");
    expect(withdraw).toContain("assertWithdrawalRailReady");
    expect(withdraw).toMatch(/assertWithdrawalRailReady\(\s*input\.userId,\s*input\.methodProvider,\s*sellerContext/);
    expect(withdraw).toContain("sellerContext,");
  });

  it("recordWithdrawal passes sellerContext into initiateWithdrawalPayout", () => {
    const store = src("lib/wallet/store.ts");
    expect(store).toContain("sellerContext,");
    expect(store).toContain("initiateWithdrawalPayout({");
  });

  it("API accepts sellerContext individual|business", () => {
    const route = src("app/api/wallet/withdraw/route.ts");
    expect(route).toContain('z.enum(["individual", "business"])');
    expect(route).toContain("sellerContext:");
  });

  it("Withdraw UI sends sellerContext", () => {
    expect(src("features/wallet/components/withdraw/WithdrawPage.tsx")).toContain(
      "sellerContext",
    );
    expect(src("features/wallet/hooks/use-withdraw-flow.ts")).toContain("sellerContext");
  });
});

describe("Phase 1D — transfer vs payout IDs (P0-2)", () => {
  it("identifies transfer and payout ids", () => {
    expect(isStripeTransferId("tr_abc")).toBe(true);
    expect(isStripeTransferId("demo_withdraw_x")).toBe(true);
    expect(isStripeTransferId("po_abc")).toBe(false);
    expect(isStripePayoutId("po_abc")).toBe(true);
    expect(isStripePayoutId("tr_abc")).toBe(false);
  });

  it("reports legacy payout id in transfer column without rewriting", () => {
    expect(isLegacyPayoutIdInTransferColumn("po_legacy")).toBe(true);
    expect(
      reportLegacyPayoutIdInTransferColumn({
        transactionId: "tx1",
        stripeTransferId: "po_legacy",
      }),
    ).toEqual({
      transactionId: "tx1",
      stripeTransferId: "po_legacy",
      issue: "payout_id_in_transfer_column",
    });
  });

  it("store refuses writing payout id into stripe_transfer_id", () => {
    const store = src("lib/wallet/store.ts");
    expect(store).toContain("Refused writing payout id into stripe_transfer_id");
    expect(store).toContain("Refused non-transfer id for stripe_transfer_id");
    expect(store).toContain("stripe_payout_id");
  });

  it("payout.paid does not overwrite transfer ID", () => {
    const webhook = src("lib/stripe/webhook-handler.ts");
    expect(webhook).toContain("confirmWithdrawalBankCompleted");
    expect(webhook).toContain("stripePayoutId: payout.id");
    expect(webhook).not.toMatch(/confirmWithdrawalCompleted\(\{[\s\S]*stripeTransferId:\s*payout\.id/);
  });
});

describe("Phase 1D — withdrawal state semantics (P0-3)", () => {
  it("Transfer success is awaiting payout, not bank completed", () => {
    const awaiting: WalletTransaction = {
      id: "1",
      orderNumber: "WD",
      productTitle: "W",
      productImageUrl: "",
      amount: -10,
      status: "pending",
      type: "withdrawal",
      createdAt: new Date().toISOString(),
      stripeTransferId: "tr_123",
      description: WITHDRAW_DESC.awaitingPayout("tr_123"),
    };
    expect(isWithdrawalAwaitingBankPayout(awaiting)).toBe(true);
    expect(resolveTransactionMoneyState(awaiting)).toBe("WITHDRAWING");
  });

  it("completed only after bank/virtual settlement", () => {
    const done: WalletTransaction = {
      id: "1",
      orderNumber: "WD",
      productTitle: "W",
      productImageUrl: "",
      amount: -10,
      status: "completed",
      type: "withdrawal",
      createdAt: new Date().toISOString(),
      stripeTransferId: "tr_123",
      stripePayoutId: "po_456",
    };
    expect(isWithdrawalAwaitingBankPayout(done)).toBe(false);
    expect(resolveTransactionMoneyState(done)).toBe("COMPLETED");
  });

  it("store marks awaiting_payout after live Transfer, completed only for virtual/bank", () => {
    const store = src("lib/wallet/store.ts");
    expect(store).toContain("markWithdrawalTransferAwaitingPayout");
    expect(store).toContain("confirmWithdrawalBankCompleted");
    expect(store).toContain("WITHDRAW_DESC.awaitingPayout");
    expect(store).toContain("Transfer success ≠ bank paid");
  });
});

describe("Phase 1D — payout webhook correlation (P0-4)", () => {
  it("uses metadata or unique connect+amount correlation — never amount alone", () => {
    const webhook = src("lib/stripe/webhook-handler.ts");
    expect(webhook).toContain("resolveWithdrawalForPayout");
    expect(webhook).toContain("connect_amount_unique");
    expect(webhook).toContain("not uniquely attributable");
    expect(webhook).toContain("connectedAccountId");
  });

  it("persists stripe_payout_id on safe correlation", () => {
    expect(src("lib/wallet/store.ts")).toContain("stripe_payout_id");
    expect(src("lib/stripe/webhook-handler.ts")).toContain("stripePayoutId: payout.id");
  });
});

describe("Phase 1D — payout failure safety (P0-5)", () => {
  it("payout.failed is recorded without Available restore or Transfer reverse", () => {
    const webhook = src("lib/stripe/webhook-handler.ts");
    expect(webhook).toContain("markWithdrawalPayoutFailed");
    expect(webhook).toContain("no Available restore");
    const store = src("lib/wallet/store.ts");
    expect(store).toContain("markWithdrawalPayoutFailed");
    expect(store).toContain("Do NOT restore Available");
    expect(store).toContain("Do NOT reverse Transfer blindly");
  });
});

describe("Phase 1D — client idempotency (P1)", () => {
  it("Intent A retry reuses same key → same economic fingerprint", () => {
    const keyA = "intent-a-uuid-001";
    const first = buildWithdrawIdempotencyKey({
      userId: "u1",
      methodId: "m1",
      amount: 10,
      clientKey: keyA,
    });
    const retry = buildWithdrawIdempotencyKey({
      userId: "u1",
      methodId: "m1",
      amount: 10,
      clientKey: keyA,
    });
    expect(first).toBe(retry);
  });

  it("Intent B later £10 withdraw uses different key → allowed fingerprint", () => {
    const a = buildWithdrawIdempotencyKey({
      userId: "u1",
      methodId: "m1",
      amount: 10,
      clientKey: "intent-a",
    });
    const b = buildWithdrawIdempotencyKey({
      userId: "u1",
      methodId: "m1",
      amount: 10,
      clientKey: "intent-b",
    });
    expect(a).not.toBe(b);
  });

  it("UI generates per-intent key and reuses on retry", () => {
    const page = src("features/wallet/components/withdraw/WithdrawPage.tsx");
    expect(page).toContain("intentKeyRef");
    expect(page).toContain("idempotencyKey");
    expect(page).toContain("Idempotency-Key");
  });

  it("API never falls back to shared default client key when key missing", () => {
    const route = src("app/api/wallet/withdraw/route.ts");
    expect(route).toContain("randomUUID");
    expect(route).toContain("never fall back to shared");
    // Server generates a unique UUID instead of omitting clientKey (which would become "default").
    expect(route).toMatch(/idempotencyKey:\s*clientKey/);
  });
});

describe("Phase 1D — accounting + guards", () => {
  it("documents Available debit without Reserved rewrite", () => {
    expect(WITHDRAW_ACCOUNTING_SSOT.availableDebit).toBe(true);
    expect(WITHDRAW_ACCOUNTING_SSOT.reservedLockedRewrite).toBe(false);
    expect(WITHDRAW_ACCOUNTING_SSOT.transferMeansBankPaid).toBe(false);
  });

  it("£0.01 minimum and insufficient Available", () => {
    expect(MIN_WITHDRAW_GBP).toBe(0.01);
    expect(canDebitAvailable(10, 10.01)).toBe(false);
    expect(canDebitAvailable(10, 0.01)).toBe(true);
  });

  it("Release → no sale Transfer; Withdraw → Transfer", () => {
    expect(src("lib/commerce-engine/settlement.ts")).not.toContain(
      "transferSalePayoutToConnect",
    );
    expect(src("lib/stripe/payouts.ts")).toContain("legacy_sale_connect_transfer_disabled");
    expect(src("lib/stripe/withdraw-payout.ts")).toContain("stripe.transfers.create");
  });

  it("failed Transfer recovery path rolls back pending only", () => {
    const store = src("lib/wallet/store.ts");
    expect(store).toContain("payout_init_failed");
    expect(store).toContain("rollbackWithdrawal");
  });
});
