/**
 * Phase 1E — Business Withdraw route + context isolation.
 * Same canonical engine as Individual; no duplicate withdraw logic.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  connectAccountColumn,
  MIN_WITHDRAW_GBP,
  walletContextMatchesSellerContext,
} from "@/lib/seller-context/seller-context-v1";
import {
  WALLET_ROUTES,
  walletHubRouteForSellerContext,
  withdrawRouteForSellerContext,
} from "@/lib/wallet/canonical-routes";
import { buildWithdrawIdempotencyKey, canDebitAvailable } from "@/lib/wallet/security";
import { buildWithdrawPageView, createEmptyWalletData } from "@/lib/wallet/withdraw-page-v7";

function src(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Phase 1E — routes", () => {
  it("Individual withdraw route", () => {
    expect(withdrawRouteForSellerContext("individual")).toBe("/wallet/withdraw");
    expect(WALLET_ROUTES.withdraw).toBe("/wallet/withdraw");
  });

  it("Business withdraw route", () => {
    expect(withdrawRouteForSellerContext("business")).toBe("/business/wallet/withdraw");
    expect(WALLET_ROUTES.businessWithdraw).toBe("/business/wallet/withdraw");
    expect(src("app/(platform)/business/wallet/withdraw/page.tsx")).toContain(
      'sellerContext="business"',
    );
    expect(src("app/(platform)/business/wallet/withdraw/page.tsx")).toContain(
      'fetchWalletData("business")',
    );
  });

  it("Individual route remains individual-only", () => {
    expect(src("app/(platform)/wallet/withdraw/page.tsx")).toContain(
      'sellerContext="individual"',
    );
  });
});

describe("Phase 1E — Connect account selection", () => {
  it("Individual → Individual Stripe Connect column", () => {
    expect(connectAccountColumn("individual")).toBe(
      "stripe_connect_account_id_individual",
    );
  });

  it("Business → Business Stripe Connect column", () => {
    expect(connectAccountColumn("business")).toBe("stripe_connect_account_id_business");
  });

  it("rail + store pass sellerContext (one engine)", () => {
    expect(src("lib/stripe/withdraw-payout.ts")).toContain("sellerContext: SellerContext");
    expect(src("lib/wallet/store.ts")).toContain("walletContextMatchesSellerContext");
    expect(src("lib/wallet/store.ts")).toContain("initiateWithdrawalPayout({");
  });
});

describe("Phase 1E — context isolation", () => {
  it("Individual cannot debit Business wallet context", () => {
    expect(walletContextMatchesSellerContext("business", "individual")).toBe(false);
  });

  it("Business cannot debit Individual wallet context", () => {
    expect(walletContextMatchesSellerContext("individual", "business")).toBe(false);
    expect(walletContextMatchesSellerContext(null, "business")).toBe(false);
  });

  it("Business matches only business; Individual allows legacy null", () => {
    expect(walletContextMatchesSellerContext("business", "business")).toBe(true);
    expect(walletContextMatchesSellerContext("individual", "individual")).toBe(true);
    expect(walletContextMatchesSellerContext(null, "individual")).toBe(true);
  });

  it("store rejects mismatched wallet_context before debit", () => {
    const store = src("lib/wallet/store.ts");
    expect(store).toContain("walletContextMatchesSellerContext");
    expect(store).toContain('eq("wallet_context", sellerContext)');
    expect(store).toContain("never accept a business row as individual fallback");
  });
});

describe("Phase 1E — hub wiring + page view", () => {
  it("Business hub links to business withdraw", () => {
    expect(src("features/wallet/components/WalletHubV1.tsx")).toContain(
      "withdrawRouteForSellerContext",
    );
    expect(src("features/wallet/components/WalletHubV1.tsx")).toContain("withdrawHref");
  });

  it("Withdraw page view uses context-specific hub/back", () => {
    const empty = createEmptyWalletData();
    empty.availableBalance = 10;
    empty.withdrawMethods = [
      { id: "m1", provider: "bank_account", label: "Bank", lastDigits: "1234", connected: true },
    ];
    const biz = buildWithdrawPageView(empty, { sellerContext: "business" });
    expect(biz.walletHref).toBe(walletHubRouteForSellerContext("business"));
    expect(biz.bankHref).toContain(encodeURIComponent(WALLET_ROUTES.businessWithdraw));
    expect(biz.bankHref).toContain("sellerContext=business");

    const ind = buildWithdrawPageView(empty, { sellerContext: "individual" });
    expect(ind.walletHref).toBe(WALLET_ROUTES.hub);
    expect(ind.bankHref).toContain(encodeURIComponent(WALLET_ROUTES.withdraw));
    expect(ind.bankHref).not.toContain("sellerContext=business");
  });
});

describe("Phase 1E — amount + idempotency (preserve 1D)", () => {
  it("£0.01 minimum", () => {
    expect(MIN_WITHDRAW_GBP).toBe(0.01);
    expect(canDebitAvailable(0.01, 0.01)).toBe(true);
    expect(canDebitAvailable(0, 0.01)).toBe(false);
  });

  it("duplicate / retry same intent → same key", () => {
    const key = buildWithdrawIdempotencyKey({
      userId: "u",
      methodId: "m",
      amount: 10,
      clientKey: "intent-1",
    });
    expect(
      buildWithdrawIdempotencyKey({
        userId: "u",
        methodId: "m",
        amount: 10,
        clientKey: "intent-1",
      }),
    ).toBe(key);
  });

  it("two legitimate equal withdrawals → different keys", () => {
    const a = buildWithdrawIdempotencyKey({
      userId: "u",
      methodId: "m",
      amount: 10,
      clientKey: "intent-a",
    });
    const b = buildWithdrawIdempotencyKey({
      userId: "u",
      methodId: "m",
      amount: 10,
      clientKey: "intent-b",
    });
    expect(a).not.toBe(b);
  });
});
