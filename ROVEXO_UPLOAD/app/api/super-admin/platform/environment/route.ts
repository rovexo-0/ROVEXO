import { requireApiSuperAdmin } from "@/lib/auth/session";
import { enterpriseErrorResponse, enterpriseSuccessResponse } from "@/lib/api/enterprise-response";
import { logApiError } from "@/lib/ops/logger";
import { validatePlatformSecuritySurface, validateProductionEnvironment } from "@/lib/ops/production-env";
import { validateSecurityHeaderConfiguration } from "@/lib/ops/security-headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const auth = await requireApiSuperAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const environment = validateProductionEnvironment();
    const securitySurface = validatePlatformSecuritySurface();
    const headers = validateSecurityHeaderConfiguration(process.env.NODE_ENV === "production");

    return enterpriseSuccessResponse(
      {
        environment,
        security: {
          headers,
          surface: securitySurface,
        },
      },
      {
        request,
        startedAt,
        diagnostics: {
          route: "/api/super-admin/platform/environment",
          productionReady: environment.productionReady && headers.pass && securitySurface.pass,
        },
      },
    );
  } catch (error) {
    logApiError("Platform environment validation failed", error, {
      route: "/api/super-admin/platform/environment",
    });
    return enterpriseErrorResponse(error instanceof Error ? error.message : "Environment validation failed.", {
      request,
      startedAt,
      status: 500,
      diagnostics: { route: "/api/super-admin/platform/environment" },
    });
  }
}
