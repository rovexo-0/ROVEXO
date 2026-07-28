/**
 * Wallet v2 — Master Engine lock.
 * Transactions · Payment Methods · Bank Accounts (Personal + Business inside hub).
 * Business bank row visibility is resolved inside the Bank Accounts page.
 */
import type { AccountIconName } from "@/components/account/AccountIcons";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { resolveFeatureVisibility } from "@/lib/master-engine";

export type WalletMenuItem = {
  id: string;
  title: string;
  href: string;
  icon: AccountIconName;
};

export type WalletMenuSection = {
  id: string;
  title: string;
  items: WalletMenuItem[];
};

function walletDestinationItems(): WalletMenuItem[] {
  const showPaymentMethods = resolveFeatureVisibility("payment-methods").visible;
  const showPersonalBank = resolveFeatureVisibility("personal-bank-account").visible;
  const showBankAccountsHub =
    showPersonalBank || resolveFeatureVisibility("business-bank-account").visible;

  const items: WalletMenuItem[] = [
    {
      id: "transactions",
      title: "Transactions",
      href: WALLET_ROUTES.transactions,
      icon: "wallet",
    },
  ];

  if (showPaymentMethods) {
    items.push({
      id: "payment-methods",
      title: "Payment Methods",
      href: WALLET_ROUTES.paymentMethods,
      icon: "payment",
    });
  }

  if (showBankAccountsHub) {
    items.push({
      id: "bank-accounts",
      title: "Bank Accounts",
      href: WALLET_ROUTES.bankAccounts,
      icon: "payment",
    });
  }

  return items;
}

/** Destinations below balance rows (Available / Pending / Processing / Locked / Withdraw). */
export function buildPersonalWalletMenuSections(_options?: {
  isBusinessVerified?: boolean;
}): WalletMenuSection[] {
  void _options;
  return [
    {
      id: "wallet",
      title: "",
      items: walletDestinationItems(),
    },
  ];
}

/** Business Wallet — same money destinations (one Wallet SSOT). */
export function buildBusinessWalletMenuSections(_options?: {
  isBusinessVerified?: boolean;
}): WalletMenuSection[] {
  void _options;
  return [
    {
      id: "business-wallet",
      title: "",
      items: walletDestinationItems(),
    },
  ];
}
