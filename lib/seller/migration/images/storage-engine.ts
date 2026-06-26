import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicStorageUrl } from "@/lib/storage/upload";
import {
  buildMigrationImageVariantPath,
  MIGRATION_IMAGE_BUCKET,
} from "@/lib/seller/migration/images/config";
import { downloadImageBuffer, hashImageBuffer, isValidImageUrl } from "@/lib/seller/migration/images/downloader";
import {
  findMigrationImageByHash,
  saveMigrationImageAsset,
  type StoredMigrationImagePaths,
} from "@/lib/seller/migration/images/repository";
import { optimizeImageVariants, validateAndInspectImage } from "@/lib/seller/migration/images/validator";
import type { MigrationNormalizedListing, MigrationProcessedImage } from "@/lib/seller/migration/engine/types";

export type MigrationImageBatchStats = {
  downloaded: number;
  stored: number;
  failed: number;
  optimized: number;
  reused: number;
};

async function uploadVariant(
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(MIGRATION_IMAGE_BUCKET).upload(path, buffer, {
    upsert: true,
    contentType,
  });
  if (error) throw error;
}

async function storeImageVariants(input: {
  sellerId: string;
  listingId: string;
  contentHash: string;
  sourceUrl: string;
  variants: Awaited<ReturnType<typeof optimizeImageVariants>>;
  width: number;
  height: number;
  bytes: number;
}): Promise<StoredMigrationImagePaths> {
  const filename = `${input.contentHash}.webp`;
  const paths: StoredMigrationImagePaths = {
    original: buildMigrationImageVariantPath(input.sellerId, input.listingId, "original", filename),
    large: buildMigrationImageVariantPath(input.sellerId, input.listingId, "large", filename),
    medium: buildMigrationImageVariantPath(input.sellerId, input.listingId, "medium", filename),
    thumbnail: buildMigrationImageVariantPath(input.sellerId, input.listingId, "thumbnail", filename),
  };

  await uploadVariant(paths.original, input.variants.original, input.variants.mimeType);
  await uploadVariant(paths.large, input.variants.large, input.variants.mimeType);
  await uploadVariant(paths.medium, input.variants.medium, input.variants.mimeType);
  await uploadVariant(paths.thumbnail, input.variants.thumbnail, input.variants.mimeType);

  await saveMigrationImageAsset({
    sellerId: input.sellerId,
    contentHash: input.contentHash,
    sourceUrl: input.sourceUrl,
    bucket: MIGRATION_IMAGE_BUCKET,
    paths,
    width: input.width,
    height: input.height,
    bytes: input.bytes,
  });

  return paths;
}

function pathsToProcessedImage(
  paths: StoredMigrationImagePaths,
  sortOrder: number,
  contentHash: string,
): MigrationProcessedImage {
  const largeUrl = getPublicStorageUrl(MIGRATION_IMAGE_BUCKET, paths.large);
  const mediumUrl = getPublicStorageUrl(MIGRATION_IMAGE_BUCKET, paths.medium);
  const thumbnailUrl = getPublicStorageUrl(MIGRATION_IMAGE_BUCKET, paths.thumbnail);
  const originalUrl = getPublicStorageUrl(MIGRATION_IMAGE_BUCKET, paths.original);

  return {
    url: largeUrl,
    thumbnailUrl,
    mediumUrl,
    largeUrl,
    originalUrl,
    storagePath: paths.large,
    contentHash,
    sortOrder,
    optimized: true,
  };
}

export async function processListingImageStorage(
  listing: MigrationNormalizedListing,
  sellerId: string,
  jobId: string,
): Promise<{ listing: MigrationNormalizedListing; stats: MigrationImageBatchStats }> {
  const stats: MigrationImageBatchStats = {
    downloaded: 0,
    stored: 0,
    failed: 0,
    optimized: 0,
    reused: 0,
  };

  const listingId = listing.fingerprint || `${jobId}-${listing.externalId}`;
  const urls = listing.imageUrls ?? [];
  const processedImages: MigrationProcessedImage[] = [];

  for (let index = 0; index < urls.length; index += 1) {
    const sourceUrl = urls[index]?.trim() ?? "";
    if (!isValidImageUrl(sourceUrl)) {
      stats.failed += 1;
      continue;
    }

    try {
      const buffer = await downloadImageBuffer(sourceUrl);
      stats.downloaded += 1;
      const inspected = await validateAndInspectImage(buffer);
      const contentHash = hashImageBuffer(inspected.buffer);
      const existing = await findMigrationImageByHash(sellerId, contentHash);

      if (existing) {
        stats.reused += 1;
        stats.stored += 1;
        processedImages.push(pathsToProcessedImage(existing.paths, index, contentHash));
        continue;
      }

      const variants = await optimizeImageVariants(inspected);
      stats.optimized += 1;
      const paths = await storeImageVariants({
        sellerId,
        listingId,
        contentHash,
        sourceUrl,
        variants,
        width: inspected.width,
        height: inspected.height,
        bytes: inspected.bytes,
      });
      stats.stored += 1;
      processedImages.push(pathsToProcessedImage(paths, index, contentHash));
    } catch {
      stats.failed += 1;
    }
  }

  const warnings = [...listing.warnings];
  if (!processedImages.length && urls.length) {
    warnings.push("No images could be stored locally; external URLs retained.");
    const fallback = urls.map((url, sortOrder) => ({
      url,
      thumbnailUrl: url,
      sortOrder,
      optimized: false,
    }));
    return {
      listing: { ...listing, processedImages: fallback, warnings },
      stats,
    };
  }

  return {
    listing: { ...listing, processedImages, warnings },
    stats,
  };
}

export async function processListingsImageStorage(
  listings: MigrationNormalizedListing[],
  sellerId: string,
  jobId: string,
): Promise<{ listings: MigrationNormalizedListing[]; stats: MigrationImageBatchStats }> {
  const aggregate: MigrationImageBatchStats = {
    downloaded: 0,
    stored: 0,
    failed: 0,
    optimized: 0,
    reused: 0,
  };

  const results: MigrationNormalizedListing[] = [];
  for (const listing of listings) {
    const { listing: stored, stats } = await processListingImageStorage(listing, sellerId, jobId);
    aggregate.downloaded += stats.downloaded;
    aggregate.stored += stats.stored;
    aggregate.failed += stats.failed;
    aggregate.optimized += stats.optimized;
    aggregate.reused += stats.reused;
    results.push(stored);
  }

  return { listings: results, stats: aggregate };
}
