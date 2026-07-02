import { requireApiSuperAdmin } from "@/lib/auth/session";
import { enterpriseErrorResponse, enterpriseSuccessResponse } from "@/lib/api/enterprise-response";
import { logApiError } from "@/lib/ops/logger";
import { getOperationsHealthData } from "@/lib/operations-center-engine/reader";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const auth = await requireApiSuperAdmin();
  if (auth instanceof Response) return auth;

  try {
    const health = await getOperationsHealthData();
    return enterpriseSuccessResponse({ health }, {
      request,
      startedAt,
      diagnostics: { route: "/api/super-admin/operations/health" },
    });
  } catch (error) {
    logApiError("Operations health failed", error, { route: "/api/super-admin/operations/health" });
    return enterpriseErrorResponse(error instanceof Error ? error.message : "Operations health failed.", {
      request,
      startedAt,
      status: 500,
      diagnostics: { route: "/api/super-admin/operations/health" },
    });
  }
}
