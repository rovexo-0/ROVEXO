import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getIncidentSnapshot } from "@/lib/incident-response-center/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const incidentResponseCenter = await getIncidentSnapshot();
  return NextResponse.json({ incidentResponseCenter });
}
