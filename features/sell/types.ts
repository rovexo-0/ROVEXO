import type { FlatCategoryPath } from "@/lib/categories/types";
import type { AiCameraAnalysisResult } from "@/lib/ai-camera/types";
import type { SellListingMode } from "@/lib/profile/account";
import type { ShippingMethod } from "@/lib/shipping/carriers";
import { CANONICAL_PARCEL_SIZES_V1 } from "@/lib/shipping/canonical-parcel-size-v1";
import { createEmptyUserModified, type UserModifiedFields } from "@/lib/sell/suggestion-field-lock";
import { isSellListingPublishable } from "@/lib/sell/sell-validation";
import { isDirectContactMode } from "@/lib/transaction-mode/capabilities";
import { resolveTransactionModeFromFlatPath } from "@/lib/transaction-mode/resolver";

export type SellView = "form" | "published";

export type SellPhoto = {
  id: string;
  file?: File;
  previewUrl: string;
  url?: string;
  thumbnailUrl?: string;
  storagePath?: string;
  thumbnailStoragePath?: string;
  uploaded?: boolean;
  uploading?: boolean;
  uploadError?: string;
  existingImageId?: string;
};

export type ListingType = "fixed" | "auction" | "live";

/** Maximum photos per listing (also enforced server-side in the API schema). */
export const SELL_PHOTO_MAX = 10;

/**
 * Cap a gallery/camera selection against the remaining listing photo slots.
 * Total listing max = SELL_PHOTO_MAX (not per-selection).
 */
export function capSellPhotoSelection<T>(existingCount: number, incoming: readonly T[]): T[] {
  const remaining = Math.max(0, SELL_PHOTO_MAX - existingCount);
  if (remaining === 0 || incoming.length === 0) return [];
  return incoming.slice(0, remaining) as T[];
}

/** Parcel size — V1.0 customer-facing: SMALL · MEDIUM · LARGE (EXTRA LARGE removed). */
export const PARCEL_SIZES = ["small", "medium", "large"] as const;
export type ParcelSize = (typeof PARCEL_SIZES)[number] | "xl";

export type ParcelSizeOption = {
  id: ParcelSize;
  label: string;
  description: string;
  recommended?: boolean;
};

/**
 * Sell Parcel Size options — customer-facing Sendcloud-derived catalogue.
 * Exactly SMALL · MEDIUM · LARGE. No EXTRA LARGE.
 */
export const PARCEL_SIZE_OPTIONS: ParcelSizeOption[] = CANONICAL_PARCEL_SIZES_V1.filter(
  (def) => def.customerFacing,
).map((def) => ({
  id: def.id,
  label: def.sellLabel,
  description: def.sellSubtitle,
}));

export type SellListingDraft = {
  photos: SellPhoto[];
  categoryPath: FlatCategoryPath | null;
  parcelSize: ParcelSize | null;

  listingType: ListingType;

  title: string;
  description: string;

  brand: string;
  color: string;
  material: string;
  size: string;

  /**
   * Category-specific optional attributes (Style, Model, Storage, RAM, …) that
   * have no dedicated listing column. Purely client-side draft state; on publish
   * these are folded into the description text (same additive pattern as
   * `material`), so the API/DB contract is unchanged.
   */
  attributes: Record<string, string>;

  condition: string;
  shippingMethod: ShippingMethod;

  price: string;

  auctionStartPrice: string;
  reservePrice: string;
  buyNowPrice: string;
  auctionEndsAt: string;

  liveEnabled: boolean;

  acceptOffers: boolean;

  stock: number;

  freeDelivery: boolean;

  /** Buyer can collect in person (shown when category supports it). */
  collectionEnabled: boolean;

  analysis: AiCameraAnalysisResult | null;

  /** Fields manually set by the seller — never overwritten by suggestions this session. */
  userModified: UserModifiedFields;
};

export const SELL_CONDITIONS = [
  "New (Unused)",
  "Used",
  "Like New",
  "Very Good",
  "Good",
  "Acceptable",
] as const;

export type SellCondition = (typeof SELL_CONDITIONS)[number];

export function createEmptyDraft(): SellListingDraft {
  return {
    photos: [],
    categoryPath: null,
    parcelSize: null,

    listingType: "fixed",

    title: "",
    description: "",

    brand: "",
    color: "",
    material: "",
    size: "",

    attributes: {},

    condition: "",
    shippingMethod: "delivery_available",

    price: "",

    auctionStartPrice: "",
    reservePrice: "",
    buyNowPrice: "",
    auctionEndsAt: "",

    liveEnabled: false,

    acceptOffers: true,

    stock: 1,

    freeDelivery: false,

    collectionEnabled: false,

    analysis: null,
    userModified: createEmptyUserModified(),
  };
}

export type ListingValidationField =
  | "photos"
  | "title"
  | "description"
  | "category"
  | "price"
  | "parcelSize";

export type ListingValidationErrors = Partial<Record<ListingValidationField, string>>;

export type ListingValidationOptions = {
  mode?: SellListingMode;
  /** Draft mode: false while typing. Publish mode: true on Publish click. */
  showErrors?: boolean;
};

function hasValidPhotos(draft: SellListingDraft): boolean {
  return (
    draft.photos.length > 0 &&
    draft.photos.every((photo) => photo.uploaded || photo.file) &&
    !draft.photos.some((photo) => photo.uploading)
  );
}

function hasValidPrice(draft: SellListingDraft): boolean {
  switch (draft.listingType) {
    case "fixed":
    case "live":
      return Number(draft.price) > 0;
    case "auction":
      return Number(draft.auctionStartPrice) >= 1 && draft.auctionEndsAt.trim().length > 0;
    default:
      return false;
  }
}

export function getListingValidationErrors(
  draft: SellListingDraft,
  options?: ListingValidationOptions,
): ListingValidationErrors {
  const errors: ListingValidationErrors = {};
  const showFieldErrors = options?.showErrors !== false;

  if (!hasValidPhotos(draft)) {
    errors.photos = draft.photos.some((photo) => photo.uploading)
      ? "Wait for photos to finish uploading."
      : "Add at least one photo.";
  }

  if (!showFieldErrors) {
    return errors;
  }

  if (draft.title.trim().length < 5) {
    errors.title = "Title must be at least 5 characters.";
  }

  if (draft.description.trim().length < 20) {
    errors.description = "Add a description (at least 20 characters).";
  }

  if (!draft.categoryPath) {
    errors.category = "Select a category.";
  }

  if (!hasValidPrice(draft)) {
    errors.price = "Enter a price greater than zero.";
  }

  const directContact = draft.categoryPath
    ? isDirectContactMode(resolveTransactionModeFromFlatPath(draft.categoryPath))
    : false;

  if (!directContact && draft.shippingMethod !== "collection_only" && !draft.parcelSize) {
    errors.parcelSize = "Select a parcel size.";
  }

  return errors;
}

export function isListingValid(
  draft: SellListingDraft,
  options?: ListingValidationOptions,
): boolean {
  if (options?.showErrors === false) {
    return Object.keys(getListingValidationErrors(draft, options)).length === 0;
  }
  return isSellListingPublishable(draft, {
    title: draft.title,
    description: draft.description,
  });
}
