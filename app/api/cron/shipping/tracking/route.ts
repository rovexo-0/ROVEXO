import { NextResponse } from "next/server";

import { authorizeCronRequest } from "@/lib/cron/auth";
import { syncParcel2GoTrackingBatch } from "@/lib/shipping/parcel2go-tracking-sync.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handleCron(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncParcel2GoTrackingBatch();
  return NextResponse.json({ success: true, ...result });
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
