import type { LeaderboardEntry } from "@/lib/enterprise-business-intelligence/types";

function entry(id: string, label: string, value: number, rank: number, changePercent?: number): LeaderboardEntry {
  return { id, label, value, rank, changePercent };
}

export function createDefaultMarketplaceAnalytics(): Record<string, LeaderboardEntry[]> {
  return {
    "top-categories": [
      entry("cat-1", "Electronics", 842000, 1, 12),
      entry("cat-2", "Fashion", 615000, 2, 8),
      entry("cat-3", "Home & Garden", 428000, 3, 15),
      entry("cat-4", "Sports", 312000, 4, 5),
      entry("cat-5", "Automotive", 289000, 5, -2),
    ],
    "top-products": [
      entry("prod-1", "Wireless Earbuds Pro", 98400, 1, 22),
      entry("prod-2", "Smart Watch Series X", 87200, 2, 18),
      entry("prod-3", "Organic Skincare Set", 65400, 3, 9),
    ],
    "top-sellers": [
      entry("seller-1", "TechHub UK", 428000, 1, 14),
      entry("seller-2", "Fashion Forward", 356000, 2, 11),
      entry("seller-3", "Home Essentials", 298000, 3, 7),
    ],
    "top-buyers": [
      entry("buyer-1", "Premium Buyer #1042", 28400, 1),
      entry("buyer-2", "Business Account #892", 22100, 2),
      entry("buyer-3", "Repeat Customer #331", 19800, 3),
    ],
    "featured-listings": [entry("feat-1", "Featured Electronics", 156000, 1, 20)],
    "promoted-listings": [entry("promo-1", "Promoted Fashion", 98000, 1, 15)],
    auctions: [entry("auc-1", "Live Auctions GMV", 124000, 1, 8)],
    coupons: [entry("coup-1", "Coupon Redemptions", 42000, 1, 25)],
    subscriptions: [entry("sub-1", "Active Subscriptions", 8900, 1, 18)],
    "wallet-usage": [entry("wallet-1", "Wallet Transactions", 312000, 1, 12)],
  };
}

export function topByValue(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => b.value - a.value);
}
