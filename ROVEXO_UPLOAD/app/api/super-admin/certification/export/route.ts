import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { exportCertificationReport } from "@/lib/certification-center-engine/engine";
import { buildExportPayload } from "@/lib/certification-center-engine/timeline";
import { getCertificationCenterEngineSnapshot } from "@/lib/certification-center-engine/reader";
import { CERTIFICATION_EXPORT_FORMATS } from "@/lib/certification-center-engine/registry";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  format: z.enum(CERTIFICATION_EXPORT_FORMATS),
  reportType: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bodySchema.parse(await request.json());
    const snapshot = await getCertificationCenterEngineSnapshot();
    const exported = await exportCertificationReport(body, auth.user.id);
    const payload = buildExportPayload({
      dashboard: snapshot.dashboard,
      scorecard: snapshot.scorecard,
      modules: snapshot.modules,
      format: body.format,
    });
    return NextResponse.json({ ok: true, exported, payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export report.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
