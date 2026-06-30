import { requireApiSuperAdmin } from "@/lib/auth/session";
import { enterpriseErrorResponse, enterpriseSuccessResponse } from "@/lib/api/enterprise-response";
import { logApiError } from "@/lib/ops/logger";
import { validatePlatformPerformanceSurface } from "@/lib/ops/performance-audit";
import { validatePerformanceHeaderConfiguration } from "@/lib/ops/performance-headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const auth = await requireApiSuperAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const performance = validatePlatformPerformanceSurface();
    const headers = validatePerformanceHeaderConfiguration();

    return enterpriseSuccessResponse(
      {
        performance,
        headers,
      },
      {
        request,
        startedAt,
        diagnostics: {
          route: "/api/super-admin/platform/performance",
          enterpriseReady: performance.enterpriseReady && headers.pass,
        },
      },
    );
  } catch (error) {
    logApiError("Platform performance validation failed", error, {
      route: "/api/super-admin/platform/performance",
    });
    return enterpriseErrorResponse(
      error instanceof Error ? error.message : "Performance validation failed.",
      {
        request,
        startedAt,
        status: 500,
        diagnostics: { route: "/api/super-admin/platform/performance" },
      },
    );
  }
}
