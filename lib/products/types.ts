export type ProductSection = "trending" | "new" | "recommended";

export type DeliveryCarrier = "Royal Mail" | "Evri" | "DPD" | "InPost";

export type Product = {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  condition: string;
  brand?: string;
  sellerName: string;
  sellerAvatar?: string | null;
  sellerVerified?: boolean;
  rating: number;
  reviewCount: number;
  views?: number;
  likes?: number;
  imageUrl: string;
  sections: ProductSection[];
  isFeatured?: boolean;
  isBumped?: boolean;
};

export type ProductDetail = Product & {
  images: string[];
  description: string;
  salesCount: number;
  deliveryCarriers: DeliveryCarrier[];
  stock: number;
  availability: "in_stock" | "low_stock" | "out_of_stock";
  sellerId: string;
};

export type ProductsPage = {
  items: Product[];
  page: number;
  hasMore: boolean;
};
