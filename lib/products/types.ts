export type ProductSection = "trending" | "new" | "recommended" | "popular" | "auctions";

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
  sellerAvatar?: string | null;
  sellerVerified?: boolean;
  sellerTrustScore?: number;
  sellerTier?: string;
  sellerResponseRate?: number;
  location?: string;
  listingType?: string;
  auctionEndsAt?: string | null;
  auctionCurrentBid?: number | null;
  rating: number;
  reviewCount: number;
  views?: number;
  likes?: number;
  imageUrl: string;
  sections: ProductSection[];
  isFeatured?: boolean;
  isBumped?: boolean;
  createdAt?: string | null;
};

export type ProductDetail = Product & {
  images: string[];
  description: string;
  salesCount: number;
  deliveryCarriers: DeliveryCarrier[];
  freeDelivery?: boolean;
  stock: number;
  availability: "in_stock" | "low_stock" | "out_of_stock";
  sellerId: string;
  sellerUsername?: string | null;
  categoryId?: string | null;
};

export type ProductsPage = {
  items: Product[];
  page: number;
  hasMore: boolean;
};
