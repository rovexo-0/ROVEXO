export type NavigationTarget = {
  label: string;
  href: string;
  description: string;
  keywords: string[];
};

export const PLATFORM_NAVIGATION: NavigationTarget[] = [
  { label: "Home", href: "/", description: "Marketplace homepage", keywords: ["home", "start"] },
  { label: "Search", href: "/search", description: "Search listings and sellers", keywords: ["search", "find"] },
  { label: "Saved", href: "/saved", description: "Wishlist and saved items", keywords: ["saved", "wishlist", "favorites"] },
  { label: "Orders", href: "/orders", description: "Buyer order history", keywords: ["orders", "purchases"] },
  { label: "Messages", href: "/messages", description: "Buyer and seller chat", keywords: ["messages", "chat"] },
  { label: "Sell", href: "/sell", description: "Create a new listing", keywords: ["sell", "listing", "publish"] },
  { label: "Selling", href: "/seller", description: "Selling workspace and stats", keywords: ["selling", "listings"] },
  { label: "Wallet", href: "/wallet", description: "Balance, withdrawals, and payouts", keywords: ["wallet", "withdraw", "payout"] },
  { label: "Business tools", href: "/business/dashboard", description: "Verified business information", keywords: ["business tools", "verification"] },
  { label: "Business Directory", href: "/business/directory", description: "Discover verified businesses", keywords: ["directory", "companies"] },
  { label: "Wholesale Center", href: "/wholesale", description: "Bulk trade and RFQ", keywords: ["wholesale", "rfq", "bulk"] },
  { label: "Trust Center", href: "/trust", description: "Trust score and verification", keywords: ["trust", "verification", "safety"] },
  { label: "Help Center", href: "/help", description: "Guided troubleshooting and articles", keywords: ["help", "support", "faq"] },
  { label: "AI Assistant", href: "/assistant", description: "Marketplace assistant", keywords: ["assistant", "ai"] },
  { label: "Plans", href: "/plans", description: "Subscriptions and premium features", keywords: ["plans", "subscription", "premium"] },
  { label: "Notifications", href: "/notifications", description: "Notification center", keywords: ["notifications", "alerts"] },
  { label: "Settings", href: "/settings", description: "Account and profile settings", keywords: ["settings", "profile"] },
  { label: "Admin", href: "/admin", description: "Platform administration", keywords: ["admin", "moderation"] },
];

export function findNavigationTarget(query: string): NavigationTarget | null {
  const normalized = query.toLowerCase();
  let best: { target: NavigationTarget; score: number } | null = null;

  for (const target of PLATFORM_NAVIGATION) {
    let score = 0;
    if (normalized.includes(target.label.toLowerCase())) score += 5;
    for (const keyword of target.keywords) {
      if (normalized.includes(keyword)) score += 2;
    }
    if (score > 0 && (!best || score > best.score)) best = { target, score };
  }

  return best?.target ?? null;
}
