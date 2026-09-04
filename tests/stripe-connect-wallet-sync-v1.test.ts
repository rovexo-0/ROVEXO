/**
 * Stripe Connect / Payments / Wallet Synchronization V1 — focused contract tests.
 * Source + invariant checks only (no LIVE money, no Production writes).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function src(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Stripe Connect / Wallet Synchronization V1", () => {
  it("1–3 Individual/Business Connect mapping + isolation columns", () => {
    const connect = src("lib/stripe/connect.ts");
    const ctx = src("lib/seller-context/seller-context-v1.ts");
    expect(ctx).toContain("stripe_connect_account_id_individual");
    expect(ctx).toContain("stripe_connect_account_id_business");
    expect(connect).toContain("connectAccountColumn(context)");
    expect(connect).toContain('context === "business"');
    expect(connect).toContain("stripe_connect_account_id_business");
    expect(connect).not.toMatch(/stripe_connect_account_id_business.*=.*individual/);
  });

  it("4 Stripe-hosted onboarding authority (no ROVEXO bank form on Bank Accounts)", () => {
    const page = src("features/wallet/components/WalletBankAccountsPage.tsx");
    expect(page).toContain("/api/wallet/connect");
    expect(page).toContain('openStripeConnectManagement("individual"');
    expect(page).toContain('openStripeConnectManagement("business"');
    expect(page).not.toContain("BankAccountForm");
    expect(page).not.toContain("sort_code");
    expect(page).not.toContain("account_number");
  });

  it("5 Stripe status sync upserts context-scoped stripe_connect withdraw method", () => {
    const connect = src("lib/stripe/connect.ts");
    expect(connect).toContain("syncConnectAccountFromStripe");
    expect(connect).toContain('eq("seller_context", context)');
    expect(connect).toContain('provider: "stripe_connect"');
    expect(connect).toContain(".insert({");
    expect(connect).toContain("stripe_connect_account_id_business === account.id");
  });

  it("6 Bank data not collected by Bank Accounts UI (legacy storage STOP/report only)", () => {
    const page = src("features/wallet/components/WalletBankAccountsPage.tsx");
    const form = src("features/wallet/components/BankAccountForm.tsx");
    expect(page).not.toContain("BankAccountForm");
    expect(form).toContain("sort"); // legacy module retained
    expect(src("app/api/wallet/bank-account/route.ts")).toContain("sellerContext");
  });

  it("7–11 Card checkout remains Stripe-owned (no second card engine)", () => {
    const payment = src("lib/checkout/payment.ts");
    expect(payment.length).toBeGreaterThan(50);
    const wizard = src("features/checkout/components/CheckoutWizardV1.tsx");
    expect(wizard).toContain('"card"');
    expect(wizard).toContain("rovexo_balance");
  });

  it("12–15 Buyer wallet checkout uses Personal wallet_context only", () => {
    const sales = src("lib/wallet/sales.ts");
    expect(sales).toContain("loadBuyerCheckoutWallet");
    expect(sales).toContain('eq("wallet_context", "individual")');
    expect(sales).toContain("readBuyerWalletCheckoutEligibility");
    expect(sales).toContain("debitBuyerWalletForCheckout");
    expect(sales).toContain('seller_context: "individual"');
    expect(sales).toContain("idempotency_key");
    expect(sales).toContain("Insufficient wallet balance");
  });

  it("16–19 Checkout UI gates insufficient Rovexo Balance (no invented split)", () => {
    const wizard = src("features/checkout/components/CheckoutWizardV1.tsx");
    expect(wizard).toContain("walletBalanceSufficient");
    expect(wizard).toContain("walletPaymentUnavailable");
    expect(wizard).toContain("Insufficient ·");
    expect(wizard).not.toMatch(/split.?payment/i);
    expect(wizard).not.toContain("partialDebit");
  });

  it("20–22 Wallet ledger + refund reverse path preserved", () => {
    const sales = src("lib/wallet/sales.ts");
    expect(sales).toContain("reverseBuyerWalletCheckoutDebit");
    expect(sales).toContain("wallet_transactions");
  });

  it("23–29 Context: Personal/Business wallet hubs + Connect return sync", () => {
    expect(src("app/(platform)/wallet/page.tsx")).toContain(
      'syncConnectAccountBySellerId(profile.id, "individual")',
    );
    expect(src("app/(platform)/business/wallet/page.tsx")).toContain(
      'syncConnectAccountBySellerId(profile.id, "business")',
    );
    expect(src("lib/wallet/withdraw-page-v7.ts")).toContain("sellerContext=business");
    expect(src("lib/verified/evaluate.ts")).toContain("hasBusinessConnect");
    expect(src("lib/verified/evaluate.ts")).toContain("hasIndividualConnect");
  });

  it("30–34 Security: no Production writes / no bank leakage in Connect UI", () => {
    const page = src("features/wallet/components/WalletBankAccountsPage.tsx");
    expect(page).not.toMatch(/localStorage|sessionStorage/);
    expect(page).not.toContain("IBAN");
    expect(page).not.toContain("accountNumber");
    expect(src("lib/stripe/connect.ts")).not.toContain("sort_code");
    expect(src("lib/stripe/connect.ts")).not.toContain("account_number");
  });
});
