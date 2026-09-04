/**
 * BUSINESS WALLET SEPARATION V1
 * Server/database isolation — not UI filtering.
 * One Wallet engine. seller_context / wallet_context is authoritative.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  connectAccountColumn,
  normalizeSellerContext,
  walletContextMatchesSellerContext,
  walletLedgerSellerContextFilter,
  withdrawMethodSellerContextFilter,
} from "@/lib/seller-context/seller-context-v1";
import {
  WALLET_ROUTES,
  walletBankAccountsRouteForSellerContext,
  walletHubRouteForSellerContext,
  walletTransactionsRouteForSellerContext,
  withdrawRouteForSellerContext,
} from "@/lib/wallet/canonical-routes";

function src(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Business Wallet separation — context model", () => {
  it("1. Personal Wallet reads Individual data only", () => {
    expect(src("app/(platform)/wallet/page.tsx")).toContain('fetchWalletData("individual")');
    expect(src("app/(platform)/wallet/transactions/page.tsx")).toContain(
      'listWalletTransactions(profile.id, "individual")',
    );
  });

  it("2. Business Wallet reads Business data only", () => {
    expect(src("app/(platform)/business/wallet/page.tsx")).toContain('fetchWalletData("business")');
    expect(src("app/(platform)/business/wallet/transactions/page.tsx")).toContain(
      'listWalletTransactions(profile.id, "business")',
    );
    expect(src("app/(platform)/business/wallet/page.tsx")).toContain("getBusinessProfile");
  });

  it("3–5. Balance and transaction ledger filters never mix contexts", () => {
    expect(walletLedgerSellerContextFilter("business")).toEqual({
      mode: "eq",
      value: "business",
    });
    expect(walletLedgerSellerContextFilter("individual").mode).toBe("or");
    expect(src("lib/wallet/store.ts")).toContain("applySellerContextColumnFilter");
    expect(src("lib/wallet/store.ts")).toContain('eq("wallet_context", context)');
    expect(src("lib/wallet/store.ts")).toContain("listWalletTransactions");
    expect(src("lib/wallet/store.ts")).toMatch(
      /listWalletTransactions\([\s\S]*sellerContext: SellerContext = "individual"/,
    );
  });

  it("6–8. Withdrawal, withdraw_methods, and payout config are context-scoped", () => {
    const store = src("lib/wallet/store.ts");
    expect(store).toContain("getWithdrawMethodById(input.userId, input.methodId, sellerContext)");
    expect(store).toContain("getBankAccountForPayout(input.userId, sellerContext)");
    expect(store).toContain("seller_context: sellerContext");
    expect(withdrawMethodSellerContextFilter("business").value).toBe("business");
    expect(src("app/api/wallet/bank-account/route.ts")).toContain("sellerContextFromRequest");
    expect(src("lib/stripe/connect.ts")).toContain('.eq("seller_context", context)');
  });

  it("9–10. Stripe Individual vs Business Connect columns", () => {
    expect(connectAccountColumn("individual")).toBe("stripe_connect_account_id_individual");
    expect(connectAccountColumn("business")).toBe("stripe_connect_account_id_business");
    expect(src("lib/wallet/store.ts")).toContain("getConnectAccountStatus(userId, context)");
  });

  it("11–13. seller_context switch, refresh, logout/login persistence", () => {
    expect(src("lib/business/business-onboarding-v1.ts")).toContain(
      "active_seller_context",
    );
    expect(src("features/wallet/hooks/use-wallet-live.ts")).toContain(
      "fetchAccountSnapshotShared(sellerContext)",
    );
    expect(src("features/wallet/hooks/use-wallet-live.ts")).toContain(
      "payload.sellerContext !== sellerContext",
    );
  });

  it("14–16. Direct API, unauthorized, unverified Business", () => {
    expect(src("app/api/wallet/bank-account/route.ts")).toContain("requireApiAuth");
    expect(src("app/api/wallet/withdraw/route.ts")).toContain("requireApiAuth");
    expect(src("lib/profile/data.ts")).toContain("if (!status.stripe.verified)");
    expect(src("app/(platform)/business/wallet/page.tsx")).toContain("getBusinessProfile");
    expect(src("app/(platform)/business/wallet/transactions/page.tsx")).toContain(
      "getBusinessProfile",
    );
  });

  it("17–18. No Personal↔Business data leakage at the matcher", () => {
    expect(walletContextMatchesSellerContext("business", "individual")).toBe(false);
    expect(walletContextMatchesSellerContext("individual", "business")).toBe(false);
    expect(walletContextMatchesSellerContext(null, "business")).toBe(false);
    expect(walletContextMatchesSellerContext(null, "individual")).toBe(true);
    expect(normalizeSellerContext("business")).toBe("business");
    expect(normalizeSellerContext("role")).toBe("individual");
  });

  it("does not use profiles.role as the wallet selector", () => {
    const store = src("lib/wallet/store.ts");
    expect(store).not.toMatch(/profiles\.role/);
    expect(store).toContain("wallet_context");
    expect(store).toContain("seller_context");
  });
});

describe("Business Wallet separation — routes and engine reuse", () => {
  it("19. Existing Wallet hub remains one engine", () => {
    expect(walletHubRouteForSellerContext("individual")).toBe("/wallet");
    expect(walletHubRouteForSellerContext("business")).toBe("/business/wallet");
    expect(withdrawRouteForSellerContext("individual")).toBe(WALLET_ROUTES.withdraw);
    expect(withdrawRouteForSellerContext("business")).toBe(WALLET_ROUTES.businessWithdraw);
    expect(walletTransactionsRouteForSellerContext("business")).toBe(
      WALLET_ROUTES.businessTransactions,
    );
    expect(walletBankAccountsRouteForSellerContext("business")).toContain("sellerContext=business");
    expect(src("app/(platform)/business/wallet/page.tsx")).toContain("WalletPage");
    expect(src("app/(platform)/wallet/page.tsx")).toContain("WalletPage");
  });

  it("20. Business regression — verification gate + Connect body", () => {
    expect(src("features/wallet/components/WalletBankAccountsPage.tsx")).toContain(
      "openStripeConnectManagement",
    );
    expect(src("features/wallet/components/WalletBankAccountsPage.tsx")).toContain(
      'intent: "manage"',
    );
    expect(src("app/api/wallet/connect/route.ts")).toContain("normalizeSellerContext(body.context)");
    expect(src("app/api/wallet/connect/route.ts")).toContain("createConnectManageLink");
    expect(src("app/api/wallet/connect/route.ts")).toContain("requireApiAuth");
    expect(src("app/api/wallet/connect/route.ts")).not.toContain(
      'requireApiRole(["seller", "business", "admin"])',
    );
  });

  it("adds withdraw_methods.seller_context without a second ledger", () => {
    const migration = src(
      "supabase/migrations/20260903210000_withdraw_methods_seller_context_v1.sql",
    );
    expect(migration).toContain("add column if not exists seller_context text");
    expect(migration).toContain("check (seller_context in ('individual', 'business'))");
    expect(migration).toContain("withdraw_methods_user_stripe_connect_context_uidx");
    expect(migration).not.toMatch(/create table if not exists public\.wallets_/i);
  });
});
