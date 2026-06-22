import { NextResponse } from "next/server";
import { getPlatformHealthReport } from "@/lib/ops/health";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const report = await getPlatformHealthReport();
  const statusCode = report.status === "healthy" ? 200 : report.status === "degraded" ? 200 : 503;

  return NextResponse.json(report, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
