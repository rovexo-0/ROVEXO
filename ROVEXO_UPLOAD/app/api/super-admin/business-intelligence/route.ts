import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getBiSnapshot } from "@/lib/enterprise-business-intelligence/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const businessIntelligence = await getBiSnapshot();
  return NextResponse.json({ businessIntelligence });
}
