import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { rollbackAssetManagerEngine } from "@/lib/asset-manager-engine/engine";
import { getAssetManagerEngineSnapshot } from "@/lib/asset-manager-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  historyId: z.string(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bodySchema.parse(await request.json());
    const restored = await rollbackAssetManagerEngine(body.historyId, auth.user.id);
    const snapshot = await getAssetManagerEngineSnapshot();
    return NextResponse.json({ ok: true, live: restored, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to rollback assets.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
