import type { CategoryBreadcrumb } from "@/lib/categories/navigation";
import type { ProductStatus } from "@/lib/supabase/types/database";

export type ProductSection = "trending" | "new" | "recommended" | "popular" | "auctions";
export type { ProductStatus };

export type DeliveryCarrier =
  | "Royal Mail"
  | "Evri"
  | "DPD"
  | "UPS"
  | "FedEx"
  | "Parcelforce"
  | "InPost";

export type Product = {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  condition: string;
  brand?: string;
  sellerName: string;
  sellerId?: string;
  sellerUsername?: string | null;
  sellerEmail?: string | null;
  sellerAvatar?: string | null;
  sellerVerified?: boolean;
  sellerAccountStatus?: string | null;
  sellerRole?: string | null;
  sellerTrustScore?: number;
  sellerTier?: string;
  sellerResponseRate?: number;
  location?: string;
  listingType?: string;
  acceptOffers?: boolean;
  auctionEndsAt?: string | null;
  auctionCurrentBid?: number | null;
  rating: number;
  reviewCount: number;
  views?: number;
  likes?: number;
  imageUrl: string;
  imageCount?: number;
  sections: ProductSection[];
  isFeatured?: boolean;
  isBumped?: boolean;
  /** Stored DB promotion score (bump/feature windows). */
  promotionScore?: number;
  /** Unified homepage feed ranking score (includes badges + trust signals). */
  homepagePriorityScore?: number;
  createdAt?: string | null;
  categoryId?: string | null;
  categoryBreadcrumbs?: CategoryBreadcrumb[];
  description?: string;
  moderationStatus?: string | null;
  transactionMode?: import("@/lib/transaction-mode/types").TransactionMode;
  /** Absolute Total Price Law — listing shipping for TOTAL INCL. */
  freeDelivery?: boolean;
  shippingPrice?: number | null;
  /** Available units (`products.stock`). */
  stock?: number;
};

export type ProductDetail = Product & {
  images: string[];
  description: string;
  salesCount: number;
  deliveryCarriers: DeliveryCarrier[];
  freeDelivery?: boolean;
  shippingPrice?: number | null;
  stock: number;
  availability: "in_stock" | "low_stock" | "out_of_stock";
  /** Public listing lifecycle — sold remains publicly viewable (SOLD PDP). */
  status?: ProductStatus;
  sellerId: string;
  sellerUsername?: string | null;
  categoryId?: string | null;
  transactionMode: import("@/lib/transaction-mode/types").TransactionMode;
  acceptOffers?: boolean;
  /** Seller reputation from seller_profiles (not listing aggregates). */
  sellerRating?: number;
  sellerReviewCount?: number;
};

export type ProductsPage = {
  items: Product[];
  page: number;
  hasMore: boolean;
};
