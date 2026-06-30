import type { MigrationNormalizedListing, MigrationProcessedImage } from "@/lib/seller/migration/engine/types";

export function processListingImages(listing: MigrationNormalizedListing): MigrationNormalizedListing {
  const urls = listing.imageUrls ?? [];
  const processedImages: MigrationProcessedImage[] = urls.map((url, index) => ({
    url,
    thumbnailUrl: url,
    sortOrder: index,
    optimized: false,
  }));

  return {
    ...listing,
    processedImages,
  };
}

export function countProcessedImages(listings: MigrationNormalizedListing[]): number {
  return listings.reduce((sum, item) => sum + item.processedImages.length, 0);
}

export function countStoredImages(listings: MigrationNormalizedListing[]): number {
  return listings.reduce(
    (sum, item) => sum + item.processedImages.filter((image) => image.storagePath).length,
    0,
  );
}
