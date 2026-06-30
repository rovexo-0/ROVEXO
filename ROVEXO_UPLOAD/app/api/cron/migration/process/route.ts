import { executeCronRoute } from "@/lib/cron/runner";
import { MIGRATION_MAX_BATCHES_PER_RUN } from "@/lib/seller/migration/engine/config";
import { listActiveMigrationJobs } from "@/lib/seller/migration/repository";
import { runMigrationEngine } from "@/lib/seller/migration/service";

async function runMigrationProcessCron() {
  const jobs = await listActiveMigrationJobs();
  let processed = 0;

  for (const job of jobs) {
    const result = await runMigrationEngine(job.sellerId, job.id, MIGRATION_MAX_BATCHES_PER_RUN);
    if (result) processed += 1;
  }

  return { processed, queued: jobs.length };
}

export async function GET(request: Request) {
  return executeCronRoute(request, "migration/process", runMigrationProcessCron);
}

export async function POST(request: Request) {
  return executeCronRoute(request, "migration/process", runMigrationProcessCron);
}
