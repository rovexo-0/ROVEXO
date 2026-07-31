/**
 * Public seller profile — View Profile v1.0 data for UI.
 * Read-only expansion of existing tables/helpers. No schema or API changes.
 */

import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/products/types";
import { getEligibleListings } from "@/lib/listings/eligible-listings";
import { isSellerOnVacation } from "@/lib/settings/vacation";
import { normalizeAvatarUrl } from "@/lib/media/normalize-avatar-url";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";

export type PublicSellerProfile = {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  rating: number;
  reviewCount: number;
  listingCount: number;
  salesCount: number;
  memberSince: string;
  lastSeenLabel: string | null;
  country: string | null;
  emailVerified: boolean;
  /** Public bio from seller_profiles (may be null). */
  bio: string | null;
  /**
   * Seller Holiday Mode ON — public listings hidden; profile shell remains.
   * Driven by `user_settings.vacation_mode`.
   */
  holidayModeEnabled: boolean;
  listings: Product[];
  soldListings: Product[];
  /** Own-profile only — never exposed to other viewers. */
  draftListings: Product[];
  /** Blood Code XLVI marketplace Follow counters. */
  followerCount: number;
  followingCount: number;
  /** Reputation badge label from Seller Performance (Bronze→Legend). */
  badgeLabel: string | null;
  /** Viewer follow state (false for guests / own profile). */
  isFollowing: boolean;
};

function formatMemberSince(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}

function formatLastActive(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;
  try {
    const then = new Date(isoDate).getTime();
    if (Number.isNaN(then)) return null;
    const diffMs = Date.now() - then;
    if (diffMs < 60_000) return "Just now";
    if (diffMs < 3_600_000) {
      const mins = Math.max(1, Math.floor(diffMs / 60_000));
      return `${mins}m ago`;
    }
    if (diffMs < 86_400_000) {
      const hours = Math.max(1, Math.floor(diffMs / 3_600_000));
      return `${hours}h ago`;
    }
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(isoDate));
  } catch {
    return null;
  }
}

export async function getPublicSellerProfile(
  username: string,
): Promise<PublicSellerProfile | null> {
  const supabase = await createClient();
  const normalized = username.trim().toLowerCase();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, username, role, avatar_url, verified, created_at, updated_at")
    .eq("username", normalized)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  // Unified ROVEXO account: selling is unlocked by activity, not a separate tier.
  // Platform admins / Super Admin may still expose a public My Profile / store.
  if (!["buyer", "seller", "business", "admin", "super_admin"].includes(profile.role)) {
    return null;
  }

  const [
    { data: sellerProfile },
    storeListings,
    { data: taxProfile },
    { data: soldRows },
    publicBadges,
    holidayModeEnabled,
  ] = await Promise.all([
    supabase
      .from("seller_profiles")
      .select("rating, review_count, listing_count, sales_count, bio")
      .eq("id", profile.id)
      .maybeSingle(),
    getEligibleListings({
      surface: "seller",
      sellerId: profile.id,
      page: 1,
      pageSize: 24,
    }).catch(() => ({ items: [] as Product[], total: 0, page: 1, pageSize: 24 })),
    supabase
      .from("seller_tax_profiles")
      .select("country")
      .eq("seller_id", profile.id)
      .maybeSingle(),
    Promise.resolve(
      supabase
        .from("products")
        .select(
          "id, slug, title, price, condition, rating, review_count, views, likes, created_at, product_images ( url, thumbnail_url, sort_order, is_primary ), brands ( name )",
        )
        .eq("seller_id", profile.id)
        .eq("status", "sold")
        .order("created_at", { ascending: false })
        .limit(24),
    )
      .then((result) => ({ data: result.data ?? [] }))
      .catch(() => ({ data: [] })),
    import("@/lib/badge/store")
      .then((m) => m.getPublicBadges(profile.id))
      .catch(() => []),
    isSellerOnVacation(supabase, profile.id).catch(() => false),
  ]);

  const listings: Product[] = storeListings.items ?? [];
  const soldListings: Product[] = (soldRows ?? []).map((row) => {
    const images = [...(row.product_images ?? [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    );
    const primary = images[0];
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      price: Number(row.price),
      condition: row.condition,
      sellerName: profile.full_name,
      sellerId: profile.id,
      sellerUsername: profile.username,
      rating: Number(row.rating),
      reviewCount: row.review_count,
      views: row.views,
      likes: row.likes,
      brand: row.brands?.name,
      imageUrl: primary?.thumbnail_url ?? primary?.url ?? PRODUCT_IMAGE_FALLBACK,
      sections: [],
      createdAt: row.created_at ?? null,
    };
  });

  return {
    id: profile.id,
    fullName: profile.full_name,
    username: profile.username,
    avatarUrl: normalizeAvatarUrl(profile.avatar_url),
    coverUrl: null,
    rating: Number(sellerProfile?.rating ?? 0),
    reviewCount: sellerProfile?.review_count ?? 0,
    listingCount: sellerProfile?.listing_count ?? listings.length,
    salesCount: sellerProfile?.sales_count ?? 0,
    memberSince: formatMemberSince(profile.created_at),
    lastSeenLabel: formatLastActive(profile.updated_at),
    country: taxProfile?.country?.trim() || null,
    emailVerified: Boolean(profile.verified),
    bio: typeof sellerProfile?.bio === "string" ? sellerProfile.bio.trim() || null : null,
    holidayModeEnabled: Boolean(holidayModeEnabled),
    listings,
    soldListings,
    draftListings: [],
    followerCount: 0,
    followingCount: 0,
    badgeLabel: publicBadges[0]?.label ?? null,
    isFollowing: false,
  };
}

/** Own-profile drafts only — fail-closed returns []. */
export async function fetchSellerDraftListings(
  sellerId: string,
  sellerMeta?: { fullName: string; username: string },
): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data: draftRows } = await supabase
      .from("products")
      .select(
        "id, slug, title, price, condition, rating, review_count, views, likes, created_at, product_images ( url, thumbnail_url, sort_order, is_primary ), brands ( name )",
      )
      .eq("seller_id", sellerId)
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(24);

    return (draftRows ?? []).map((row) => {
      const images = [...(row.product_images ?? [])].sort(
        (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
      );
      const primary = images[0];
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        price: Number(row.price),
        condition: row.condition,
        sellerName: sellerMeta?.fullName ?? "",
        sellerId,
        sellerUsername: sellerMeta?.username ?? "",
        rating: Number(row.rating),
        reviewCount: row.review_count,
        views: row.views,
        likes: row.likes,
        brand: row.brands?.name,
        imageUrl: primary?.thumbnail_url ?? primary?.url ?? PRODUCT_IMAGE_FALLBACK,
        sections: [],
        createdAt: row.created_at ?? null,
      };
    });
  } catch {
    return [];
  }
}
