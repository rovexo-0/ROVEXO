import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getDevelopmentSnapshot } from "@/lib/enterprise-development-center/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const development = await getDevelopmentSnapshot();
  return NextResponse.json({ modules: development.modules });
}
