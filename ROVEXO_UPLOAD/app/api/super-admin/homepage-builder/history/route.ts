import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { homepageBuilderConfigLifecycle } from "@/lib/homepage-builder-engine/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const history = await homepageBuilderConfigLifecycle.getHistory();
  return NextResponse.json({ history });
}
