import type { FlatCategoryPath } from "@/lib/categories/types";
import type { AiCameraAnalysisResult } from "@/lib/ai-camera/types";
import type { SellListingMode } from "@/lib/profile/account";
import type { ShippingMethod } from "@/lib/shipping/carriers";
import { clampInventory } from "@/lib/sell/inventory";
import { validateListingTitle } from "@/lib/sell/listing-title";

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

export type SellListingDraft = {
  photos: SellPhoto[];
  categoryPath: FlatCategoryPath | null;

  listingType: ListingType;

  title: string;
  description: string;

  brand: string;
  color: string;
  material: string;
  size: string;

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

  locationCity: string | null;

  analysis: AiCameraAnalysisResult | null;
};

export const SELL_CONDITIONS = [
  "New with Tags",
  "New",
  "Like New",
  "Very Good",
  "Good",
  "Fair",
] as const;

export type SellCondition = (typeof SELL_CONDITIONS)[number];

export function createEmptyDraft(): SellListingDraft {
  return {
    photos: [],
    categoryPath: null,

    listingType: "fixed",

    title: "",
    description: "",

    brand: "",
    color: "",
    material: "",
    size: "",

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

    locationCity: null,

    analysis: null,
  };
}

export type ListingValidationField =
  | "photos"
  | "title"
  | "description"
  | "category"
  | "price"
  | "condition"
  | "shippingMethod"
  | "stock"
  | "location";

export type ListingValidationErrors = Partial<Record<ListingValidationField, string>>;

export type ListingValidationOptions = {
  mode?: SellListingMode;
  /** When false, validation errors are omitted until blur or publish. */
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

function collectListingValidationErrors(
  draft: SellListingDraft,
  mode: SellListingMode,
): ListingValidationErrors {
  const errors: ListingValidationErrors = {};

  if (!hasValidPhotos(draft)) {
    errors.photos = draft.photos.some((photo) => photo.uploading)
      ? "Wait for photos to finish uploading."
      : "Add at least one photo.";
  }

  const titleError = validateListingTitle(draft.title, { required: true });
  if (titleError) {
    errors.title = titleError;
  }

  if (draft.description.trim().length < 10) {
    errors.description = "Description must be at least 10 characters.";
  }

  if (!draft.categoryPath) {
    errors.category = "Select a category.";
  }

  if (!draft.condition) {
    errors.condition = "Select the item condition.";
  }

  const stock = clampInventory(draft.stock);
  if (stock < 1) {
    errors.stock = "Quantity must be at least 1.";
  }

  if (mode === "quick" && !draft.shippingMethod) {
    errors.shippingMethod = "Select a delivery option.";
  }

  if (!hasValidPrice(draft)) {
    errors.price = "Enter a price greater than zero.";
  }

  if (!draft.locationCity?.trim()) {
    errors.location = "Choose your city.";
  }

  return errors;
}

export function getListingValidationErrors(
  draft: SellListingDraft,
  options?: ListingValidationOptions,
): ListingValidationErrors {
  if (!options?.showErrors) return {};
  return collectListingValidationErrors(draft, options?.mode ?? "advanced");
}

export function isListingValid(
  draft: SellListingDraft,
  options?: ListingValidationOptions,
): boolean {
  return Object.keys(collectListingValidationErrors(draft, options?.mode ?? "advanced")).length === 0;
}
