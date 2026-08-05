import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Tables } from "@/lib/supabase/types/database";
import { searchListings as searchListingsRepo } from "@/lib/listings/repository";
import { compareHomepageFeedProducts, computeHomepagePriorityScore } from "@/lib/homepage/feed-ranking";
import {
  buildShowcaseSellerSections,
  enrichShowcaseSellerSections,
  type ShowcaseSellerSection,
} from "@/lib/homepage/showcase-sellers";
import { HomepageEligibility } from "@/lib/homepage/homepage-eligibility";
import { applyHolidayModeVisibilityFilter } from "@/lib/listings/holiday-mode-visibility-v1";
import { isSellerOnVacation } from "@/lib/settings/vacation";
import { isPromotionActive } from "@/lib/promotions/format";
import { refreshExpiredPromotions } from "@/lib/promotions/service";
import { resolveTransactionModeMapForCategoryIds } from "@/lib/transaction-mode/server";
import { DEFAULT_TRANSACTION_MODE } from "@/lib/transaction-mode/types";
import { toProductDetail } from "@/lib/products/detail";
import { resolveProductInformationValuesV1 } from "@/lib/product-detail/parse-listing-attribute-notes-v1";
import { resolveProductLocationCity, stripListingLocationMarker } from "@/lib/sell/listing-location";
import { resolveCardImageSources } from "@/lib/media/product-image";
import { isForbiddenMarketplaceInventory } from "@/lib/listings/forbidden-marketplace-inventory";
import type {
  DeliveryCarrier,
  Product,
  ProductDetail,
  ProductSection,
  ProductsPage,
} from "@/lib/products/types";

const PAGE_SIZE = 8;
const HOMEPAGE_FEED_PAGE_SIZE = 12;

type ProductRow = Tables<"products"> & {
  profiles: Pick<
    Tables<"profiles">,
    "full_name" | "avatar_url" | "verified" | "username" | "email" | "account_status" | "role"
  > | null;
  product_images: Pick<
    Tables<"product_images">,
    "url" | "thumbnail_url" | "sort_order" | "is_primary"
  >[];
  brands: Pick<Tables<"brands">, "name"> | null;
};

const PRODUCT_SELECT = `
  *,
  profiles!products_seller_id_fkey ( full_name, avatar_url, verified, username, email, account_status, role ),
  product_images ( url, thumbnail_url, sort_order, is_primary ),
  brands ( name )
`;

