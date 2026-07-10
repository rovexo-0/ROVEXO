import { NextResponse } from "next/server";

import { requireApiAuth } from "@/lib/auth/session";
import { SendcloudService } from "@/lib/shipping/sendcloud/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const health = await SendcloudService.checkHealth();

  return NextResponse.json({
    ok: health.status === "healthy",
    provider: "sendcloud",
    status: health.status,
    configured: health.configured,
    latencyMs: health.latencyMs,
    baseUrl: health.baseUrl,
    message: health.message,
  });
}
