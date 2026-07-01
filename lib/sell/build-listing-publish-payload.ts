import { deliveryCarriersForMethod } from "@/lib/sell/delivery";
import { clampInventory } from "@/lib/sell/inventory";
import { buildPublishDescription } from "@/lib/sell/publish-description";
import type { SellListingDraft, SellPhoto } from "@/features/sell/types";

/** Default low-stock alert when the sell form does not expose that field. */
export const LISTING_DEFAULT_LOW_STOCK_ALERT = 5;

export type ListingPublishPayload = {
  title: string;
  description: string;
  brand?: string;
  color?: string;
  size?: string;
  condition: string;
  price: number;
  acceptOffers: boolean;
  freeDelivery: boolean;
  shippingMethod: SellListingDraft["shippingMethod"];
  shippingPrice?: number;
  deliveryCarriers: string[];
  categoryPath: {
    categorySlug: string;
    subcategorySlug: string;
    childCategorySlug?: string;
    categorySlugs: string[];
  } | null;
  inventory: {
    stock: number;
    lowStockAlert: number;
  };
  images: Array<{
    url: string;
    thumbnailUrl: string;
    storagePath: string;
    sortOrder: number;
    isPrimary: boolean;
  }>;
};

export function parsePublishPrice(raw: string): number {
  const parsed = Number.parseFloat(String(raw).trim());
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Enter a price greater than zero.");
  }
  return parsed;
}

/** Build a POST /api/listings body with no undefined numeric fields. */
export function buildListingPublishPayload(
  draft: SellListingDraft,
  uploadedPhotos: SellPhoto[],
): ListingPublishPayload {
  const stock = clampInventory(draft.stock);
  const lowStockAlert = LISTING_DEFAULT_LOW_STOCK_ALERT;

  const payload: ListingPublishPayload = {
    title: draft.title.trim(),
    description: buildPublishDescription(draft.title, draft.description, draft.material),
    condition: draft.condition,
    price: parsePublishPrice(draft.price),
    acceptOffers: draft.acceptOffers,
    freeDelivery: draft.freeDelivery,
    shippingMethod: draft.shippingMethod,
    deliveryCarriers: deliveryCarriersForMethod(draft.shippingMethod),
    categoryPath: draft.categoryPath
      ? {
          categorySlug: draft.categoryPath.categorySlug,
          subcategorySlug: draft.categoryPath.subcategorySlug,
          childCategorySlug: draft.categoryPath.childCategorySlug,
          categorySlugs: draft.categoryPath.segments.map((segment) => segment.slug),
        }
      : null,
    inventory: {
      stock,
      lowStockAlert,
    },
    images: uploadedPhotos.map((photo, index) => ({
      url: photo.url!,
      thumbnailUrl: photo.thumbnailUrl ?? photo.url!,
      storagePath: photo.storagePath!,
      sortOrder: index,
      isPrimary: index === 0,
    })),
  };

  if (draft.brand.trim()) payload.brand = draft.brand.trim();
  if (draft.color.trim()) payload.color = draft.color.trim();
  if (draft.size.trim()) payload.size = draft.size.trim();
  if (draft.freeDelivery) payload.shippingPrice = 0;

  return payload;
}
