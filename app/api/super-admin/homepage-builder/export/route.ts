import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { homepageBuilderConfigLifecycle } from "@/lib/homepage-builder-engine/config";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const document = await homepageBuilderConfigLifecycle.exportDocument();
  return NextResponse.json({ ok: true, document });
}
