import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { auditMobileDistributionCenterEngineAction } from "@/lib/mobile-distribution-center-engine/audit";
import { getMobileDistributionCenterEngineSnapshot } from "@/lib/mobile-distribution-center-engine/reader";
import { buildExportPayload } from "@/lib/mobile-distribution-center-engine/timeline";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  format: z.enum(["pdf", "csv", "json", "markdown"]),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const snapshot = await getMobileDistributionCenterEngineSnapshot();
  const payload = buildExportPayload({
    format: parsed.data.format,
    snapshot: {
      appInfo: snapshot.appInfo,
      analytics: snapshot.analytics,
      devices: snapshot.devices,
      omega: snapshot.omega,
      compliance: snapshot.compliance,
    },
  });

  await auditMobileDistributionCenterEngineAction({
    actorId: auth.user.id,
    module: "mobile-distribution-center",
    action: "export",
    newValue: { format: parsed.data.format },
  });

  return NextResponse.json({ ok: true, payload });
}
