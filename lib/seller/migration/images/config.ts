import "server-only";

export const MIGRATION_IMAGE_BUCKET = "products" as const;

export const MIGRATION_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export const MIGRATION_IMAGE_SIZES = {
  thumbnail: 150,
  medium: 400,
  large: 800,
} as const;

export const MIGRATION_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const MIGRATION_IMAGE_DOWNLOAD_RETRIES = 3;

export function buildMigrationImageBasePath(
  sellerId: string,
  listingId: string,
): string {
  return `${sellerId}/migration/${listingId}`;
}

export function buildMigrationImageVariantPath(
  sellerId: string,
  listingId: string,
  variant: "original" | "large" | "medium" | "thumbnail",
  filename: string,
): string {
  return `${buildMigrationImageBasePath(sellerId, listingId)}/${variant}/${filename}`;
}
