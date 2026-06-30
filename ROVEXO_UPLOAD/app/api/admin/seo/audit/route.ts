import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { runSeoAudit } from "@/lib/seo/audit";

export async function GET() {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ report: runSeoAudit() });
}
