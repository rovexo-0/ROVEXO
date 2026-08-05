import { NextResponse } from "next/server";
import { enterpriseErrorResponse, enterpriseSuccessResponse } from "@/lib/api/enterprise-response";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { validateProductionEnvironment, validatePlatformSecuritySurface } from "@/lib/ops/production-env";
import { validateSecurityHeaderConfiguration } from "@/lib/ops/security-headers";

export const dynamic = "force-dynamic";

/**
 * P11.1 H-06 — Extended diagnostics are super_admin only.
 * Never expose missing secret key names anonymously.
 */
export async function GET(request: Request) {
  const startedAt = Date.now();

  const auth = await requireApiSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const environment = validateProductionEnvironment();
    const securitySurface = validatePlatformSecuritySurface();
    const headers = validateSecurityHeaderConfiguration(process.env.NODE_ENV === "production");

    return enterpriseSuccessResponse(
      {
        environment: {
          pass: environment.pass,
          productionReady: environment.productionReady,
          missingRequiredCount: environment.missingRequired.length,
          // Names only for super_admin; still avoid values.
          missingRequired: environment.missingRequired,
        },
        securitySurface,
        headers,
      },
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
