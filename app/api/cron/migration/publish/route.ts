import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { runPublishEngine } from "@/lib/seller/migration/publish/engine";
import { PUBLISH_MAX_BATCHES_PER_RUN } from "@/lib/seller/migration/publish/config";
import { listActivePublishJobs } from "@/lib/seller/migration/repository";

async function handleCron() {
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
