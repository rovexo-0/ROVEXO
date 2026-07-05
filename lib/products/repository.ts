import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Tables } from "@/lib/supabase/types/database";
import { searchListings as searchListingsRepo } from "@/lib/listings/repository";
import { compareHomepageFeedProducts, computeHomepagePriorityScore } from "@/lib/homepage/feed-ranking";
import { HomepageEligibility } from "@/lib/homepage/homepage-eligibility";
import { isPromotionActive } from "@/lib/promotions/format";
import { refreshExpiredPromotions } from "@/lib/promotions/service";
import { resolveTransactionModeMapForCategoryIds } from "@/lib/transaction-mode/server";
import { DEFAULT_TRANSACTION_MODE } from "@/lib/transaction-mode/types";
import { toProductDetail } from "@/lib/products/detail";
import { resolveProductLocationCity, stripListingLocationMarker } from "@/lib/sell/listing-location";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";
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

function primaryImage(row: ProductRow): string {
  const sorted = [...(row.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  // Cards render at ~176px, so prefer the pre-generated 400px thumbnail over the
  // full-resolution upload (up to 2000px). This ships a far smaller source to the
  // image optimizer and to the browser without any visual change.
  const primary = sorted[0];
  return primary?.thumbnail_url ?? primary?.url ?? PRODUCT_IMAGE_FALLBACK;
}

function deriveTrustScore(rating: number, verified: boolean): number {
  const base = Math.round(45 + rating * 11);
  return Math.min(100, verified ? base + 5 : base);
}

function mapProductRow(row: ProductRow, transactionMode = DEFAULT_TRANSACTION_MODE): Product {
  const verified = row.profiles?.verified ?? false;
  const rating = Number(row.rating);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : null,
    condition: row.condition,
    brand: row.brands?.name,
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
    auctionEndsAt: row.auction_ends_at,
    auctionCurrentBid:
      row.listing_type === "auction" && row.auction_start_price != null
        ? Number(row.auction_start_price)
        : null,
    rating,
    reviewCount: row.review_count,
    views: row.views,
    likes: row.likes,
    imageUrl: primaryImage(row),
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
  };
}

function rowToHomepageInput(row: ProductRow) {
  return HomepageEligibility.fromRow({
    slug: row.slug,
    title: row.title,
    description: row.description,
    status: row.status,
    price: Number(row.price),
    category_id: row.category_id,
    moderation_status: row.moderation_status,
    profiles: row.profiles,
    product_images: row.product_images,
  });
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

  const admin = createAdminClient();
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
  return {
    ...detail,
    images: images.length > 0 ? images : detail.images,
    description: stripListingLocationMarker(row.description) || detail.description,
    deliveryCarriers: (row.delivery_carriers ?? detail.deliveryCarriers) as DeliveryCarrier[],
    freeDelivery: row.shipping_price === 0,
    shippingPrice: row.shipping_price != null ? Number(row.shipping_price) : null,
    salesCount: Math.max(1, row.review_count),
    stock: row.stock,
    availability: productAvailability(row.stock, row.low_stock_alert),
    sellerId: row.seller_id,
    sellerUsername: row.profiles?.username ?? null,
    categoryId: row.category_id,
    transactionMode,
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
    .eq("status", "published");

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
      .contains("sections", [section])
      .order("created_at", { ascending: false })
      .range(from, to);

    if (fallback.error) {
      throw fallback.error;
    }

    rawRows = (fallback.data as ProductRow[] | null) ?? [];
    total = fallback.count ?? rawRows.length;
  }

  const mapped = rawRows.map((row) => mapProductRow(row));
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
  let totalPublished = 0;
  let exhausted = false;

  while (eligibleRows.length < pageSize && !exhausted) {
    const scanTo = scanFrom + pageSize * 3 - 1;
    const { data, error, count } = await supabase
      .from("products")
      .select(PRODUCT_SELECT, { count: scanFrom === targetFrom ? "exact" : undefined })
      .eq("status", "published")
      .order("promotion_score", { ascending: false })
      .order("created_at", { ascending: false })
      .order("views", { ascending: false })
      .range(scanFrom, scanTo);

    if (error) {
      throw error;
    }

    if (scanFrom === targetFrom) {
      totalPublished = count ?? 0;
    }

    const batch = (data as ProductRow[] | null) ?? [];
    if (!batch.length) {
      exhausted = true;
      break;
    }

    for (const row of batch) {
      if (HomepageEligibility.isEligible(rowToHomepageInput(row))) {
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

  const hiddenEstimate = Math.max(0, totalPublished - items.length);
  const hasMore = exhausted
    ? scanFrom < totalPublished || eligibleRows.length > pageSize
    : true;

  return {
    items,
    page,
    hasMore: hasMore || hiddenEstimate > 0,
  };
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
    .in("status", ["published", "draft", "paused"])
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as ProductRow;
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

  return mapProductDetail(row, mode);
});

export async function getSimilarProducts(slug: string, limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("products")
    .select("id, category_id, brand_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!current) {
    return [];
  }

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "published")
    .neq("slug", slug)
    .limit(limit);

  if (current.category_id) {
    query = query.eq("category_id", current.category_id);
  }

  const { data } = await query;
  const mapped = (data as ProductRow[] | null)?.map((row) => mapProductRow(row)) ?? [];
  return attachTransactionModes(mapped);
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
