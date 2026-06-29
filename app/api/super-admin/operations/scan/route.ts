import { requireApiSuperAdmin } from "@/lib/auth/session";
import { enterpriseErrorResponse, enterpriseSuccessResponse } from "@/lib/api/enterprise-response";
import { logApiError } from "@/lib/ops/logger";
import { runAiOperationsScan } from "@/lib/super-admin/operations/snapshot";
import { auditSuperAdminAction } from "@/lib/super-admin/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const auth = await requireApiSuperAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const snapshot = await runAiOperationsScan(auth.user.id);

    try {
      await auditSuperAdminAction({
        actorId: auth.user.id,
        action: "ai_operations.scan",
        resourceType: "platform",
        metadata: {
          alerts: snapshot.summary.activeAlerts,
          critical: snapshot.summary.criticalIssues,
        },
      });
    } catch (auditError) {
      logApiError("Operations scan audit failed", auditError, { route: "/api/super-admin/operations/scan" });
    }

    return enterpriseSuccessResponse({ snapshot }, {
      request,
      startedAt,
      diagnostics: {
        route: "/api/super-admin/operations/scan",
        scanCount: snapshot.scanResults.length,
        platformHealth: snapshot.summary.platformHealth,
      },
    });
  } catch (error) {
    logApiError("Operations scan failed", error, { route: "/api/super-admin/operations/scan" });
    return enterpriseErrorResponse(error instanceof Error ? error.message : "Operations scan failed.", {
      request,
      startedAt,
      status: 500,
      diagnostics: { route: "/api/super-admin/operations/scan" },
    });
  }
}
