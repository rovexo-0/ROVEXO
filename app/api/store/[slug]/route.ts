import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { optionalCookieOrBearerApiAuth } from "@/lib/auth/require-cookie-or-bearer-api-auth-v1";
import { getFollowCounts, isFollowing } from "@/lib/follow/marketplace-follow-store-v1";
import { getEligibleListings } from "@/lib/listings/eligible-listings";
import { HOLIDAY_MODE_PROFILE_EMPTY_MESSAGE } from "@/lib/listings/holiday-mode-visibility-v1";
import type { SearchListingsOptions } from "@/lib/listings/types";
import type { Product } from "@/lib/products/types";
import { resolveSellerAccountType } from "@/lib/store/resolve-seller-account-type-v1";
import {
  resolveStoreByRouteParam,
  storeMemberSinceLabel,
} from "@/lib/store/store-repository";

type RouteContext = { params: Promise<{ slug: string }> };

const PAGE_SIZE_DEFAULT = 24;
const PAGE_SIZE_MAX = 48;

function parsePositiveInt(raw: string | null, fallback: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.floor(value);
}

function parsePrice(raw: string | null): number | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return value;
}

function parseSort(raw: string | null): SearchListingsOptions["sort"] {
  if (raw === "price_asc" || raw === "price_desc" || raw === "newest") return raw;
  return "newest";
}

function toShopListingItem(product: Product) {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    price: product.price,
    condition: product.condition || null,
    sellerName: product.sellerName || null,
    sellerId: product.sellerId || null,
    sellerUsername: product.sellerUsername || null,
    sellerAvatar: product.sellerAvatar || null,
    sellerVerified: Boolean(product.sellerVerified),
    rating: product.rating,
    reviewCount: product.reviewCount,
    views: product.views ?? null,
    likes: product.likes ?? null,
    imageUrl: product.imageUrl,
    imageFullUrl: product.imageFullUrl ?? "",
    isFeatured: Boolean(product.isFeatured),
    isBumped: Boolean(product.isBumped),
    promotionScore: product.promotionScore ?? null,
    homepagePriorityScore: product.homepagePriorityScore ?? null,
    categoryId: product.categoryId ?? null,
    shippingPrice: product.shippingPrice ?? null,
    freeDelivery: Boolean(product.freeDelivery),
    stock: product.stock ?? null,
    size: product.size ?? null,
    brand: product.brand ?? null,
  };
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw?.replace(/\s+/g, " ").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function buildFacets(listings: Product[]) {
  const categories: Array<{ id: string; name: string }> = [];
  const seenCategory = new Set<string>();
  for (const listing of listings) {
    const id = listing.categoryId?.trim();
    if (!id || seenCategory.has(id)) continue;
    seenCategory.add(id);
    const crumb = listing.categoryBreadcrumbs?.at(-1);
    const name = crumb?.name?.trim();
    if (!name) continue;
    categories.push({ id, name });
  }
  return {
    conditions: uniqueStrings(listings.map((item) => item.condition)),
    brands: uniqueStrings(listings.map((item) => item.brand)),
    categories,
  };
}

export async function GET(request: Request, context: RouteContext) {
  const limited = await enforceRateLimit(request, "store-public", 120, 60_000);
  if (limited) return limited;

  const { slug: rawSlug } = await context.params;
  const slug = rawSlug?.trim() ?? "";
  if (!slug) {
    return NextResponse.json({ kind: "unavailable" }, { status: 404 });
  }

  const store = await resolveStoreByRouteParam(slug).catch(() => null);
  if (!store) {
    return NextResponse.json({ kind: "unavailable" }, { status: 404 });
  }

  const url = new URL(request.url);
  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const pageSize = Math.min(
    parsePositiveInt(url.searchParams.get("pageSize"), PAGE_SIZE_DEFAULT),
    PAGE_SIZE_MAX,
  );
  const sort = parseSort(url.searchParams.get("sort"));
  const brand = url.searchParams.get("brand")?.trim() || undefined;
  const categoryId = url.searchParams.get("categoryId")?.trim() || undefined;
  const minPrice = parsePrice(url.searchParams.get("minPrice"));
  const maxPrice = parsePrice(url.searchParams.get("maxPrice"));
  const conditions = uniqueStrings(
    (url.searchParams.get("conditions") ?? "")
      .split(",")
      .map((entry) => entry.trim()),
  );

  const viewer = await optionalCookieOrBearerApiAuth(request);
  const isOwnStore = viewer?.user.id === store.sellerId;

  const [listings, followCounts, viewerFollowing] = await Promise.all([
    getEligibleListings({
      surface: "seller",
      sellerId: store.sellerId,
      page,
      pageSize,
      sort,
      brand,
      categoryIds: categoryId ? [categoryId] : undefined,
      minPrice,
      maxPrice,
      conditions: conditions.length > 0 ? conditions : undefined,
      includeHolidayModeListings: isOwnStore,
    }).catch(() => null),
    getFollowCounts(store.sellerId).catch(() => ({
      followerCount: 0,
      followingCount: 0,
    })),
    viewer?.user.id && !isOwnStore
      ? isFollowing(viewer.user.id, store.sellerId).catch(() => false)
      : Promise.resolve(false),
  ]);

  const items = listings?.items ?? [];
  const facetSource = store.listings.length > 0 ? store.listings : items;

  return NextResponse.json({
    kind: "ok",
    handle: store.storeSlug || store.sellerId,
    seller: {
      sellerId: store.sellerId,
      storeSlug: store.storeSlug,
      storeName: store.storeName,
      avatarUrl: store.avatarUrl,
      verified: store.verified,
      bio: store.bio,
      rating: store.rating,
      reviewCount: store.reviewCount,
      holidayModeEnabled: store.holidayModeEnabled,
      memberSinceLabel: storeMemberSinceLabel(store.memberSinceIso),
      accountType: resolveSellerAccountType({
        businessName: store.businessName,
        businessType: store.businessType,
      }),
      businessName: store.businessName,
      businessType: store.businessType,
      businessVerified: store.businessVerified,
      businessDescription: store.businessDescription,
    },
    isOwnStore,
    isFollowing: Boolean(viewerFollowing),
    followerCount: followCounts.followerCount,
    followingCount: followCounts.followingCount,
    holidayEmptyMessage: store.holidayModeEnabled ? HOLIDAY_MODE_PROFILE_EMPTY_MESSAGE : null,
    items: items.map(toShopListingItem),
    page: listings?.page ?? page,
    hasMore: Boolean(listings?.hasMore),
    total: listings?.total ?? items.length,
    facets: buildFacets(facetSource),
  });
}
