import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

/**
 * ROVEXO remains the primary financial interface.
 * Decorative payment-processor branding is forbidden.
 * Owner-required Stripe-hosted action CTAs ("Manage/View/Resolve on Stripe")
 * live on dedicated management surfaces — not as decorative branding.
 */

const WALLET_UI_FILES_NO_STRIPE_WORD = [
  "app/(platform)/wallet/page.tsx",
  "features/wallet/components/WalletHubV1.tsx",
  "features/wallet/components/WalletPage.tsx",
  "features/wallet/components/BankAccountForm.tsx",
  "features/wallet/components/PayoutStatusCard.tsx",
  "features/wallet/components/PayoutSetupSection.tsx",
  "features/wallet/components/TransactionDetailPage.tsx",
  "features/wallet/components/MonthSummaryGrid.tsx",
  "features/wallet/components/TransactionStatusBadge.tsx",
  "features/wallet/components/WalletMenuSections.tsx",
];

const RELATED_UI_FILES = [
  "features/account/components/PaymentMethodsPage.tsx",
  "features/seller/tax/components/SellerTaxRegistrationPage.tsx",
  "components/buyer/BuyerPayments.tsx",
];

describe("Wallet UI shows no payment-processor branding", () => {
  for (const file of [...WALLET_UI_FILES_NO_STRIPE_WORD, ...RELATED_UI_FILES]) {
    it(`${file} contains no visible "Stripe" branding`, () => {
      expect(existsSync(path.join(process.cwd(), file)), file).toBe(true);
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
    expect(source).not.toContain("stripeTransferId");
    expect(source).not.toContain('label="Stripe');
  });

  it("hosted payout access CTAs are server-routed (Owner Stripe accessibility)", () => {
    const access = readSource("features/wallet/components/HostedPayoutAccessRow.tsx");
    expect(access).toContain("View on Stripe");
    expect(access).toContain("Resolve on Stripe");
    expect(access).toContain("/api/wallet/connect");
    expect(access).not.toContain("dashboard.stripe.com");
  });
});
