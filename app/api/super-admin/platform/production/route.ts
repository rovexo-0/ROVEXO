import { requireApiSuperAdmin } from "@/lib/auth/session";
import { enterpriseErrorResponse, enterpriseSuccessResponse } from "@/lib/api/enterprise-response";
import { logApiError } from "@/lib/ops/logger";
import { validateProductionOptimizationSurface } from "@/lib/ops/production-optimization-audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const auth = await requireApiSuperAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const optimization = validateProductionOptimizationSurface();

    return enterpriseSuccessResponse(
      { optimization },
      {
        request,
        startedAt,
        diagnostics: {
          route: "/api/super-admin/platform/production",
          omegaStageIComplete: optimization.omegaStageIComplete,
          productionReady: optimization.productionReady,
        },
      },
    );
  } catch (error) {
    logApiError("Production optimization validation failed", error, {
      route: "/api/super-admin/platform/production",
    });
    return enterpriseErrorResponse(
      error instanceof Error ? error.message : "Production optimization validation failed.",
      {
        request,
        startedAt,
        status: 500,
        diagnostics: { route: "/api/super-admin/platform/production" },
      },
    );
  }
}
