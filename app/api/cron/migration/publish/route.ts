import { executeCronRoute } from "@/lib/cron/runner";
import { runPublishEngine } from "@/lib/seller/migration/publish/engine";
import { PUBLISH_MAX_BATCHES_PER_RUN } from "@/lib/seller/migration/publish/config";
import { listActivePublishJobs } from "@/lib/seller/migration/repository";

async function runMigrationPublishCron() {
  const jobs = await listActivePublishJobs();
  let processed = 0;

  for (const job of jobs) {
    const result = await runPublishEngine(
      job.sellerId,
      job.id,
      PUBLISH_MAX_BATCHES_PER_RUN,
      job.autoPublish ? "published" : "published",
    );
    if (result) processed += 1;
  }

  return { processed, queued: jobs.length };
}

export async function GET(request: Request) {
  return executeCronRoute(request, "migration/publish", runMigrationPublishCron);
}

export async function POST(request: Request) {
  return executeCronRoute(request, "migration/publish", runMigrationPublishCron);
}
