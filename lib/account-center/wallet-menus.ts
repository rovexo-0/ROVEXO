/**
 * Personal Wallet + Business Wallet — only two wallets allowed (PO Final Authorization).
 * One Feature = One Entry Point.
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

/** Personal Wallet — /wallet */
export function buildPersonalWalletMenuSections(): WalletMenuSection[] {
  return [
    {
      id: "personal",
      title: "",
      items: [
        { id: "buying", title: "Buying", href: "/account/buying", icon: "orders" },
        { id: "selling", title: "Selling", href: "/seller", icon: "listings" },
        {
          id: "bank",
          title: "Personal Bank Account",
          href: WALLET_ROUTES.bankAccount,
          icon: "payment",
        },
        {
          id: "transactions",
          title: "Transactions",
          href: WALLET_ROUTES.transactions,
          icon: "wallet",
        },
        { id: "withdraw", title: "Withdraw", href: WALLET_ROUTES.withdraw, icon: "wallet" },
        { id: "pending", title: "Pending Funds", href: "/wallet/pending", icon: "wallet" },
        { id: "payouts", title: "Payout History", href: WALLET_ROUTES.payouts, icon: "wallet" },
      ],
    },
  ];
}

/** Business Wallet — /business/wallet (never a third wallet type). */
export function buildBusinessWalletMenuSections(): WalletMenuSection[] {
  return [
    {
      id: "business",
      title: "",
      items: [
        { id: "orders", title: "Business Orders", href: "/business/orders", icon: "orders" },
        {
          id: "transactions",
          title: "Business Transactions",
          href: "/wallet/transactions?scope=business",
          icon: "wallet",
        },
        {
          id: "promotions",
          title: "Business Promotions",
          href: "/business/promotions",
          icon: "promotions",
        },
        { id: "payouts", title: "Business Payouts", href: "/wallet/payouts", icon: "wallet" },
        {
          id: "bank",
          title: "Business Bank Account",
          href: WALLET_ROUTES.bankAccount,
          icon: "payment",
        },
        { id: "vat", title: "VAT Documents", href: "/seller/tax", icon: "help" },
      ],
    },
  ];
}
