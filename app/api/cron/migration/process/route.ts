import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { MIGRATION_MAX_BATCHES_PER_RUN } from "@/lib/seller/migration/engine/config";
import { listActiveMigrationJobs } from "@/lib/seller/migration/repository";
import { runMigrationEngine } from "@/lib/seller/migration/service";

async function handleCron() {
  const jobs = await listActiveMigrationJobs();
  let processed = 0;

  for (const job of jobs) {
    const result = await runMigrationEngine(job.sellerId, job.id, MIGRATION_MAX_BATCHES_PER_RUN);
    if (result) processed += 1;
  }

  return NextResponse.json({ processed, queued: jobs.length });
}

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handleCron();
}

export async function POST(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handleCron();
}
