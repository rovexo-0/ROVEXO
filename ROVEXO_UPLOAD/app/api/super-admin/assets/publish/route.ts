import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { publishAssetManagerEngine } from "@/lib/asset-manager-engine/engine";
import { getAssetManagerEngineSnapshot } from "@/lib/asset-manager-engine/reader";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const published = await publishAssetManagerEngine(auth.user.id);
    const snapshot = await getAssetManagerEngineSnapshot();
    return NextResponse.json({ ok: true, live: published, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish assets.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
