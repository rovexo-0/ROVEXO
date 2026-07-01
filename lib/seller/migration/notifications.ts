import { dispatchNotification } from "@/lib/notifications/dispatch";
import type { MigrationJob } from "@/lib/seller/migration/types";
import { IMPORT_WIZARD_PATH } from "@/lib/seller/migration/config";

function jobHref(jobId: string): string {
  return `${IMPORT_WIZARD_PATH}/${jobId}`;
}

export async function notifyMigrationEvent(
  sellerId: string,
  job: MigrationJob,
  event: "started" | "processing" | "completed" | "completed_warnings" | "failed",
): Promise<void> {
  const titles: Record<typeof event, string> = {
    started: "Store migration started",
    processing: "Store migration in progress",
    completed: "Store migration complete",
    completed_warnings: "Store migration completed with warnings",
    failed: "Store migration failed",
  };

  const subtitles: Record<typeof event, string> = {
    started: `Importing from ${job.platform}.`,
    processing: `Processing batch ${job.currentBatch} of ${job.totalBatches}.`,
    completed: `${job.report?.imported ?? 0} listings imported. Ready to publish.`,
    completed_warnings: `${job.report?.warnings ?? 0} warnings need review.`,
    failed: job.errorMessage ?? "Migration could not be completed.",
  };

  await dispatchNotification({
    userId: sellerId,
    type: "system",
    title: titles[event],
    subtitle: subtitles[event],
    href: jobHref(job.id),
    detail: JSON.stringify({ jobId: job.id, event }),
  });
}

export async function notifyMigrationCompleted(
  sellerId: string,
  job: MigrationJob,
): Promise<void> {
  const hasWarnings = (job.report?.warnings ?? 0) > 0;
  await notifyMigrationEvent(sellerId, job, hasWarnings ? "completed_warnings" : "completed");
}

export async function notifyPublishingEvent(
  sellerId: string,
  job: MigrationJob,
  event: "started" | "completed" | "completed_warnings" | "failed",
): Promise<void> {
  const titles: Record<typeof event, string> = {
    started: "Publishing started",
    completed: "Publishing complete",
    completed_warnings: "Publishing completed with warnings",
    failed: "Publishing failed",
  };

  const published = job.publishReport?.published ?? job.publishProgress?.published ?? 0;

  const subtitles: Record<typeof event, string> = {
    started: "Your imported listings are being published.",
    completed: `${published} listing${published === 1 ? "" : "s"} published.`,
    completed_warnings: "Some listings need review before publishing.",
    failed: "Publishing could not be completed.",
  };

  await dispatchNotification({
    userId: sellerId,
    type: "system",
    title: titles[event],
    subtitle: subtitles[event],
    href: jobHref(job.id),
    detail: JSON.stringify({ jobId: job.id, event }),
  });
}