function primaryCardImages(row: ProductRow) {
  const sorted = [...(row.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  // Cards prefer the 400px thumbnail; imageFullUrl keeps product_images.url for
  // one-shot client fallback when the thumb object is missing/invalid.
  const primary = sorted[0];
  const url = primary?.url ?? null;
  const rawThumb = primary?.thumbnail_url ?? null;
  const thumbIsDerived =
    Boolean(rawThumb?.trim()) &&
    Boolean(url?.trim()) &&
    rawThumb !== url &&
    /-thumb\./i.test(rawThumb ?? "");
  // Collapse invalid derived -thumb refs before resolve (avoids `/_next/image` 400).
  return resolveCardImageSources(thumbIsDerived ? url : rawThumb, url);
}

function deriveTrustScore(rating: number, verified: boolean): number {
  const base = Math.round(45 + rating * 11);
  return Math.min(100, verified ? base + 5 : base);
}

function mapProductRow(row: ProductRow, transactionMode = DEFAULT_TRANSACTION_MODE): Product {
  const verified = row.profiles?.verified ?? false;
  const rating = Number(row.rating);
  const cardImages = primaryCardImages(row);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : null,
    condition: row.condition,
    brand: row.brands?.name,
    colour: row.color?.trim() || null,
    size: row.size?.trim() || null,
    sellerName: row.profiles?.full_name ?? "Seller",
    sellerId: row.seller_id,
    sellerUsername: row.profiles?.username ?? null,
    sellerEmail: row.profiles?.email ?? null,
    sellerAvatar: row.profiles?.avatar_url,
    sellerVerified: verified,
    sellerAccountStatus: row.profiles?.account_status ?? null,
    sellerRole: row.profiles?.role ?? null,
    sellerTrustScore: deriveTrustScore(rating, verified),
    sellerResponseRate: Math.min(100, Math.round(70 + rating * 6)),
    location: resolveProductLocationCity(row.location_city, row.description),
    listingType: row.listing_type ?? "fixed",
    acceptOffers: Boolean(row.accept_offers),
    auctionEndsAt: row.auction_ends_at,
    auctionCurrentBid:
      row.listing_type === "auction" && row.auction_start_price != null
        ? Number(row.auction_start_price)
        : null,
    rating,
    reviewCount: row.review_count,
    views: row.views,
    likes: row.likes,
    imageUrl: cardImages.imageUrl,
    imageFullUrl: cardImages.imageFullUrl,
    imageCount: row.product_images?.length ?? 0,
    sections: (row.sections ?? []) as Product["sections"],
    isFeatured: isPromotionActive(row.featured_until),
    isBumped: isPromotionActive(row.bumped_until),
    promotionScore: row.promotion_score ?? undefined,
    createdAt: row.created_at,
    categoryId: row.category_id,
    description: row.description ?? undefined,
    moderationStatus: row.moderation_status,
    transactionMode,
    freeDelivery: row.shipping_price === 0,
    shippingPrice: row.shipping_price != null ? Number(row.shipping_price) : null,
    stock: Number(row.stock ?? 0),
  };
}

async function attachTransactionModes<T extends Product>(products: T[]): Promise<T[]> {
  const modeMap = await resolveTransactionModeMapForCategoryIds(
    products.map((product) => product.categoryId),
  );
  return products.map((product) => ({
    ...product,
    transactionMode: product.categoryId
      ? (modeMap.get(product.categoryId) ?? DEFAULT_TRANSACTION_MODE)
      : DEFAULT_TRANSACTION_MODE,
  }));
}

async function enrichProductsWithTrust(products: Product[]): Promise<Product[]> {
  const sellerIds = [...new Set(products.map((product) => product.sellerId).filter(Boolean))] as string[];
  if (sellerIds.length === 0) {
    return products;
  }

  try {
    const { tryCreateAdminClient } = await import("@/lib/supabase/admin");
    const admin = tryCreateAdminClient();
    if (!admin) {
      return products;
    }
    const { data } = await admin
      .from("trust_scores")
      .select("user_id, score, tier, factors_snapshot")
      .in("user_id", sellerIds);

    const trustBySeller = new Map(
      (data ?? []).map((row) => [
        String(row.user_id),
        {
          score: Number(row.score),
          tier: String(row.tier ?? "silver"),
          responseRate:
            row.factors_snapshot &&
            typeof row.factors_snapshot === "object" &&
            "responseRate" in row.factors_snapshot
              ? Number((row.factors_snapshot as { responseRate?: number }).responseRate ?? 0)
              : null,
        },
      ]),
    );

    return products.map((product) => {
      if (!product.sellerId) return product;
      const trust = trustBySeller.get(product.sellerId);
      if (!trust) return product;

      return {
        ...product,
        sellerTrustScore: trust.score,
        sellerTier: trust.tier,
        sellerResponseRate:
          trust.responseRate && trust.responseRate > 0
            ? Math.round(trust.responseRate)
            : product.sellerResponseRate,
      };
    });
  } catch {
    return products;
  }
}

function productAvailability(
  stock: number,
  lowStockAlert: number,
): ProductDetail["availability"] {
  if (stock <= 0) return "out_of_stock";
  if (stock <= lowStockAlert) return "low_stock";
  return "in_stock";
}

function mapProductDetail(row: ProductRow, transactionMode = DEFAULT_TRANSACTION_MODE): ProductDetail {
  const product = mapProductRow(row, transactionMode);
  const images = [...(row.product_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => image.url);

  const detail = toProductDetail(product);
  const isSold = row.status === "sold";
  const description = stripListingLocationMarker(row.description) || detail.description;
  const attrs = resolveProductInformationValuesV1({
    colour: product.colour,
    material: product.material,
    size: product.size,
    description,
  });
  return {
    ...detail,
    images: images.length > 0 ? images : detail.images,
    description,
    colour: attrs.colour ?? product.colour ?? null,
    material: attrs.material ?? null,
    size: attrs.size ?? product.size ?? null,
    storage: attrs.storage ?? null,
    network: attrs.network ?? null,
    season: attrs.season ?? null,
    compatibility: attrs.compatibility ?? null,
    deliveryCarriers: (row.delivery_carriers ?? detail.deliveryCarriers) as DeliveryCarrier[],
    freeDelivery: row.shipping_price === 0,
    shippingPrice: row.shipping_price != null ? Number(row.shipping_price) : null,
    salesCount: Math.max(1, row.review_count),
    stock: isSold ? 0 : row.stock,
    availability: isSold ? "out_of_stock" : productAvailability(row.stock, row.low_stock_alert),
    status: row.status,
    sellerId: row.seller_id,
    sellerUsername: row.profiles?.username ?? null,
    categoryId: row.category_id,
    transactionMode,
    acceptOffers: Boolean(row.accept_offers),
  };
}

export async function getProductsBySection(
  section: ProductSection,
  page = 1,
): Promise<ProductsPage> {
  if (!isSupabaseConfigured()) {
    return { items: [], page, hasMore: false };
  }

  // Kick off promotion maintenance without blocking the read. The queries below
  // already exclude expired promotions via `featured_until`/`bumped_until` > now,
  // so the read result is identical whether or not this RPC has finished — the
  // RPC only tidies status columns. Awaiting it here previously serialized ~110ms
  // in front of every section fetch on the homepage's critical path.
  void refreshExpiredPromotions();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const now = new Date().toISOString();

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .eq("status", "published")
    .eq("is_demo", false)
    .gt("stock", 0);

  if (section === "trending") {
    query = query
      .gt("bumped_until", now)
      .order("last_bumped_at", { ascending: false });
  } else if (section === "auctions") {
    return { items: [], page, hasMore: false };
  } else if (section === "recommended") {
    query = query
      .gt("featured_until", now)
      .order("promotion_score", { ascending: false })
      .order("featured_until", { ascending: false });
  } else if (section === "popular") {
    query = query.order("views", { ascending: false }).order("created_at", { ascending: false });
  } else {
    query = query
      .contains("sections", [section])
      .order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw error;
  }

  let rawRows = (data as ProductRow[] | null) ?? [];
  let total = count ?? 0;

  if (rawRows.length === 0 && page === 1 && section === "popular") {
    const fallback = await supabase
      .from("products")
      .select(PRODUCT_SELECT, { count: "exact" })
      .eq("status", "published")
      .eq("is_demo", false)
      .order("views", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (fallback.error) {
      throw fallback.error;
    }

    rawRows = (fallback.data as ProductRow[] | null) ?? [];
    total = fallback.count ?? rawRows.length;
  }

  if (rawRows.length === 0 && page === 1 && !["new", "popular", "auctions"].includes(section)) {
    const fallback = await supabase
      .from("products")
      .select(PRODUCT_SELECT, { count: "exact" })
      .eq("status", "published")
      .eq("is_demo", false)
      .contains("sections", [section])
      .order("created_at", { ascending: false })
      .range(from, to);

    if (fallback.error) {
      throw fallback.error;
    }

    rawRows = (fallback.data as ProductRow[] | null) ?? [];
    total = fallback.count ?? rawRows.length;
  }

  const visibleRows = await applyHolidayModeVisibilityFilter(supabase, rawRows);
  const mapped = visibleRows.map((row) => mapProductRow(row));
  const withModes = await attachTransactionModes(mapped);
  const enriched = await enrichProductsWithTrust(withModes);
  const items = HomepageEligibility.filterProducts(enriched);

  return {
    items,
    page,
    hasMore: from + items.length < total,
  };
}

/** Canonical homepage marketplace feed — single query, priority-ranked All Listings. */
export async function getHomepageFeed(page = 1): Promise<ProductsPage> {
  if (!isSupabaseConfigured()) {
    return { items: [], page, hasMore: false };
  }

  void refreshExpiredPromotions();

  const supabase = await createClient();
  const pageSize = HOMEPAGE_FEED_PAGE_SIZE;
  const targetFrom = (page - 1) * pageSize;
  let scanFrom = targetFrom;
  const eligibleRows: ProductRow[] = [];
  let exhausted = false;

  while (eligibleRows.length < pageSize && !exhausted) {
    const scanTo = scanFrom + pageSize * 3 - 1;
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("status", "published")
      .eq("is_demo", false)
      .gt("stock", 0)
      .order("promotion_score", { ascending: false })
      .order("created_at", { ascending: false })
      .order("views", { ascending: false })
      .range(scanFrom, scanTo);

    if (error) {
      /* Past-end range → empty page (never surface PGRST103 as 500). */
      if (error.code === "PGRST103") {
        exhausted = true;
        break;
      }
      throw error;
    }

    const batch = (data as ProductRow[] | null) ?? [];
    if (!batch.length) {
      exhausted = true;
      break;
    }

    const visibleBatch = await applyHolidayModeVisibilityFilter(supabase, batch);
    for (const row of visibleBatch) {
      if (HomepageEligibility.isRowEligible(row)) {
        eligibleRows.push(row);
        if (eligibleRows.length >= pageSize) break;
      }
    }

    scanFrom += pageSize * 3;
    if (batch.length < pageSize * 3) {
      exhausted = true;
    }
  }

  const mapped = eligibleRows.slice(0, pageSize).map((row) => mapProductRow(row));
  const withModes = await attachTransactionModes(mapped);
  const enriched = await enrichProductsWithTrust(withModes);
  const items = HomepageEligibility.filterProducts(
    enriched.map((product) => ({
      ...product,
      homepagePriorityScore: computeHomepagePriorityScore(product),
    })),
  ).sort(compareHomepageFeedProducts);

  /* Empty page or exhausted scan → stop pagination (never infinite hasMore). */
  if (items.length === 0) {
    return { items: [], page, hasMore: false };
  }

  return {
    items,
    page,
    hasMore: items.length >= pageSize && !exhausted,
  };
}

/** Paid Featured Store sellers — all active listings per seller, newest first. */
export async function getShowcaseSellerSections(): Promise<ShowcaseSellerSection[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  void refreshExpiredPromotions();

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: anchorRows, error: anchorError } = await supabase
    .from("products")
    .select("seller_id")
    .eq("status", "published")
    .eq("is_demo", false)
    .gt("featured_until", now);

  if (anchorError || !anchorRows?.length) {
    return [];
  }

  const featuredSellerIds = [
    ...new Set(anchorRows.map((row) => row.seller_id).filter(Boolean)),
  ] as string[];

  if (featuredSellerIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "published")
    .eq("is_demo", false)
    .gt("stock", 0)
    .in("seller_id", featuredSellerIds)
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    return [];
  }

  const rows = HomepageEligibility.filterEligibleRows(
    await applyHolidayModeVisibilityFilter(supabase, data as ProductRow[]),
  );
  const mapped = rows.map((row) => mapProductRow(row));
  const withModes = await attachTransactionModes(mapped);
  const enriched = await enrichProductsWithTrust(withModes);
  const sections = buildShowcaseSellerSections(enriched, {
    featuredSellerIds: new Set(featuredSellerIds),
  });

  return enrichShowcaseSellerSections(sections);
}

// Wrapped in React.cache so the listing page's generateMetadata() and the page
// component share a single query per request instead of fetching the product
// twice (a duplicate DB round-trip on every listing view).
export const getProductBySlug = cache(async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_demo", false)
    // Sold remains publicly readable for the canonical SOLD Product Page (never Store unavailable).
    .in("status", ["published", "draft", "paused", "sold"])
    .maybeSingle();

  let row = (!error && data ? (data as ProductRow) : null);

  // Pre-migration / RLS lag: sold PDP must stay public — never Store unavailable.
  if (!row) {
    const admin = tryCreateAdminClient();
    if (admin) {
      const soldLookup = await admin
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("slug", slug)
        .eq("is_demo", false)
        .eq("status", "sold")
        .maybeSingle();
      if (!soldLookup.error && soldLookup.data) {
        row = soldLookup.data as ProductRow;
      }
    }
  }

  if (!row) {
    return null;
  }

  if (
    isForbiddenMarketplaceInventory({
      slug: row.slug,
      title: row.title,
      description: row.description,
    })
  ) {
    return null;
  }

  let mode = DEFAULT_TRANSACTION_MODE;
  if (row.category_id) {
    try {
      mode =
        (await resolveTransactionModeMapForCategoryIds([row.category_id])).get(row.category_id) ??
        DEFAULT_TRANSACTION_MODE;
    } catch {
      mode = DEFAULT_TRANSACTION_MODE;
    }
  }

  const detail = mapProductDetail(row, mode);
  const withRating = await enrichProductDetailWithSellerRating(detail);
  try {
    const onHoliday = await isSellerOnVacation(supabase, withRating.sellerId);
    if (!onHoliday) return withRating;
    return { ...withRating, sellerOnHoliday: true };
  } catch {
    return withRating;
  }
});

