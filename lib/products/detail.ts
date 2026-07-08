import type { DeliveryCarrier, Product, ProductDetail } from "@/lib/products/types";
import { DEFAULT_TRANSACTION_MODE } from "@/lib/transaction-mode/types";
import {
  OFFICIAL_DEMO_PRODUCT_IMAGES,
  resolveOfficialDemoProductImage,
} from "@/lib/media/official-demo-images";

const DEFAULT_CARRIERS: DeliveryCarrier[] = ["Royal Mail", "Evri", "DPD", "InPost"];

const GALLERY_BY_SLUG: Record<string, string[]> = {
  "nike-air-max-90": OFFICIAL_DEMO_PRODUCT_IMAGES.slice(0, 8),
};

const DESCRIPTION_BY_SLUG: Record<string, string> = {
  "nike-air-max-90":
    "Classic Nike Air Max 90 in white and blue. Worn twice with minimal creasing on the toe box.\n\n• Premium leather and mesh upper\n• Visible Air cushioning in the heel\n• Rubber outsole with durable traction\n• Original box and spare laces included\n\nComes with original box and charging cable.",
};

function buildGallery(product: Product): string[] {
  const curated = GALLERY_BY_SLUG[product.slug];
  if (curated) return curated;

  const images = [product.imageUrl];
  let poolIndex = 0;

  while (images.length < 8) {
    images.push(
      OFFICIAL_DEMO_PRODUCT_IMAGES[poolIndex % OFFICIAL_DEMO_PRODUCT_IMAGES.length] ??
        resolveOfficialDemoProductImage(`${product.slug}-${poolIndex}`),
    );
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
    sellerFollowerCount: Math.max(128, Math.round(product.reviewCount * 14)),
    freeDelivery: product.price >= 50,
    deliveryCarriers: DEFAULT_CARRIERS,
    sellerVerified: product.sellerVerified ?? product.rating >= 4.8,
    stock: 1,
    availability: "in_stock",
    sellerId: product.id,
    transactionMode: product.transactionMode ?? DEFAULT_TRANSACTION_MODE,
  };
}
