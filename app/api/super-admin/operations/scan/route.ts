import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { runAiOperationsScan } from "@/lib/super-admin/operations/snapshot";
import { auditSuperAdminAction } from "@/lib/super-admin/audit";

export async function POST() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await runAiOperationsScan(auth.user.id);
  await auditSuperAdminAction({
    actorId: auth.user.id,
    action: "ai_operations.scan",
    resourceType: "platform",
    metadata: {
      alerts: snapshot.summary.activeAlerts,
      critical: snapshot.summary.criticalIssues,
    },
  });

  return NextResponse.json({ snapshot });
}
