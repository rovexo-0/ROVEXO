import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { runProductionMaintenance } from "@/lib/cron/maintenance";

async function handleCron(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runProductionMaintenance();
  return NextResponse.json({ success: true, ...result });
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
