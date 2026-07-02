import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeIncidentAction } from "@/lib/incident-response-center/actions";
import { getIncidentSnapshot } from "@/lib/incident-response-center/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  format: z.enum(["csv", "json", "pdf"]).optional(),
  mfaVerified: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    const result = await executeIncidentAction("export", auth.user.id, {
      format: parsed.data.format ?? "json",
      mfaVerified: true,
    });
    const incidentResponseCenter = await getIncidentSnapshot();
    return NextResponse.json({ ok: true, ...result, incidentResponseCenter });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Export failed" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const format = new URL(request.url).searchParams.get("format") ?? "json";

  try {
    const result = await executeIncidentAction("export", auth.user.id, { format, mfaVerified: true });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Export failed" }, { status: 400 });
  }
}
