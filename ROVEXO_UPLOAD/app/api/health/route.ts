import { NextResponse } from "next/server";
import { enterpriseErrorResponse, getRequestCorrelationId } from "@/lib/api/enterprise-response";
import { getPlatformHealthReport } from "@/lib/ops/health-runtime";
import { validateSecurityHeaderConfiguration } from "@/lib/ops/security-headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const startedAt = Date.now();

  try {
    const report = await getPlatformHealthReport();
    const headers = validateSecurityHeaderConfiguration(process.env.NODE_ENV === "production");

    const { validateProductionEnvironment, validatePlatformSecuritySurface } = await import(
      "@/lib/ops/production-env"
    );
    const environment = validateProductionEnvironment();
    const securitySurface = validatePlatformSecuritySurface();

    const statusCode = report.status === "healthy" ? 200 : report.status === "degraded" ? 200 : 503;
    const requestId = getRequestCorrelationId(request);

    return NextResponse.json(
      {
        success: true as const,
        timestamp: report.timestamp,
        version: report.version,
        requestId,
        data: { report },
        diagnostics: {
          executionTimeMs: Date.now() - startedAt,
          route: "/api/health",
          platformStatus: report.status,
          environmentReady: environment.pass,
          securityReady: headers.pass && securitySurface.pass,
          missingEnv: environment.missingRequired,
        },
        // Backward compatibility for monitors and e2e health checks.
        status: report.status,
        checks: report.checks,
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
    return enterpriseErrorResponse(error instanceof Error ? error.message : "Health check failed.", {
      request,
      startedAt,
      status: 503,
      diagnostics: { route: "/api/health" },
    });
  }
}
