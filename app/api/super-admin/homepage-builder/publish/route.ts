import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeHomepageBuilderConfigAction } from "@/lib/homepage-builder-engine/config-actions";
import { getHomepageBuilderSnapshot } from "@/lib/homepage-builder-engine/reader";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  try {
    await executeHomepageBuilderConfigAction("publish", auth.user.id);
    const snapshot = await getHomepageBuilderSnapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Publish failed" }, { status: 400 });
  }
}
