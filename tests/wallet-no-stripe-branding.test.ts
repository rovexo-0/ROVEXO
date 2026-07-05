import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

/**
 * ROVEXO is the only visible financial interface: the user must NEVER see the
 * payment processor (Stripe / Stripe Connect / Stripe Express) anywhere in the
 * wallet, payout, or payments UI. Payment-processor integration stays in the
 * backend (`lib/stripe/**`) and in non-visible code identifiers only
 * (e.g. the `"stripe_connect"` provider enum, `stripeTransferId`, help topic
 * slugs used for routing). These guards fail the build if any user-facing
 * "Stripe" brand string is reintroduced into the wallet/payments UI.
 */

// Live, user-facing wallet + payments UI. The capitalised brand token "Stripe"
// only ever appears in human-readable copy, so a case-sensitive check keeps the
// lowercase code identifiers (`stripe_connect`, `stripeTransferId`) allowed.
const WALLET_UI_FILES = [
  "app/wallet/page.tsx",
  "features/wallet/components/WalletOverview.tsx",
  "features/wallet/components/BankAccountForm.tsx",
  "features/wallet/components/PayoutStatusCard.tsx",
  "features/wallet/components/PayoutSetupSection.tsx",
  "features/wallet/components/PendingBalanceCard.tsx",
  "features/wallet/components/RecentTransactionsSection.tsx",
  "features/wallet/components/TransactionDetailPage.tsx",
  "features/wallet/components/WalletHeader.tsx",
  "features/wallet/components/MonthSummaryGrid.tsx",
  "features/wallet/components/TransactionStatusBadge.tsx",
  "features/wallet/components/WithdrawMethodsSection.tsx",
];

// Adjacent payout/payment entry points a normal user can reach.
const RELATED_UI_FILES = [
  "features/account/components/PaymentMethodsPage.tsx",
  "features/payments-engine/PaymentsEngineHub.tsx",
  "features/seller/tax/components/SellerTaxRegistrationPage.tsx",
  "components/seller/SellerPayoutCard.tsx",
  "components/buyer/BuyerPayments.tsx",
];

describe("Wallet UI shows no payment-processor branding", () => {
  for (const file of [...WALLET_UI_FILES, ...RELATED_UI_FILES]) {
    it(`${file} contains no visible "Stripe" branding`, () => {
      const source = readSource(file);
      expect(source).not.toContain("Stripe");
    });
  }

  it("wallet formats money in GBP (£), not EUR", () => {
    const source = readSource("lib/wallet/utils.ts");
    expect(source).toContain('currency: "GBP"');
    expect(source).not.toContain('currency: "EUR"');
  });

  it("transaction detail no longer exposes internal payment references", () => {
    const source = readSource("features/wallet/components/TransactionDetailPage.tsx");
    // The old "Stripe Payment" / "Stripe transfer" rows leaked raw processor IDs.
    expect(source).not.toContain("stripeTransferId");
    expect(source).not.toContain('label="Stripe');
  });
});
