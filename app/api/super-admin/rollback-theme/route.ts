import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { rollbackVisualCmsTheme } from "@/lib/visual-cms-engine/engine";
import { getVisualCmsEngineSnapshot } from "@/lib/visual-cms-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  historyId: z.string(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bodySchema.parse(await request.json());
    const result = await rollbackVisualCmsTheme(body.historyId, auth.user.id);
    const snapshot = await getVisualCmsEngineSnapshot();
    return NextResponse.json({ ok: true, ...result, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to rollback theme.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
