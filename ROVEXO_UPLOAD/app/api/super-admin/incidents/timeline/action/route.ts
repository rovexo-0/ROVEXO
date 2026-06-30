import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeIncidentTimelineAction } from "@/lib/incident-timeline-engine/engine";
import { getIncidentTimelineSnapshot } from "@/lib/incident-timeline-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.string().min(1),
  format: z.enum(["pdf", "csv", "xlsx"]).optional(),
  exportId: z.string().optional(),
  historyId: z.string().optional(),
  document: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    await executeIncidentTimelineAction(parsed.data.action, auth.user.id, {
      ...parsed.data,
      document: parsed.data.document as import("@/lib/incident-timeline-engine/config").IncidentTimelineConfigDocument | undefined,
    });
    const snapshot = await getIncidentTimelineSnapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 400 });
  }
}
