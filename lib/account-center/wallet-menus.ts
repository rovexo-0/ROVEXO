/**
 * Wallet — Absolute Final PO lock.
 * Available · Pending · Withdraw · Transactions · Personal Bank · Business Bank.
 */
import type { AccountIconName } from "@/components/account/AccountIcons";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

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

/** Destinations below balance rows (Available / Pending / Withdraw live on hub). */
export function buildPersonalWalletMenuSections(): WalletMenuSection[] {
  return [
    {
      id: "wallet",
      title: "",
      items: [
        {
          id: "transactions",
          title: "Transactions",
          href: WALLET_ROUTES.transactions,
          icon: "wallet",
        },
        {
          id: "personal-bank",
          title: "Personal Bank Account",
          href: WALLET_ROUTES.bankAccount,
          icon: "payment",
        },
        {
          id: "business-bank",
          title: "Business Bank Account",
          href: `${WALLET_ROUTES.bankAccount}?scope=business`,
          icon: "payment",
        },
      ],
    },
  ];
}

/** Business Wallet — same money destinations, business-scoped. */
export function buildBusinessWalletMenuSections(): WalletMenuSection[] {
  return [
    {
      id: "business-wallet",
      title: "",
      items: [
        {
          id: "transactions",
          title: "Transactions",
          href: "/wallet/transactions?scope=business",
          icon: "wallet",
        },
        {
          id: "personal-bank",
          title: "Personal Bank Account",
          href: WALLET_ROUTES.bankAccount,
          icon: "payment",
        },
        {
          id: "business-bank",
          title: "Business Bank Account",
          href: `${WALLET_ROUTES.bankAccount}?scope=business`,
          icon: "payment",
        },
      ],
    },
  ];
}
