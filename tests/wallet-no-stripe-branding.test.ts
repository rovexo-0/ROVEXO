import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

/**
 * ROVEXO is the only visible financial interface: the user must NEVER see the
 * payment processor (Stripe / Stripe Connect / Stripe Express) anywhere in the
 * wallet, payout, or payments UI.
 */

const WALLET_UI_FILES = [
  "app/wallet/page.tsx",
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
  for (const file of [...WALLET_UI_FILES, ...RELATED_UI_FILES]) {
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
});
