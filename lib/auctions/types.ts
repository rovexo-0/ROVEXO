import type { Product } from "@/lib/products/types";
import type { RovexoCategoryPremiumKey } from "@/lib/home/category-premium-library";

export type AuctionFilter =
  | "all"
  | "ending_soon"
  | "new"
  | "most_watched"
  | "lowest_bid"
  | "highest_value"
  | "buy_it_now"
  | "featured";

export type AuctionCategory = {
  id: string;
  name: string;
  slug: string;
  icon: RovexoCategoryPremiumKey;
};

export type AuctionListing = Product & {
  bidCount: number;
  watchers: number;
  minNextBid: number;
  buyNowPrice: number | null;
  reserveMet: boolean;
  isEndingSoon: boolean;
  hasBuyNow: boolean;
  categorySlug: string | null;
  createdAtMs: number;
};

export type AuctionStats = {
  liveAuctions: number;
  endingSoon: number;
  activeBidders: number;
  watchingNow: number;
};

export type AuctionCategoryCount = AuctionCategory & {
  liveCount: number;
};

export type AuctionsPageData = {
  stats: AuctionStats;
  categories: AuctionCategoryCount[];
  featured: AuctionListing[];
  endingSoon: AuctionListing[];
  newest: AuctionListing[];
  mostWatched: AuctionListing[];
  all: AuctionListing[];
};
