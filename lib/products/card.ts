import type { Product } from "@/lib/products/types";

type PromotionSurface = "homepage" | "search" | "category" | "listing" | "seller";

export function productToCardProps(
  product: Product,
  promotionSurface: PromotionSurface = "search",
) {
  return {
    href: `/listing/${product.slug}`,
    title: product.title,
    price: product.price,
    originalPrice: product.originalPrice,
    condition: product.condition,
    imageUrl: product.imageUrl,
    sellerName: product.sellerName,
    sellerAvatar: product.sellerAvatar,
    sellerVerified: product.sellerVerified,
    sellerTrustScore: product.sellerTrustScore,
    sellerTier: product.sellerTier,
    sellerResponseRate: product.sellerResponseRate,
    location: product.location,
    rating: product.rating,
    reviewCount: product.reviewCount,
    views: product.views,
    productId: product.id,
    productSlug: product.slug,
    promotionSurface,
    isFeatured: product.isFeatured,
    isBumped: product.isBumped,
    isNew: product.sections?.includes("new") ?? false,
    createdAt: product.createdAt,
    listingType: product.listingType,
    auctionEndsAt: product.auctionEndsAt,
    auctionCurrentBid: product.auctionCurrentBid,
  };
}
