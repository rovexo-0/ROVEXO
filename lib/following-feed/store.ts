/**
 * Following Feed Engine v1.0 — Store
 * Consumes Follow Engine listFollowing + getEligibleListings (visibility SSOT).
 * Never queries user_follows. Never creates follows. Never duplicates product logic.
 */

import "server-only";

import { listFollowing } from "@/lib/follow/marketplace-follow-store-v1";
import { getEligibleListings } from "@/lib/listings/eligible-listings";
import { getPublicBadges } from "@/lib/badge/store";
import { listBlockedUsers } from "@/lib/account/blocked-users";
import { FOLLOWING_FEED_ENGINE_V1 } from "@/lib/following-feed/following-feed-engine-v1";
import type { FollowingFeedEventType } from "@/lib/following-feed/following-feed-engine-v1";
import { getFollowingFeedPrefs } from "@/lib/following-feed/prefs";
import type {
  FollowingFeedCard,
  FollowingFeedPage,
  FollowingFeedSeller,
} from "@/lib/following-feed/types";
import type { Product } from "@/lib/products/types";

const PAGE_SIZE = 12;
const MAX_FOLLOWED_SELLERS = 40;
const LISTINGS_PER_SELLER = 8;
const RELIST_MIN_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function classifyListingEvent(product: Product): FollowingFeedEventType {
  const original = product.originalPrice ?? null;
  if (original != null && original > product.price) {
    return "PRICE_REDUCTION";
  }
  if (product.isFeatured) {
    return "FEATURED_LISTING";
  }
  const created = product.createdAt ? Date.parse(product.createdAt) : NaN;
  // Relist heuristic: listing exists long enough that a fresh bump/update is a relist signal.
  // Prefer createdAt as activity time; stock restore → BACK_IN_STOCK (optional).
  if (
    Number.isFinite(created) &&
    Date.now() - created > RELIST_MIN_AGE_MS &&
    product.isBumped
  ) {
    return "RELISTED_ITEM";
  }
  if (product.stock != null && product.stock > 0 && product.isBumped === false) {
    // Default marketplace discovery event
  }
  return "NEW_LISTING";
}

function eventAllowed(
  eventType: FollowingFeedEventType,
  prefs: ReturnType<typeof getFollowingFeedPrefs>,
): boolean {
  switch (eventType) {
    case "NEW_LISTING":
    case "FEATURED_LISTING":
    case "BACK_IN_STOCK":
      return prefs.newListings;
    case "PRICE_REDUCTION":
      return prefs.priceDrops;
    case "RELISTED_ITEM":
      return prefs.relistedItems;
    case "SELLER_VERIFIED":
      return prefs.verifiedSellerEvents;
    case "NEW_PUBLIC_BADGE":
      return prefs.badgeEvents;
    default:
      return true;
  }
}

function toSeller(
  product: Product,
  badgeLabel: string | null,
): FollowingFeedSeller {
  return {
    id: product.sellerId ?? "",
    name: product.sellerName || "Seller",
    username: product.sellerUsername ?? null,
    avatarUrl: product.sellerAvatar ?? null,
    verified: Boolean(product.sellerVerified),
    badgeLabel,
  };
}

function buildCard(
  product: Product,
  eventType: FollowingFeedEventType,
  badgeLabel: string | null,
): FollowingFeedCard | null {
  if (!product.sellerId || !product.id || !product.slug) return null;
  const occurredAt = product.createdAt ?? new Date().toISOString();
  const dayKey = occurredAt.slice(0, 10);
  return {
    id: `${eventType}:${product.id}`,
    eventType,
    occurredAt,
    listingId: product.id,
    listingSlug: product.slug,
    title: product.title,
    price: product.price,
    originalPrice: product.originalPrice ?? null,
    imageUrl: product.imageUrl,
    seller: toSeller(product, badgeLabel),
    groupKey: `${product.sellerId}:${eventType}:${dayKey}`,
    groupCount: 1,
    groupTitle: null,
  };
}

