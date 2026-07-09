import { describe, expect, it } from "vitest";
import {
  BRING_YOUR_ITEM_PROGRESS_STEPS,
  resolveBringYourItemProgress,
} from "@/lib/bring-your-item/account-progress";
import type { MigrationJob } from "@/lib/seller/migration/types";

function baseJob(overrides: Partial<MigrationJob> = {}): MigrationJob {
  return {
    id: "job-1",
    sellerId: "seller-1",
    platform: "ebay",
    importMethod: "api_import",
    status: "processing",
    progressPercent: 45,
    estimatedSeconds: 60,
    stats: { imported: 10, ready: 10, warnings: 0, completed: 0 },
    progress: {
      listingsFound: 100,
      imported: 45,
      images: 20,
      categories: 10,
      publishing: 0,
      speedPerMinute: 12,
      remaining: 55,
      etaSeconds: 120,
      completed: 45,
      currentBatch: 1,
      totalBatches: 2,
    },
    report: null,
    duplicatePolicy: "skip",
    input: null,
    itemsTotal: 100,
    currentBatch: 1,
    totalBatches: 2,
    notifyOnComplete: false,
    startedAt: new Date().toISOString(),
    completedAt: null,
    errorMessage: null,
    publishStatus: "idle",
    publishProgress: null,
    publishReport: null,
    autoPublish: false,
    scheduledPublishAt: null,
    publishBatch: 0,
    publishTotalBatches: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Bring Your Item account progress", () => {
  it("defines seven live progress phases", () => {
    expect(BRING_YOUR_ITEM_PROGRESS_STEPS).toHaveLength(7);
    expect(BRING_YOUR_ITEM_PROGRESS_STEPS.map((step) => step.label)).toEqual([
      "Connecting…",
      "Fetching listings…",
      "Importing…",
      "Optimising images…",
      "AI categorising…",
      "Publishing…",
      "Completed ✓",
    ]);
  });

  it("marks fetching when listing count is loading", () => {
    const state = resolveBringYourItemProgress({
      connectorsLoading: false,
      connectorActionPending: false,
      isConnected: true,
      fetchingCount: true,
      step: 2,
      isPolling: false,
      isSubmitting: false,
      importComplete: false,
      importFailed: false,
      job: null,
      listingCount: null,
    });
    expect(state.activeStepId).toBe("fetching");
    expect(state.showStepList).toBe(true);
  });

  it("uses import sub-phases from live job progress", () => {
    const importing = resolveBringYourItemProgress({
      connectorsLoading: false,
      connectorActionPending: false,
      isConnected: true,
      fetchingCount: false,
      step: 3,
      isPolling: true,
      isSubmitting: false,
      importComplete: false,
      importFailed: false,
      job: baseJob(),
      listingCount: 100,
    });
    expect(importing.activeStepId).toBe("importing");
    expect(importing.progressPercent).toBe(45);

    const optimising = resolveBringYourItemProgress({
      connectorsLoading: false,
      connectorActionPending: false,
      isConnected: true,
      fetchingCount: false,
      step: 3,
      isPolling: true,
      isSubmitting: false,
      importComplete: false,
      importFailed: false,
      job: baseJob({
        progress: {
          ...baseJob().progress!,
          imported: 100,
          images: 40,
        },
        progressPercent: 80,
      }),
      listingCount: 100,
    });
    expect(optimising.activeStepId).toBe("optimising");
  });

  it("returns completed when publish finishes", () => {
    const state = resolveBringYourItemProgress({
      connectorsLoading: false,
      connectorActionPending: false,
      isConnected: true,
      fetchingCount: false,
      step: 3,
      isPolling: false,
      isSubmitting: false,
      importComplete: true,
      importFailed: false,
      job: baseJob({
        status: "completed",
        progressPercent: 100,
        publishStatus: "completed",
        publishReport: {
          imported: 100,
          published: 95,
          drafts: 0,
          skipped: 5,
          duplicates: 0,
          warnings: 0,
          errors: 0,
          images: 100,
          categories: 100,
          durationSeconds: 30,
          processingTimeSeconds: 30,
          successRate: 95,
        },
      }),
      listingCount: 100,
    });
    expect(state.activeStepId).toBe("completed");
    expect(state.progressPercent).toBe(100);
    expect(state.publishedCount).toBe(95);
  });
});
