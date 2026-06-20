import type { FlatCategoryPath } from "@/lib/categories/types";
import type { AiCameraAnalysisResult } from "@/lib/ai-camera/types";
import { isInventoryValid } from "@/lib/sell/inventory";

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
  size: string;

  condition: string;

  // Fixed Price
  price: string;

  // Auction
  auctionStartPrice: string;
  reservePrice: string;
  buyNowPrice: string;
  auctionEndsAt: string;

  // Live
  liveEnabled: boolean;

  acceptOffers: boolean;

  sku: string;
  stock: number;
  lowStockAlert: number;

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
    size: "",

    condition: "",

    price: "",

    auctionStartPrice: "",
    reservePrice: "",
    buyNowPrice: "",
    auctionEndsAt: "",

    liveEnabled: false,

    acceptOffers: true,

    sku: "",
    stock: 1,
    lowStockAlert: 5,

    analysis: null,
  };
}

export function isListingValid(
  draft: SellListingDraft,
  options?: { requireInventory?: boolean },
): boolean {
  const hasUploadedPhotos =
    draft.photos.length > 0 &&
    draft.photos.every((photo) => photo.uploaded || photo.file);

  const inventoryValid = isInventoryValid(
    draft.stock,
    options?.requireInventory ? draft.lowStockAlert : draft.stock,
  );

  if (!hasUploadedPhotos) return false;
  if (!draft.categoryPath) return false;
  if (!draft.title.trim()) return false;
  if (!draft.description.trim()) return false;
  if (!draft.brand.trim()) return false;
  if (!draft.condition) return false;
  if (!inventoryValid) return false;

  switch (draft.listingType) {
    case "fixed":
      return Number(draft.price) > 0;

    case "auction":
      return (
        Number(draft.auctionStartPrice) >= 1 &&
        draft.auctionEndsAt.trim().length > 0
      );

    case "live":
      return Number(draft.price) > 0;

    default:
      return false;
  }
}