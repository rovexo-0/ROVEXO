import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getIncidentTimelineSnapshot } from "@/lib/incident-timeline-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const incidentTimeline = await getIncidentTimelineSnapshot();
  return NextResponse.json({ incidentTimeline });
}
