/**
 * ROVEXO Store SSOT — PRODUCTION LOCK (server repository)
 *
 * PRODUCT.seller_id → STORE.store_id (= seller_id) → store_slug → STORE PAGE
 *
 * Forbidden: email matching · ILIKE demo · hardcoded sellers/stores.
 * Social Follow permanently removed.
 */

import { createClient } from "@/lib/supabase/server";
import { getEligibleListings } from "@/lib/listings/eligible-listings";
import { isSellerOnVacation } from "@/lib/settings/vacation";
import { normalizeAvatarUrl } from "@/lib/media/normalize-avatar-url";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";
import type { Product } from "@/lib/products/types";
import { isStoreId, isStoreSlug } from "@/lib/store/store-href";

export const STORE_SSOT_VERSION = "1.0" as const;

export type StoreRecord = {
  /** store_id === seller_id (profiles.id) */
  storeId: string;
  sellerId: string;
  /** Public URL slug (profiles.username column = store_slug) */
  storeSlug: string;
  storeName: string;
  avatarUrl: string | null;
  verified: boolean;
  role: string;
  memberSinceIso: string;
  bio: string | null;
  website: string | null;
  rating: number;
  reviewCount: number;
  listingCount: number;
  salesCount: number;
  followerCount: number;
  followingCount: number;
  /** Seller Holiday Mode — public listings hidden via visibility SSOT. */
  holidayModeEnabled: boolean;
  listings: Product[];
  soldListings: Product[];
};

export { isStoreId, isStoreSlug, resolveStoreHrefFromSeller } from "@/lib/store/store-href";

function formatMemberSince(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}

function mapSoldRows(
  rows: Array<Record<string, unknown>>,
  seller: { id: string; fullName: string; username: string },
): Product[] {
  return rows.map((row) => {
    const images = [...((row.product_images as Array<Record<string, unknown>>) ?? [])].sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) ||
        Number(a.sort_order) - Number(b.sort_order),
    );
    const primary = images[0];
    const brands = row.brands as { name?: string } | null;
    return {
      id: String(row.id),
      slug: String(row.slug),
      title: String(row.title),
      price: Number(row.price),
      condition: String(row.condition ?? ""),
      sellerName: seller.fullName,
      sellerId: seller.id,
      sellerUsername: seller.username,
      rating: Number(row.rating ?? 0),
      reviewCount: Number(row.review_count ?? 0),
      views: Number(row.views ?? 0),
      likes: Number(row.likes ?? 0),
      brand: brands?.name,
      imageUrl:
        (primary?.thumbnail_url as string | undefined) ??
        (primary?.url as string | undefined) ??
        PRODUCT_IMAGE_FALLBACK,
      sections: [],
      createdAt: (row.created_at as string | null) ?? null,
    };
  });
}

async function loadStoreFromProfile(profile: {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  verified: boolean;
  role: string;
  created_at: string;
  account_status: string | null;
  deleted_at: string | null;
  suspended_at: string | null;
}): Promise<StoreRecord | null> {
  if (profile.deleted_at || profile.suspended_at) return null;

  const supabase = await createClient();

  const [{ data: sellerProfile }, storeListings, { data: business }, soldResult, holidayModeEnabled] =
    await Promise.all([
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
        .from("business_accounts")
        .select("business_name, website")
        .eq("id", profile.id)
        .maybeSingle(),
      supabase
        .from("products")
        .select(
          "id, slug, title, price, condition, rating, review_count, views, likes, created_at, product_images ( url, thumbnail_url, sort_order, is_primary ), brands ( name )",
        )
        .eq("seller_id", profile.id)
        .eq("status", "sold")
        .eq("is_demo", false)
        .order("created_at", { ascending: false })
        .limit(24),
      isSellerOnVacation(supabase, profile.id).catch(() => false),
    ]);

  const listings = storeListings.items ?? [];
  const soldListings = mapSoldRows((soldResult.data ?? []) as Array<Record<string, unknown>>, {
    id: profile.id,
    fullName: profile.full_name,
    username: profile.username,
  });

  const storeName =
    (business?.business_name && String(business.business_name).trim()) ||
    profile.full_name;

  return {
    storeId: profile.id,
    sellerId: profile.id,
    storeSlug: profile.username,
    storeName,
    avatarUrl: normalizeAvatarUrl(profile.avatar_url),
    verified: Boolean(profile.verified),
    role: profile.role,
    memberSinceIso: profile.created_at,
    bio: typeof sellerProfile?.bio === "string" ? sellerProfile.bio.trim() || null : null,
    website: business?.website ?? null,
    rating: Number(sellerProfile?.rating ?? 0),
    reviewCount: sellerProfile?.review_count ?? 0,
    listingCount: sellerProfile?.listing_count ?? listings.length,
    salesCount: sellerProfile?.sales_count ?? 0,
    // Phase 3 will wire live counters — do not select DB columns that may be absent.
    followerCount: 0,
    followingCount: 0,
    holidayModeEnabled: Boolean(holidayModeEnabled),
    listings,
    soldListings,
  };
}

/** Profiles columns required for public View Profile — never depend on optional follow cols. */
const PROFILE_SELECT =
  "id, full_name, username, avatar_url, verified, role, created_at, account_status, deleted_at, suspended_at";

/** SSOT: PRODUCT.seller_id → STORE */
export async function getStoreBySellerId(sellerId: string): Promise<StoreRecord | null> {
  if (!isStoreId(sellerId)) return null;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", sellerId.trim())
    .maybeSingle();
  if (!profile) return null;
  return loadStoreFromProfile(profile);
}

/** SSOT: store_slug → STORE (profiles.username is the public store_slug column) */
export async function getStoreBySlug(storeSlug: string): Promise<StoreRecord | null> {
  if (!isStoreSlug(storeSlug)) return null;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("username", storeSlug.trim().toLowerCase())
    .maybeSingle();
  if (!profile) return null;
  return loadStoreFromProfile(profile);
}

/**
 * Dynamic route param → STORE.
 * UUID ⇒ seller_id / store_id. Else ⇒ store_slug.
 */
export async function resolveStoreByRouteParam(
  param: string,
): Promise<StoreRecord | null> {
  const value = param?.trim() ?? "";
  if (!value) return null;
  if (isStoreId(value)) {
    return getStoreBySellerId(value);
  }
  return getStoreBySlug(value);
}

export function storeMemberSinceLabel(iso: string): string {
  return formatMemberSince(iso);
}
