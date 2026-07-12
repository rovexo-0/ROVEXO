export type HelpCentreCategoryButton = {
  href: string;
  title: string;
  description: string;
};

/** First-page Help Centre categories opened from My Account. */
export const HELP_CENTRE_CATEGORY_BUTTONS: HelpCentreCategoryButton[] = [
  {
    href: "/help/category/buyer",
    title: "Buying",
    description: "Checkout, orders, and purchase help",
  },
  {
    href: "/help/category/seller",
    title: "Selling",
    description: "Listings, payouts, and seller tools",
  },
  {
    href: "/help/category/payments",
    title: "Payments & Wallet",
    description: "Cards, wallet balance, and fees",
  },
  {
    href: "/help/category/shipping",
    title: "Shipping",
    description: "Delivery methods and tracking",
  },
  {
    href: "/help/category/orders",
    title: "Orders",
    description: "Track bought and sold orders",
  },
  {
    href: "/help/category/account",
    title: "Account",
    description: "Profile, settings, and access",
  },
  {
    href: "/help/category/safety",
    title: "Safety",
    description: "Trust, scams, and reporting",
  },
  {
    href: "/help/category/reports",
    title: "Reports & Appeals",
    description: "Report content and submit appeals",
  },
];
