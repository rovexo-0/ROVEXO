import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/session";
import { runSeoAudit } from "@/lib/seo/audit";

export async function GET() {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ report: runSeoAudit() });
}