async function enrichProductDetailWithSellerRating(
  detail: ProductDetail,
): Promise<ProductDetail> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("seller_profiles")
      .select("rating, review_count")
      .eq("id", detail.sellerId)
      .maybeSingle();

    if (!data) return detail;

    return {
      ...detail,
      sellerRating: Number(data.rating ?? 0),
      sellerReviewCount: Number(data.review_count ?? 0),
    };
  } catch {
    return detail;
  }
}

/**
 * Checkout Session owner may load a reserved listing during the Absolute Law window.
 * Do not use on public listing pages.
 */
export const getProductBySlugForCheckout = cache(async function getProductBySlugForCheckout(
  slug: string,
): Promise<ProductDetail | null> {
  const admin = tryCreateAdminClient();
  if (admin) {
    const { data, error } = await admin
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("is_demo", false)
      .in("status", ["published", "draft", "paused", "reserved"])
      .maybeSingle();
    if (!error && data) {
      const row = data as ProductRow;
      if (
        isForbiddenMarketplaceInventory({
          slug: row.slug,
          title: row.title,
          description: row.description,
        })
      ) {
        return null;
      }
      let mode = DEFAULT_TRANSACTION_MODE;
      if (row.category_id) {
        try {
          mode =
            (await resolveTransactionModeMapForCategoryIds([row.category_id])).get(
              row.category_id,
            ) ?? DEFAULT_TRANSACTION_MODE;
        } catch {
          mode = DEFAULT_TRANSACTION_MODE;
        }
      }
      return enrichProductDetailWithSellerRating(mapProductDetail(row, mode));
    }
  }

  return getProductBySlug(slug);
});

export async function getSimilarProducts(slug: string, limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("products")
    .select("id, category_id, brand_id")
    .eq("slug", slug)
    .eq("is_demo", false)
    .maybeSingle();

  if (!current) {
    return [];
  }

  // Route through the canonical eligibility resolver so Similar Items obeys the
  // exact same public-visibility rules as Homepage/Search/Category.
  const { getEligibleListings } = await import("@/lib/listings/eligible-listings");
  const result = await getEligibleListings({
    surface: "similar",
    excludeSlug: slug,
    categoryIds: current.category_id ? [current.category_id] : undefined,
    page: 1,
    pageSize: limit,
  });
  return result.items;
}

export async function searchProducts(query: string, page = 1, pageSize = PAGE_SIZE) {
  return searchListingsRepo({
    query,
    page,
    pageSize,
    sort: "newest",
  });
}

export async function countSearchProducts(query: string): Promise<number> {
  const result = await searchListingsRepo({ query, page: 1, pageSize: 1 });
  return result.total;
}
