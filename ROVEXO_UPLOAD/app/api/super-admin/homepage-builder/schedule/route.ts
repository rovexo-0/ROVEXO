import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getHomepageBuilderLiveDocument } from "@/lib/homepage-builder-engine/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const live = await getHomepageBuilderLiveDocument();
  return NextResponse.json({ schedules: live.settings.schedules });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  return NextResponse.json({ ok: true, scheduled: body });
}
