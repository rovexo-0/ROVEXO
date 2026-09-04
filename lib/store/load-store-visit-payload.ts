/**
 * Visit Store v2.0 — server payload loader (STORE route only).
 * Must never be imported by Profile `/user/[username]`.
 */

import "server-only";

import { listSellerReviews } from "@/lib/reviews/store";
import { getFollowCounts, isFollowing } from "@/lib/follow/marketplace-follow-store-v1";
import { getAuthContext } from "@/lib/auth/session";
import { getEligibleListings } from "@/lib/listings/eligible-listings";
import {
  resolveStoreByRouteParam,
  storeMemberSinceLabel,
  type StoreRecord,
} from "@/lib/store/store-repository";
import type { Review } from "@/lib/reviews/types";
import type { Product } from "@/lib/products/types";
import { toPublicProductDocuments } from "@/lib/products/public-product-contract-v1";

export type StoreVisitPayload =
  | { kind: "unavailable" }
  | {
      kind: "ok";
      store: StoreRecord;
      listings: Product[];
      reviews: Review[];
      memberSinceLabel: string;
      isOwnStore: boolean;
      isFollowing: boolean;
      followerCount: number;
      followingCount: number;
      loadFailed: boolean;
    };

export async function loadStoreVisitPayload(routeParam: string): Promise<StoreVisitPayload> {
  const store = await resolveStoreByRouteParam(routeParam).catch(() => null);
  if (!store) return { kind: "unavailable" };

  try {
    const authPromise = getAuthContext().catch(() => null);
    const [auth, reviews, followCounts] = await Promise.all([
      authPromise,
      listSellerReviews(store.sellerId, 50).catch(() => [] as Review[]),
      getFollowCounts(store.sellerId).catch(() => ({
        followerCount: 0,
        followingCount: 0,
      })),
    ]);
    const isOwnStore = auth?.user.id === store.sellerId;

    const [viewerFollowing, expandedListings] = await Promise.all([
      auth?.user.id && !isOwnStore
        ? isFollowing(auth.user.id, store.sellerId).catch(() => false)
        : Promise.resolve(false),
      getEligibleListings({
        surface: "seller",
        sellerId: store.sellerId,
        page: 1,
        pageSize: 48,
        includeHolidayModeListings: isOwnStore,
      }).catch(() => null),
    ]);

    const rawListings = expandedListings?.items ?? store.listings;
    return {
      kind: "ok",
      store: {
        ...store,
        listings: toPublicProductDocuments(store.listings),
        soldListings: toPublicProductDocuments(store.soldListings),
      },
      listings: toPublicProductDocuments(rawListings),
      reviews,
      memberSinceLabel: storeMemberSinceLabel(store.memberSinceIso),
      isOwnStore,
      isFollowing: Boolean(viewerFollowing),
      followerCount: followCounts.followerCount,
      followingCount: followCounts.followingCount,
      loadFailed: false,
    };
  } catch {
    return {
      kind: "ok",
      store,
      listings: [],
      reviews: [],
      memberSinceLabel: storeMemberSinceLabel(store.memberSinceIso),
      isOwnStore: false,
      isFollowing: false,
      followerCount: 0,
      followingCount: 0,
      loadFailed: true,
    };
  }
}
