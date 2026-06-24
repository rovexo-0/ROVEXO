import type { AuctionCategory, AuctionFilter } from "@/lib/auctions/types";

export const AUCTION_FILTERS: { id: AuctionFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ending_soon", label: "Ending Soon" },
  { id: "new", label: "New" },
  { id: "most_watched", label: "Most Watched" },
  { id: "lowest_bid", label: "Lowest Bid" },
  { id: "highest_value", label: "Highest Value" },
  { id: "buy_it_now", label: "Buy It Now" },
  { id: "featured", label: "Featured" },
];

export const AUCTION_CATEGORIES: AuctionCategory[] = [
  { id: "vehicles", name: "Vehicles", slug: "vehicles", icon: "vehicles" },
  { id: "phones", name: "Phones", slug: "electronics", icon: "phones" },
  { id: "electronics", name: "Electronics", slug: "electronics", icon: "electronics" },
  { id: "computers", name: "Computers", slug: "electronics", icon: "computers" },
  { id: "gaming", name: "Gaming", slug: "electronics", icon: "gaming" },
  { id: "fashion", name: "Fashion", slug: "fashion", icon: "fashion" },
  { id: "home-garden", name: "Home & Garden", slug: "home-garden", icon: "garden" },
  { id: "collectibles", name: "Collectibles", slug: "collectables", icon: "auctions" },
  { id: "property", name: "Property", slug: "property", icon: "property" },
  { id: "business", name: "Business Equipment", slug: "business", icon: "wholesale" },
  { id: "diy", name: "DIY & Tools", slug: "diy", icon: "autoparts" },
  { id: "sports", name: "Sports", slug: "sports", icon: "sports" },
  { id: "music", name: "Music", slug: "music", icon: "electronics" },
  { id: "baby", name: "Baby", slug: "baby", icon: "fashion" },
  { id: "pets", name: "Pets", slug: "pets", icon: "pets" },
];

export const AUCTION_DURATIONS = [
  { id: "3", label: "3 days", days: 3 },
  { id: "5", label: "5 days", days: 5 },
  { id: "7", label: "7 days", days: 7 },
  { id: "10", label: "10 days", days: 10 },
] as const;
