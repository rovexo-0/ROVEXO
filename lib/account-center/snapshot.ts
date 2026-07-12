import {
  countAccountActiveListings,
  countAccountActiveOrders,
  countAccountFollowers,
  countAccountSavedItems,
  getAccountReviewSummary,
} from "@/lib/account-center/profile-stats";
import type { UserProfile } from "@/lib/profile/types";

export type AccountHubSnapshot = {
  listings: number;
  saved: number;
  orders: number;
  rating: number;
  reviewCount: number;
  followers: number;
};

export async function fetchAccountHubSnapshot(profile: UserProfile): Promise<AccountHubSnapshot> {
  const userId = profile.id;

  const [listings, saved, orders, reviews, followers] = await Promise.all([
    countAccountActiveListings(userId).catch(() => 0),
    countAccountSavedItems(userId).catch(() => 0),
    countAccountActiveOrders(userId).catch(() => 0),
    getAccountReviewSummary(userId).catch(() => ({ rating: 0, reviewCount: 0 })),
    countAccountFollowers(userId).catch(() => 0),
  ]);

  return {
    listings,
    saved,
    orders,
    rating: reviews.rating,
    reviewCount: reviews.reviewCount,
    followers,
  };
}
