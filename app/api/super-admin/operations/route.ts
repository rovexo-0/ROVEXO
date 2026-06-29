import { requireApiSuperAdmin } from "@/lib/auth/session";
import { enterpriseErrorResponse, enterpriseSuccessResponse } from "@/lib/api/enterprise-response";
import { logApiError } from "@/lib/ops/logger";
import { getOperationsCenterEngineSnapshot } from "@/lib/operations-center-engine/reader";
import { getAiOperationsSnapshot } from "@/lib/super-admin/operations/snapshot";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const auth = await requireApiSuperAdmin();
  if (auth instanceof Response) return auth;

  try {
    const url = new URL(request.url);
    if (url.searchParams.get("mode") === "ai") {
      const snapshot = await getAiOperationsSnapshot();
      return enterpriseSuccessResponse({ snapshot }, {
        request,
        startedAt,
        diagnostics: { route: "/api/super-admin/operations", mode: "ai" },
      });
    }

    const operationsCenter = await getOperationsCenterEngineSnapshot();
    return enterpriseSuccessResponse({ operationsCenter }, {
      request,
      startedAt,
      diagnostics: { route: "/api/super-admin/operations" },
    });
  } catch (error) {
    logApiError("Operations snapshot failed", error, { route: "/api/super-admin/operations" });
    return enterpriseErrorResponse(error instanceof Error ? error.message : "Operations snapshot failed.", {
      request,
      startedAt,
      status: 500,
      diagnostics: { route: "/api/super-admin/operations" },
    });
  }
}
