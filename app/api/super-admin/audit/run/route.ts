import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { runEnterpriseAudit } from "@/lib/audit-compliance-engine/engine";
import { getAuditComplianceEngineSnapshot } from "@/lib/audit-compliance-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  scope: z.enum(["full", "module"]).optional(),
  moduleId: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bodySchema.parse(await request.json());
    const run = await runEnterpriseAudit(body, auth.user.id);
    const snapshot = await getAuditComplianceEngineSnapshot();
    return NextResponse.json({ ok: true, run, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run audit.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
