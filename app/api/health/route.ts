import { NextResponse } from "next/server";
import { enterpriseErrorResponse, getRequestCorrelationId } from "@/lib/api/enterprise-response";
import { getPlatformHealthReport } from "@/lib/ops/health-runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * P11.1 H-06 — Public health returns minimal operational status only.
 * No secret names, env inventories, or internal diagnostics.
 */
export async function GET(request: Request) {
  const startedAt = Date.now();

  try {
    const report = await getPlatformHealthReport();
    const statusCode = report.status === "healthy" ? 200 : report.status === "degraded" ? 200 : 503;
    const requestId = getRequestCorrelationId(request);

    const checks = Object.fromEntries(
      Object.entries(report.checks).map(([id, check]) => [id, { status: check.status }]),
    );

    return NextResponse.json(
      {
        success: true as const,
        status: report.status,
        timestamp: report.timestamp,
        version: report.version,
        requestId,
        checks,
        latencyMs: Date.now() - startedAt,
      },
      {
        status: statusCode,
        headers: {
          "Cache-Control": "no-store",
          "X-Request-Id": requestId,
        },
      },
    );
  } catch (error) {
    const { logApiError } = await import("@/lib/ops/logger");
    logApiError("Health check failed", error, { route: "/api/health" });
    return enterpriseErrorResponse("Health check failed.", {
      request,
      startedAt,
      status: 503,
      diagnostics: { route: "/api/health" },
    });
  }
}
