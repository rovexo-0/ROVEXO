import type { Product } from "@/lib/products/types";

export function productToCardProps(product: Product) {
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
    isFeatured: product.isFeatured,
  };
}
