import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { buildSeoHealthCenterReport } from "@/lib/seo/engine/health-center";

export async function GET() {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const report = await buildSeoHealthCenterReport();
  return NextResponse.json({ report });
}
