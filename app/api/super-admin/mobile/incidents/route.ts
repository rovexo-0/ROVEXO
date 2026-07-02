import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getIncidentCommandSnapshot } from "@/lib/incident-command-center-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const incidentCommand = await getIncidentCommandSnapshot();
  return NextResponse.json({ incidentCommand });
}
