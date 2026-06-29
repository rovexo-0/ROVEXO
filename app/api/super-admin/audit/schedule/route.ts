import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { setAuditSchedule } from "@/lib/audit-compliance-engine/engine";
import { getAuditComplianceEngineSnapshot } from "@/lib/audit-compliance-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  enabled: z.boolean(),
  nightlyValidation: z.boolean().optional(),
  weeklyCertificationScan: z.boolean().optional(),
  monthlyComplianceReport: z.boolean().optional(),
  continuousValidation: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bodySchema.parse(await request.json());
    const schedule = await setAuditSchedule(body, auth.user.id);
    const snapshot = await getAuditComplianceEngineSnapshot();
    return NextResponse.json({ ok: true, schedule, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update schedule.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
