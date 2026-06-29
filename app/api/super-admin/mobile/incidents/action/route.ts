import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeIncidentCommandAction } from "@/lib/incident-command-center-engine/engine";
import { getIncidentCommandSnapshot } from "@/lib/incident-command-center-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.string().min(1),
  incidentId: z.string().optional(),
  assignee: z.string().optional(),
  format: z.enum(["pdf", "csv", "xlsx"]).optional(),
  reportType: z.string().optional(),
  confirmed: z.boolean().optional(),
  historyId: z.string().optional(),
  document: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    await executeIncidentCommandAction(parsed.data.action, auth.user.id, {
      ...parsed.data,
      document: parsed.data.document as import("@/lib/incident-command-center-engine/config").IncidentCommandConfigDocument | undefined,
    });
    const snapshot = await getIncidentCommandSnapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 400 });
  }
}
