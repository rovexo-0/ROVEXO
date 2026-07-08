import type { FlatCategoryPath } from "@/lib/categories/types";
import type { AiCameraAnalysisResult } from "@/lib/ai-camera/types";
import type { SellListingMode } from "@/lib/profile/account";
import type { ShippingMethod } from "@/lib/shipping/carriers";
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
export const SELL_PHOTO_MAX = 8;

/** Parcel size drives automatic shipping labels and courier pricing. */
export const PARCEL_SIZES = ["small", "medium", "large", "xl", "custom"] as const;
export type ParcelSize = (typeof PARCEL_SIZES)[number];

export type ParcelSizeOption = {
  id: ParcelSize;
  label: string;
  description: string;
  recommended?: boolean;
};

export const PARCEL_SIZE_OPTIONS: ParcelSizeOption[] = [
  {
    id: "small",
    label: "Small",
    description: "Fits a large letterbox — phone cases, jewellery, small accessories.",
  },
  {
    id: "medium",
    label: "Medium",
    description: "Shoebox size — clothing, shoes, books, small electronics.",
    recommended: true,
  },
  {
    id: "large",
    label: "Large",
    description: "Cabin-bag size — coats, homeware, larger bundles.",
  },
  {
    id: "xl",
    label: "Extra Large",
    description: "Bulky items — small furniture, large appliances, oversized parcels.",
  },
  {
    id: "custom",
    label: "Custom",
    description: "Non-standard size — we'll calculate courier pricing at checkout.",
  },
];

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

  analysis: AiCameraAnalysisResult | null;
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
    // "medium" is the recommended default (see PARCEL_SIZE_OPTIONS). Parcel size
    // is optional at the API/DB layer, so a valid default keeps a new listing
    // genuinely complete without forcing an extra tap before publishing.
    parcelSize: "medium",

    listingType: "fixed",

    title: "",
    description: "",

    brand: "",
    color: "",
    material: "",
    size: "",

    attributes: {},

    condition: "Used",
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

    analysis: null,
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

  if (draft.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters.";
  }

  if (draft.description.trim().length < 10) {
    errors.description = "Description must be at least 10 characters.";
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

  if (!directContact && !draft.parcelSize) {
    errors.parcelSize = "Select a parcel size.";
  }

  return errors;
}

export function isListingValid(
  draft: SellListingDraft,
  options?: ListingValidationOptions,
): boolean {
  return Object.keys(getListingValidationErrors(draft, options)).length === 0;
}
