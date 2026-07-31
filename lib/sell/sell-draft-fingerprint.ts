import type { SellListingDraft } from "@/features/sell/types";

/** Stable fingerprint for unsaved-changes detection (Edit Listing). */
export function sellDraftFingerprint(
  draft: SellListingDraft,
  options?: {
    pendingTitle?: string;
    pendingDescription?: string;
    removedImageIds?: string[];
  },
): string {
  return JSON.stringify({
    title: (options?.pendingTitle ?? draft.title).trim(),
    description: (options?.pendingDescription ?? draft.description).trim(),
    price: draft.price,
    photos: draft.photos.map((photo) => photo.existingImageId ?? photo.id),
    removedImageIds: [...(options?.removedImageIds ?? [])].sort(),
    categoryId: draft.categoryPath?.categoryId ?? null,
    subcategoryId: draft.categoryPath?.subcategoryId ?? null,
    childCategoryId: draft.categoryPath?.childCategoryId ?? null,
    categoryPath: draft.categoryPath?.pathLabel ?? null,
    parcelSize: draft.parcelSize,
    brand: draft.brand,
    color: draft.color,
    size: draft.size,
    material: draft.material,
    condition: draft.condition,
    stock: draft.stock,
    acceptOffers: draft.acceptOffers,
    freeDelivery: draft.freeDelivery,
    shippingMethod: draft.shippingMethod,
    collectionEnabled: draft.collectionEnabled,
    attributes: draft.attributes,
  });
}
