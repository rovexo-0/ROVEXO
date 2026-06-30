import type { SellerListing } from "@/lib/listings/types";
import { createEmptyDraft, type SellListingDraft, type SellPhoto } from "@/features/sell/types";
import { resolveFlatCategoryPathFromId } from "@/lib/listings/category-path";
import { stripListingLocationMarker } from "@/lib/sell/listing-location";

export async function sellerListingToDraft(listing: SellerListing): Promise<SellListingDraft> {
  const categoryPath = await resolveFlatCategoryPathFromId(listing.categoryId);

  const photos: SellPhoto[] = listing.images.map((image) => ({
    id: image.id,
    previewUrl: image.thumbnailUrl ?? image.url,
    url: image.url,
    thumbnailUrl: image.thumbnailUrl,
    storagePath: image.storagePath,
    uploaded: true,
    existingImageId: image.id,
  }));

  return {
    ...createEmptyDraft(),
    photos,
    categoryPath,
    listingType: "fixed",
    brand: listing.brand ?? "",
    color: listing.color ?? "",
    size: listing.size ?? "",
    title: listing.title,
    description: stripListingLocationMarker(listing.description),
    locationCity: listing.locationCity,
    condition: listing.condition,
    price: String(listing.price),
    acceptOffers: listing.acceptOffers,
    stock: listing.stock,
    analysis: null,
  };
}
