import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeIncidentAction } from "@/lib/incident-response-center/actions";
import { getIncidentSnapshot } from "@/lib/incident-response-center/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.string().min(1),
  mfaVerified: z.boolean().optional(),
}).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    const result = await executeIncidentAction(parsed.data.action, auth.user.id, parsed.data);
    const incidentResponseCenter = await getIncidentSnapshot();
    return NextResponse.json({ ok: true, ...result, incidentResponseCenter });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 400 });
  }
}
