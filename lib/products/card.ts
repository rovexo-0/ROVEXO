import type { Product } from "@/lib/products/types";

type PromotionSurface = "homepage" | "search" | "category" | "listing" | "seller";

export function productToCardProps(
  product: Product,
  promotionSurface: PromotionSurface = "search",
) {
  return {
    id: product.id,
    slug: product.slug,
    href: `/listing/${product.slug}`,
    title: product.title,
    price: product.price,
    originalPrice: product.originalPrice,
    condition: product.condition,
    imageUrl: product.imageUrl,
    sellerName: product.sellerName,
    rating: product.rating,
    reviewCount: product.reviewCount,
    views: product.views,
    productId: product.id,
    promotionSurface,
    isFeatured: product.isFeatured,
    isBumped: product.isBumped,
  };
}
