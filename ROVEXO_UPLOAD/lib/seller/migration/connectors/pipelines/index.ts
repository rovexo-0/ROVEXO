import "server-only";

import { mapListingCategory } from "@/lib/seller/migration/category/mapper";
import { processListingImages } from "@/lib/seller/migration/engine/image-processor";
import { normalizeListing } from "@/lib/seller/migration/engine/normalizer";
import type {
  MigrationConnectorInput,
  MigrationNormalizedListing,
  MigrationProcessedImage,
  MigrationRawListing,
} from "@/lib/seller/migration/engine/types";
import { validateMigrationImages } from "@/lib/seller/migration/publish/image-validator";
import { validateMigrationListing } from "@/lib/seller/migration/publish/validator";
import { buildJsonReport } from "@/lib/seller/migration/publish/report-export";
import { getMigrationJobForSeller } from "@/lib/seller/migration/repository";
import { listMigrationItemsForJob } from "@/lib/seller/migration/repository-items";
import {
  notifyMigrationEvent,
  notifyPublishingEvent,
} from "@/lib/seller/migration/notifications";
import type { MigrationJob } from "@/lib/seller/migration/types";
import type { ConnectorValidationResult } from "@/lib/seller/migration/connectors/types";

/** Import pipeline — runner orchestrates connector fetch batches. */
export const importPipeline = {
  table: "store_migration_jobs" as const,
};

/** Validation pipeline — shared ROVEXO listing validation. */
export const validationPipeline = {
  validateRaw(raw: MigrationRawListing): ConnectorValidationResult {
    const normalized = normalizeListing(raw);
    const listingResult = validateMigrationListing(normalized);
    const imageResult = validateMigrationImages(normalized.processedImages ?? []);
    const errors = [...listingResult.errors, ...imageResult.errors];
    return {
      valid: listingResult.status !== "invalid" && errors.filter((e) => e.field !== "general").length === 0,
      errors,
    };
  },
};

/** Image pipeline — validate and normalize image metadata. */
export const imagePipeline = {
  process(listing: MigrationRawListing): MigrationProcessedImage[] {
    const withImages = processListingImages(
      normalizeListing(listing),
    );
    const check = validateMigrationImages(withImages.processedImages);
    return check.processed;
  },
};

/** Category pipeline — reuse Module 2 mapping engine. */
export const categoryPipeline = {
  async map(
    listing: MigrationNormalizedListing,
    sellerId: string,
    platform: MigrationConnectorInput["platform"],
  ): Promise<MigrationNormalizedListing> {
    return mapListingCategory(listing, sellerId, platform);
  },
};

/** Report pipeline — reuse Module 3 export builders. */
export const reportPipeline = {
  async buildJson(sellerId: string, jobId: string) {
    const job = await getMigrationJobForSeller(sellerId, jobId);
    if (!job) return null;
    const items = await listMigrationItemsForJob(sellerId, jobId);
    return buildJsonReport(job, items);
  },
};

/** Queue pipeline — items live in store_migration_items (Module 2). */
export const queuePipeline = {
  storageTable: "store_migration_items" as const,
};

/** Notification pipeline — reuse Module 3 notifications. */
export const notificationPipeline = {
  async migration(sellerId: string, job: MigrationJob, event: Parameters<typeof notifyMigrationEvent>[2]) {
    await notifyMigrationEvent(sellerId, job, event);
  },
  async publishing(sellerId: string, job: MigrationJob, event: Parameters<typeof notifyPublishingEvent>[2]) {
    await notifyPublishingEvent(sellerId, job, event);
  },
};

/** Settings pipeline — connector-level defaults merged with seller overrides. */
export const settingsPipeline = {
  merge(
    defaults: Record<string, unknown>,
    overrides: Record<string, unknown> | null | undefined,
  ): Record<string, unknown> {
    return { ...defaults, ...(overrides ?? {}) };
  },
};
