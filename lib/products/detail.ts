import type { DeliveryCarrier, Product, ProductDetail } from "@/lib/products/types";

const DEFAULT_CARRIERS: DeliveryCarrier[] = ["Royal Mail", "Evri", "DPD", "InPost"];

const GALLERY_BY_SLUG: Record<string, string[]> = {
  "nike-air-max-90": [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1606107557195-0a42c7a45aaa?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1575547868419-6467112a88d4?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1600185365926-3a95ce6639fd?w=800&h=1000&fit=crop",
  ],
};

const DESCRIPTION_BY_SLUG: Record<string, string> = {
  "nike-air-max-90":
    "Classic Nike Air Max 90 in white and blue. Worn twice with minimal creasing on the toe box. Clean midsole with no yellowing. Original box and spare laces included. Size UK 9 / EU 44. Ships within 24 hours with tracked delivery and buyer protection on every order.",
};

const GALLERY_POOL = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=1000&fit=crop",
  "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=1000&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e3685b?w=800&h=1000&fit=crop",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=1000&fit=crop",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=1000&fit=crop",
  "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&h=1000&fit=crop",
];

function buildGallery(product: Product): string[] {
  const curated = GALLERY_BY_SLUG[product.slug];
  if (curated) return curated;

  const images = [product.imageUrl];
  let poolIndex = 0;

  while (images.length < 8) {
    images.push(GALLERY_POOL[poolIndex % GALLERY_POOL.length]!);
    poolIndex += 1;
  }

  return images;
}

function buildDescription(product: Product): string {
  return (
    DESCRIPTION_BY_SLUG[product.slug] ??
    `${product.title}. Authentic pre-owned item from a trusted ROVEXO seller. Carefully inspected before listing. Packaged securely for tracked delivery. Message the seller for measurements, extra photos, or combined shipping options.`
  );
}

export function toProductDetail(product: Product): ProductDetail {
  return {
    ...product,
    images: buildGallery(product),
    description: buildDescription(product),
    salesCount: Math.max(1, Math.round(product.reviewCount * 0.65)),
    deliveryCarriers: DEFAULT_CARRIERS,
    sellerVerified: product.sellerVerified ?? product.rating >= 4.8,
    stock: 1,
    availability: "in_stock",
    sellerId: product.id,
  };
}
