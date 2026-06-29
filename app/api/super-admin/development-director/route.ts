import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getDevDirectorSnapshot } from "@/lib/omega-development-director/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const developmentDirector = await getDevDirectorSnapshot();
  return NextResponse.json({ developmentDirector });
}
