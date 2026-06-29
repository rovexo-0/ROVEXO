import { enterpriseErrorResponse, enterpriseSuccessResponse } from "@/lib/api/enterprise-response";
import { validateProductionEnvironment, validatePlatformSecuritySurface } from "@/lib/ops/production-env";
import { validateSecurityHeaderConfiguration } from "@/lib/ops/security-headers";

export const dynamic = "force-dynamic";

/** Extended environment and security diagnostics (not bundled into /api/health). */
export async function GET(request: Request) {
  const startedAt = Date.now();

  try {
    const environment = validateProductionEnvironment();
    const securitySurface = validatePlatformSecuritySurface();
    const headers = validateSecurityHeaderConfiguration(process.env.NODE_ENV === "production");

    return enterpriseSuccessResponse(
      { environment, securitySurface, headers },
      {
        request,
        startedAt,
        diagnostics: {
          route: "/api/health/diagnostics",
          productionReady: environment.productionReady && headers.pass && securitySurface.pass,
        },
      },
    );
  } catch (error) {
    return enterpriseErrorResponse(error instanceof Error ? error.message : "Diagnostics failed.", {
      request,
      startedAt,
      status: 500,
      diagnostics: { route: "/api/health/diagnostics" },
    });
  }
}
