import type { ProductStatus } from "@/lib/supabase/types/database";

export type ListingFilter =
  | "all"
  | "draft"
  | "paused"
  | "sold"
  | "out_of_stock"
  | "low_stock"
  | "published";

export type ListingImageInput = {
  url: string;
  thumbnailUrl?: string;
  storagePath: string;
  sortOrder: number;
  isPrimary: boolean;
};

export type ListingImage = ListingImageInput & {
  id: string;
};

export type SellerListing = {
  id: string;
  slug: string;
  title: string;
  description: string;
  locationCity: string | null;
  brand: string | null;
  brandId: string | null;
  categoryId: string | null;
  categoryPath: string | null;
  color: string | null;
  size: string | null;
  condition: string;
  price: number;
  acceptOffers: boolean;
  status: ProductStatus;
  stock: number;
  shippingMethod: import("@/lib/shipping/carriers").ShippingMethod | null;
  shippingPrice: number | null;
  freeDelivery: boolean;
  sku: string | null;
  lowStockAlert: number;
  views: number;
  likes: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  images: ListingImage[];
  createdAt: string;
  updatedAt: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
  bumpCount: number;
  promotionScore: number;
  lastBumpedAt: string | null;
  bumpedUntil: string | null;
  featuredUntil: string | null;
  isBumped: boolean;
  isFeatured: boolean;
  bumpRemainingLabel: string | null;
  featureRemainingLabel: string | null;
};

export type CreateListingInput = {
  sellerId: string;
  title: string;
  description: string;
  locationCity?: string | null;
  brand?: string;
  color?: string;
  size?: string;
  condition: string;
  price: number;
  acceptOffers: boolean;
  freeDelivery?: boolean;
  shippingMethod?: import("@/lib/shipping/carriers").ShippingMethod;
  shippingPrice?: number | null;
  categoryId?: string | null;
  deliveryCarriers?: string[];
  status?: ProductStatus;
  listingType?: "fixed" | "auction";
  auctionStartPrice?: number;
  reservePrice?: number | null;
  auctionEndsAt?: string | null;
  inventory?: {
    sku?: string | null;
    stock: number;
    lowStockAlert: number;
  };
  images: ListingImageInput[];
};

export type UpdateListingInput = Partial<Omit<CreateListingInput, "sellerId">> & {
  images?: ListingImageInput[];
  removeImageIds?: string[];
};

export type SearchListingsOptions = {
  query?: string;
  categorySlug?: string;
  categorySlugPath?: string[];
  categoryIds?: string[];
  brand?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  conditions?: string[];
  postedToday?: boolean;
  deliveryAvailable?: boolean;
  collectionOnly?: boolean;
  inStock?: boolean;
  locationCity?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
};

export type SearchListingsResult = {
  items: import("@/lib/products/types").Product[];
  total: number;
  page: number;
  hasMore: boolean;
};
