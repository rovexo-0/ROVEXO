/**
 * Public Listing GET foundation — Native Listing Detail data only.
 *
 * Canonical source: getProductBySlug() in lib/products/repository.ts
 * Endpoint: GET /api/listing/[slug]
 *
 * Does not record Page View. Does not replace seller GET /api/listings/[id].
 * Does not implement Native Listing Detail UI.
 */

import type { CategoryBreadcrumb } from "@/lib/categories/navigation";
import { toPublicProductDocument } from "@/lib/products/public-product-contract-v1";
import type { DeliveryCarrier, ProductDetail } from "@/lib/products/types";
import type { ProductStatus } from "@/lib/supabase/types/database";
import type { TransactionMode } from "@/lib/transaction-mode/types";

export const PUBLIC_LISTING_GET_ENDPOINT = "/api/listing/[slug]" as const;
export const PUBLIC_LISTING_GET_SOURCE = "getProductBySlug" as const;

/** Keys that must never appear on the public listing JSON contract. */
export const PUBLIC_LISTING_EXCLUDED_KEYS = [
  "sellerEmail",
  "fullName",
  "sellerAccountStatus",
  "sellerRole",
  "moderationStatus",
  "sellerTrustScore",
  "sellerTier",
  "sellerResponseRate",
  "promotionScore",
  "homepagePriorityScore",
] as const;

export type PublicListingDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  condition: string;
  brand?: string;
  colour: string | null;
  material: string | null;
  size: string | null;
  storage: string | null;
  network: string | null;
  season: string | null;
  compatibility: string | null;
  images: string[];
  imageUrl: string;
  views: number;
  rating: number;
  reviewCount: number;
  sellerId: string;
  sellerName: string;
  sellerUsername: string | null;
  sellerAvatar: string | null;
  sellerVerified: boolean;
  sellerRating?: number;
  sellerReviewCount?: number;
  sellerOnHoliday: boolean;
  listingType?: string;
  acceptOffers: boolean;
  auctionEndsAt: string | null;
  auctionCurrentBid: number | null;
  transactionMode: TransactionMode;
  categoryId: string | null;
  categoryBreadcrumbs?: CategoryBreadcrumb[];
  createdAt: string | null;
  stock: number;
  availability: ProductDetail["availability"];
  status?: ProductStatus;
  freeDelivery: boolean;
  shippingPrice: number | null;
  deliveryCarriers: DeliveryCarrier[];
  salesCount: number;
};

function optionalString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Stable public JSON for Native Listing Detail.
 * Allowlists fields already returned by the Web getProductBySlug() public document.
 */
export function toPublicListingDetailDocument(product: ProductDetail): PublicListingDetail {
  const publicProduct = toPublicProductDocument(product);
  const listing: PublicListingDetail = {
    id: publicProduct.id,
    slug: publicProduct.slug,
    title: publicProduct.title,
    description: publicProduct.description,
    price: publicProduct.price,
    originalPrice: publicProduct.originalPrice ?? null,
    condition: publicProduct.condition,
    colour: publicProduct.colour ?? null,
    material: publicProduct.material ?? null,
    size: publicProduct.size ?? null,
    storage: publicProduct.storage ?? null,
    network: publicProduct.network ?? null,
    season: publicProduct.season ?? null,
    compatibility: publicProduct.compatibility ?? null,
    images: publicProduct.images.length > 0 ? publicProduct.images : [],
    imageUrl: publicProduct.imageUrl,
    views: publicProduct.views ?? 0,
    rating: publicProduct.rating,
    reviewCount: publicProduct.reviewCount,
    sellerId: publicProduct.sellerId,
    sellerName: publicProduct.sellerName,
    sellerUsername: publicProduct.sellerUsername ?? null,
    sellerAvatar: publicProduct.sellerAvatar ?? null,
    sellerVerified: Boolean(publicProduct.sellerVerified),
    sellerOnHoliday: publicProduct.sellerOnHoliday === true,
    acceptOffers: Boolean(publicProduct.acceptOffers),
    auctionEndsAt: publicProduct.auctionEndsAt ?? null,
    auctionCurrentBid: publicProduct.auctionCurrentBid ?? null,
    transactionMode: publicProduct.transactionMode,
    categoryId: publicProduct.categoryId ?? null,
    createdAt: publicProduct.createdAt ?? null,
    stock: publicProduct.stock,
    availability: publicProduct.availability,
    freeDelivery: publicProduct.freeDelivery === true,
    shippingPrice: publicProduct.shippingPrice ?? null,
    deliveryCarriers: publicProduct.deliveryCarriers,
    salesCount: publicProduct.salesCount,
  };

  const brand = optionalString(publicProduct.brand);
  if (brand) listing.brand = brand;
  if (publicProduct.sellerRating != null) listing.sellerRating = publicProduct.sellerRating;
  if (publicProduct.sellerReviewCount != null) {
    listing.sellerReviewCount = publicProduct.sellerReviewCount;
  }
  if (publicProduct.listingType) listing.listingType = publicProduct.listingType;
  if (publicProduct.status) listing.status = publicProduct.status;
  if (publicProduct.categoryBreadcrumbs?.length) {
    listing.categoryBreadcrumbs = publicProduct.categoryBreadcrumbs;
  }

  return listing;
}
