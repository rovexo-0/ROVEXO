import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getQaSnapshot } from "@/lib/omega-quality-assurance-center/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const qualityAssurance = await getQaSnapshot();
  return NextResponse.json({ qualityAssurance });
}
