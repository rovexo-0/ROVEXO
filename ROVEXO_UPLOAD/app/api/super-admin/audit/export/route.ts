import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { exportAuditReport } from "@/lib/audit-compliance-engine/engine";
import { buildExportPayload } from "@/lib/audit-compliance-engine/timeline";
import { getAuditComplianceEngineSnapshot } from "@/lib/audit-compliance-engine/reader";
import { AUDIT_EXPORT_FORMATS } from "@/lib/audit-compliance-engine/registry";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  format: z.enum(AUDIT_EXPORT_FORMATS),
  reportType: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bodySchema.parse(await request.json());
    const snapshot = await getAuditComplianceEngineSnapshot();
    const exported = await exportAuditReport(body, auth.user.id);
    const payload = buildExportPayload({
      scores: snapshot.scores,
      modules: snapshot.modules,
      findings: snapshot.findings,
      compliance: snapshot.compliance,
      format: body.format,
    });
    return NextResponse.json({ ok: true, exported, payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export report.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
