import type { FollowingFeedEventType } from "@/lib/following-feed/following-feed-engine-v1";

export type FollowingFeedPrefs = {
  newListings: boolean;
  priceDrops: boolean;
  relistedItems: boolean;
  verifiedSellerEvents: boolean;
  badgeEvents: boolean;
};

export const DEFAULT_FOLLOWING_FEED_PREFS: FollowingFeedPrefs = {
  newListings: true,
  priceDrops: true,
  relistedItems: true,
  verifiedSellerEvents: true,
  badgeEvents: true,
};

export type FollowingFeedSeller = {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  verified: boolean;
  badgeLabel: string | null;
};

export type FollowingFeedCard = {
  id: string;
  eventType: FollowingFeedEventType;
  occurredAt: string;
  listingId: string;
  listingSlug: string;
  title: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string;
  seller: FollowingFeedSeller;
  /** Grouping — cards with same groupKey may collapse in UI. */
  groupKey: string;
  groupCount: number;
  groupTitle: string | null;
};

export type FollowingFeedPage = {
  items: FollowingFeedCard[];
  page: number;
  hasMore: boolean;
  followingCount: number;
  empty: boolean;
  emptyMessage: string | null;
  error: string | null;
};

export type FollowingFeedPrefsUpdate = Partial<FollowingFeedPrefs>;
