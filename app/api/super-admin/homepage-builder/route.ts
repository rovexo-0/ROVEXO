import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getHomepageBuilderSnapshot } from "@/lib/homepage-builder-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const homepageBuilder = await getHomepageBuilderSnapshot();
  return NextResponse.json({ homepageBuilder });
}
