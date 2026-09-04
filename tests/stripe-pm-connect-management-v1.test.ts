/**
 * Stripe Customer Payment Methods + Connect Management — contract tests.
 * No LIVE money · no Production writes · no sensitive bank/card leakage.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveConnectAccountIdForContext } from "@/lib/stripe/connect";
import { paymentSetupErrorMessage, PaymentSetupError } from "@/lib/payments/errors";

function src(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Stripe PM + Connect Management V1", () => {
  it("1 Individual Bank Accounts → Stripe manage intent", () => {
    const page = src("features/wallet/components/WalletBankAccountsPage.tsx");
    expect(page).toContain("Individual Account");
    expect(page).toContain("Receive money from your sales via Stripe");
    expect(page).toContain("Manage on Stripe");
    expect(page).toContain('openStripeConnectManagement("individual"');
    expect(page).toContain('intent: "manage"');
    expect(page).not.toContain("BankAccountForm");
  });

  it("2 Business Bank Accounts → Stripe manage intent", () => {
    const page = src("features/wallet/components/WalletBankAccountsPage.tsx");
    expect(page).toContain("Business Account");
    expect(page).toContain("Receive business payouts via Stripe");
    expect(page).toContain('openStripeConnectManagement("business"');
    expect(page).toContain("/api/wallet/connect");
  });

  it("3 Individual change bank → correct Connect context only", () => {
    const connect = src("lib/stripe/connect.ts");
    const route = src("app/api/wallet/connect/route.ts");
    expect(connect).toContain("createConnectManageLink");
    expect(connect).toContain("resolveConnectAccountIdForContext");
    expect(route).toContain('intent === "onboard"');
    expect(route).toContain("createConnectManageLink");
    expect(route).toContain("requireApiAuth");
    expect(route).not.toContain('requireApiRole(["seller", "business", "admin"])');
    expect(resolveConnectAccountIdForContext(
      {
        stripe_connect_account_id: "acct_legacy",
        stripe_connect_account_id_individual: "acct_ind",
        stripe_connect_account_id_business: "acct_biz",
      },
      "individual",
    )).toBe("acct_ind");
  });

  it("4 Business change bank → correct Connect context only", () => {
    expect(resolveConnectAccountIdForContext(
      {
        stripe_connect_account_id: "acct_legacy",
        stripe_connect_account_id_individual: "acct_ind",
        stripe_connect_account_id_business: "acct_biz",
      },
      "business",
    )).toBe("acct_biz");
  });

  it("5 Add card → Stripe PaymentMethod/SetupIntent + stale customer refresh", () => {
    const repo = src("lib/payments/repository.ts");
    const api = src("app/api/payment-methods/route.ts");
    const page = src("features/wallet/components/WalletPaymentMethodsPage.tsx");
    expect(repo).toContain("createPaymentMethodSetupIntent");
    expect(repo).toContain("customers.retrieve");
    expect(repo).toContain("adminClearStripeCustomer");
    expect(api).toContain("create_setup_intent");
    expect(page).toContain("create_setup_intent");
    expect(page).toContain("clientSecret");
  });

  it("6 Change/default card + Manage on Stripe portal", () => {
    const page = src("features/wallet/components/WalletPaymentMethodsPage.tsx");
    const repo = src("lib/payments/repository.ts");
    const api = src("app/api/payment-methods/route.ts");
    expect(page).toContain("Set as default");
    expect(page).toContain("set_default");
    expect(page).toContain("Manage on Stripe");
    expect(page).toContain("create_billing_portal");
    expect(repo).toContain("createPaymentMethodsBillingPortalSession");
    expect(api).toContain("create_billing_portal");
  });

  it("7 Card ownership isolation on setup intent complete", () => {
    const repo = src("lib/payments/repository.ts");
    expect(repo).toContain("setupIntent.metadata?.userId");
    expect(repo).toContain("forbidden");
    expect(repo).toContain("This card setup session belongs to another account.");
  });

  it("8 Payment method checkout compatibility (Stripe card + Personal wallet only)", () => {
    const wizard = src("features/checkout/components/CheckoutWizardV1.tsx");
    const sales = src("lib/wallet/sales.ts");
    expect(wizard).toContain('"card"');
    expect(sales).toContain('eq("wallet_context", "individual")');
    expect(wizard).not.toMatch(/split.?payment/i);
  });

  it("9 Stripe error → actionable mapped path (no opaque-only toast requirement)", () => {
    const page = src("features/wallet/components/WalletPaymentMethodsPage.tsx");
    const errors = src("lib/payments/errors.ts");
    expect(page).toContain("toastFromSetupError");
    expect(page).toContain("Manage on Stripe");
    expect(errors).toContain("actionable");
    expect(errors).toContain("manage_on_stripe");
    const mapped = paymentSetupErrorMessage(
      new PaymentSetupError("Stale customer", 502, "stripe_customer_prepare_failed"),
    );
    expect(mapped.actionable).toBe("manage_on_stripe");
    expect(mapped.message).toContain("Stale customer");
  });

  it("10 Restricted Connect account → Resolve on Stripe", () => {
    const page = src("features/wallet/components/WalletBankAccountsPage.tsx");
    expect(page).toContain("Restricted");
    expect(page).toContain("Resolve on Stripe");
  });

  it("11 Business cannot resolve to Individual Connect", () => {
    expect(resolveConnectAccountIdForContext(
      {
        stripe_connect_account_id: "acct_legacy",
        stripe_connect_account_id_individual: "acct_ind",
        stripe_connect_account_id_business: null,
      },
      "business",
    )).toBeNull();
    expect(resolveConnectAccountIdForContext(
      {
        stripe_connect_account_id_individual: "acct_ind",
      },
      "business",
    )).toBeNull();
  });

  it("12 Individual cannot resolve to Business Connect", () => {
    expect(resolveConnectAccountIdForContext(
      {
        stripe_connect_account_id_business: "acct_biz",
      },
      "individual",
    )).toBeNull();
  });

  it("13 Existing encrypted withdraw_methods remain untouched by Bank Accounts UI", () => {
    const page = src("features/wallet/components/WalletBankAccountsPage.tsx");
    const form = src("features/wallet/components/BankAccountForm.tsx");
    expect(page).not.toContain("BankAccountForm");
    expect(page).not.toContain("sort_code");
    expect(page).not.toContain("account_number");
    expect(form).toContain("sort"); // legacy module retained
    expect(src("lib/wallet/bank-account.ts")).toContain("isValidSortCode");
  });

  it("14 ROVEXO Wallet remains Personal/individual at buyer checkout", () => {
    const sales = src("lib/wallet/sales.ts");
    expect(sales).toContain("loadBuyerCheckoutWallet");
    expect(sales).toContain('eq("wallet_context", "individual")');
  });

  it("15 No split payment", () => {
    const wizard = src("features/checkout/components/CheckoutWizardV1.tsx");
    expect(wizard).toContain("walletBalanceSufficient");
    expect(wizard).not.toMatch(/split.?payment/i);
    expect(wizard).not.toContain("partialDebit");
  });

  it("16 No sensitive bank/card data leakage in active financial UI", () => {
    const bank = src("features/wallet/components/WalletBankAccountsPage.tsx");
    const pm = src("features/wallet/components/WalletPaymentMethodsPage.tsx");
    expect(bank).not.toMatch(/\bIBAN\b/);
    expect(bank).not.toContain("sort_code");
    expect(bank).not.toContain("account_number");
    expect(pm).not.toMatch(/\bCVV\b/);
    expect(pm).not.toMatch(/\bCVC\b/);
    expect(pm).not.toContain("cardNumber");
    expect(pm).toContain("formatSavedCardMask");
  });

  it("Stripe accessibility + transaction access use server-generated hosted links", () => {
    const connect = src("lib/stripe/connect.ts");
    const tx = src("features/wallet/components/HostedPayoutAccessRow.tsx");
    const detail = src("features/wallet/components/TransactionDetailPage.tsx");
    expect(connect).toContain("createConnectManageLink");
    expect(connect).toContain("v2.core.accountLinks.create");
    expect(connect).not.toContain("dashboard.stripe.com");
    expect(tx).toContain("/api/wallet/connect");
    expect(tx).not.toContain("dashboard.stripe.com");
    expect(tx).toContain("View on Stripe");
    expect(tx).toContain("Resolve on Stripe");
    expect(detail).toContain("HostedPayoutAccessRow");
    expect(detail).toContain("sellerContext");
    expect(detail).not.toContain("stripeTransferId");
  });
});