/** Collapse identical seller+event+day groups into one card. */
function groupCards(cards: FollowingFeedCard[]): FollowingFeedCard[] {
  const byGroup = new Map<string, FollowingFeedCard[]>();
  for (const card of cards) {
    const list = byGroup.get(card.groupKey) ?? [];
    list.push(card);
    byGroup.set(card.groupKey, list);
  }
  const out: FollowingFeedCard[] = [];
  for (const group of byGroup.values()) {
    group.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
    const head = group[0]!;
    if (group.length === 1 || head.eventType !== "NEW_LISTING") {
      out.push(head);
      continue;
    }
    out.push({
      ...head,
      id: `group:${head.groupKey}`,
      groupCount: group.length,
      groupTitle: `${head.seller.name} published ${group.length} new items.`,
    });
  }
  out.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  return out;
}

async function loadBadgeLabels(
  sellerIds: string[],
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  await Promise.all(
    sellerIds.map(async (id) => {
      try {
        const badges = await getPublicBadges(id);
        map.set(id, badges[0]?.label ?? null);
      } catch {
        map.set(id, null);
      }
    }),
  );
  return map;
}

/**
 * Build one page of Following Feed for an authenticated viewer.
 * Fail-closed: throws never — returns error payload for UI retry.
 */
export async function getFollowingFeedPage(
  viewerId: string,
  page = 1,
): Promise<FollowingFeedPage> {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const emptyBase: FollowingFeedPage = {
    items: [],
    page: safePage,
    hasMore: false,
    followingCount: 0,
    empty: true,
    emptyMessage: FOLLOWING_FEED_ENGINE_V1.emptyStateCopy,
    error: null,
  };

  try {
    const prefs = getFollowingFeedPrefs(viewerId);

    const [following, blocked] = await Promise.all([
      listFollowing(viewerId, viewerId, {
        limit: MAX_FOLLOWED_SELLERS,
        offset: 0,
      }),
      listBlockedUsers(viewerId).catch(() => []),
    ]);

    const blockedSet = new Set(blocked.map((b) => b.blockedUserId));
    const sellers = following.filter((s) => !blockedSet.has(s.id));

    if (sellers.length === 0) {
      return { ...emptyBase, followingCount: 0 };
    }

    const listingBatches = await Promise.all(
      sellers.map((seller) =>
        getEligibleListings({
          sellerId: seller.id,
          sort: "newest",
          page: 1,
          pageSize: LISTINGS_PER_SELLER,
          surface: "seller",
        }).catch(() => ({ items: [] as Product[], total: 0, page: 1, hasMore: false })),
      ),
    );

    const products = listingBatches.flatMap((batch) => batch.items);
    // Suspended / hidden already filtered by eligibility; drop missing sellers.
    const activeProducts = products.filter(
      (p) =>
        p.sellerId &&
        !blockedSet.has(p.sellerId) &&
        p.sellerAccountStatus !== "suspended" &&
        p.sellerAccountStatus !== "banned",
    );

    const badgeLabels = await loadBadgeLabels(
      [...new Set(activeProducts.map((p) => p.sellerId!).filter(Boolean))],
    );

    const rawCards: FollowingFeedCard[] = [];
    for (const product of activeProducts) {
      const eventType = classifyListingEvent(product);
      if (!eventAllowed(eventType, prefs)) continue;
      const card = buildCard(
        product,
        eventType,
        prefs.badgeEvents ? (badgeLabels.get(product.sellerId!) ?? null) : null,
      );
      if (!card) continue;
      if (!prefs.verifiedSellerEvents) {
        card.seller = { ...card.seller, verified: false };
      }
      rawCards.push(card);
    }

    // Dedupe by card id
    const seen = new Set<string>();
    const deduped = rawCards.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    const grouped = groupCards(deduped);
    const start = (safePage - 1) * PAGE_SIZE;
    const slice = grouped.slice(start, start + PAGE_SIZE);

    if (grouped.length === 0) {
      return {
        ...emptyBase,
        followingCount: sellers.length,
        emptyMessage: FOLLOWING_FEED_ENGINE_V1.emptyStateCopy,
      };
    }

    return {
      items: slice,
      page: safePage,
      hasMore: start + PAGE_SIZE < grouped.length,
      followingCount: sellers.length,
      empty: false,
      emptyMessage: null,
      error: null,
    };
  } catch {
    return {
      items: [],
      page: safePage,
      hasMore: false,
      followingCount: 0,
      empty: false,
      emptyMessage: null,
      error: FOLLOWING_FEED_ENGINE_V1.failSafeCopy,
    };
  }
}
