import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { logCronEvent, logOpsEvent } from "@/lib/ops/logger";
import { recordCronJobRun } from "@/lib/ops/production-status";

export async function executeCronRoute(
  request: Request,
  jobName: string,
  handler: () => Promise<Record<string, unknown>>,
): Promise<NextResponse> {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await handler();
    await recordCronJobRun({ jobName, status: "success", result });
    logCronEvent(`${jobName} completed`, result);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : `${jobName} failed`;
    await recordCronJobRun({ jobName, status: "failed", errorMessage: message });
    logOpsEvent({ category: "cron", message: `${jobName} failed`, error });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
