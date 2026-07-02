import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getObservabilitySnapshot } from "@/lib/enterprise-observability-center/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const observability = await getObservabilitySnapshot();
  return NextResponse.json({ observability });
}
