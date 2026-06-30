import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { createRecoveryIncident, updateRecoveryIncident } from "@/lib/recovery-center-engine/engine";
import { getRecoveryIncidentsData } from "@/lib/recovery-center-engine/reader";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  action: z.enum(["create", "update", "resolve", "archive"]),
  incidentId: z.string().optional(),
  title: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  owner: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await getRecoveryIncidentsData());
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = postSchema.parse(await request.json());

    if (body.action === "create") {
      if (!body.title) return NextResponse.json({ error: "title is required." }, { status: 400 });
      const incident = await createRecoveryIncident(
        { title: body.title, priority: body.priority ?? "medium", status: "open", owner: body.owner, notes: body.notes },
        auth.user.id,
      );
      return NextResponse.json({ ok: true, incident });
    }

    if (!body.incidentId) return NextResponse.json({ error: "incidentId is required." }, { status: 400 });

    const status =
      body.action === "resolve" ? "resolved" : body.action === "archive" ? "archived" : "investigating";

    const incident = await updateRecoveryIncident(
      body.incidentId,
      { status, owner: body.owner, notes: body.notes, priority: body.priority },
      auth.user.id,
    );
    return NextResponse.json({ ok: true, incident });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update incident.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
