import { describe, expect, it } from "vitest";
import { normalizeListing } from "@/lib/seller/migration/engine/normalizer";
import { validateMigrationListing } from "@/lib/seller/migration/publish/validator";
import { validateMigrationImages } from "@/lib/seller/migration/publish/image-validator";
import { buildCsvReport, buildJsonReport } from "@/lib/seller/migration/publish/report-export";
import { PUBLISH_BATCH_SIZE, PUBLISH_MAX_BATCHES_PER_RUN } from "@/lib/seller/migration/publish/config";
import type { MigrationJob, MigrationQueueItem } from "@/lib/seller/migration/types";

describe("bulk publish validator", () => {
  it("rejects listings missing required fields", () => {
    const listing = normalizeListing({
      externalId: "1",
      title: "AB",
      price: 0,
    });
    const result = validateMigrationListing(listing);
    expect(result.status).toBe("invalid");
    expect(result.errors.some((e) => e.field === "title")).toBe(true);
    expect(result.errors.some((e) => e.field === "price")).toBe(true);
  });

  it("accepts valid listings", () => {
    const listing = normalizeListing({
      externalId: "1",
      title: "Vintage Camera",
      description: "Fully working vintage camera with case.",
      price: 120,
      condition: "used",
      imageUrls: ["https://example.com/photo.jpg"],
    });
    listing.categorySlug = "electronics";
    const result = validateMigrationListing(listing);
    expect(result.status).toBe("valid");
    expect(result.errors).toHaveLength(0);
  });

  it("validates image URLs", () => {
    const images = validateMigrationImages([
      { url: "not-a-url", thumbnailUrl: "not-a-url", sortOrder: 0, optimized: false },
    ]);
    expect(images.errors.length).toBeGreaterThan(0);
  });
});

describe("bulk publish report export", () => {
  const job: MigrationJob = {
    id: "job-1",
    sellerId: "seller-1",
    platform: "ebay",
    importMethod: "csv",
    status: "completed",
    progressPercent: 100,
    estimatedSeconds: null,
    stats: { imported: 2, ready: 2, warnings: 0, completed: 0 },
    progress: null,
    report: {
      imported: 2,
      published: 1,
      skipped: 0,
      duplicates: 0,
      warnings: 0,
      errors: 0,
      durationSeconds: 30,
      images: 2,
    },
    duplicatePolicy: "skip",
    input: null,
    itemsTotal: 2,
    currentBatch: 1,
    totalBatches: 1,
    notifyOnComplete: true,
    startedAt: null,
    completedAt: null,
    errorMessage: null,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    publishStatus: "completed",
    publishProgress: null,
    publishReport: {
      imported: 2,
      published: 1,
      drafts: 1,
      skipped: 0,
      duplicates: 0,
      warnings: 0,
      errors: 0,
      images: 2,
      categories: 2,
      durationSeconds: 45,
      processingTimeSeconds: 45,
      successRate: 100,
    },
    autoPublish: false,
    scheduledPublishAt: null,
    publishBatch: 1,
    publishTotalBatches: 1,
  };

  const items: MigrationQueueItem[] = [
    {
      id: "item-1",
      jobId: "job-1",
      sellerId: "seller-1",
      batchIndex: 0,
      itemIndex: 0,
      status: "imported",
      fingerprint: "fp1",
      duplicateAction: null,
      existingProductId: null,
      productId: "prod-1",
      validationStatus: "valid",
      validationErrors: [],
      suggestedCategorySlug: "electronics",
      publishStatus: "published",
      selected: true,
      warnings: [],
      normalizedData: null,
      title: "Camera",
      price: 120,
    },
  ];

  it("builds CSV with summary section", () => {
    const csv = buildCsvReport(job, items);
    expect(csv).toContain("item_index");
    expect(csv).toContain("Camera");
    expect(csv).toContain("summary");
    expect(csv).toContain("success_rate");
  });

  it("builds JSON report payload", () => {
    const json = buildJsonReport(job, items);
    expect(json.job.id).toBe("job-1");
    expect(json.publishReport?.published).toBe(1);
    expect(json.items).toHaveLength(1);
  });
});

describe("bulk publish config", () => {
  it("uses safe batch sizes", () => {
    expect(PUBLISH_BATCH_SIZE).toBeGreaterThan(0);
    expect(PUBLISH_MAX_BATCHES_PER_RUN).toBeGreaterThan(0);
  });
});
