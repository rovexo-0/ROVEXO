import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { publishVisualCmsTheme } from "@/lib/visual-cms-engine/engine";
import { getVisualCmsEngineSnapshot } from "@/lib/visual-cms-engine/reader";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const result = await publishVisualCmsTheme(auth.user.id);
    const snapshot = await getVisualCmsEngineSnapshot();
    return NextResponse.json({ ok: true, ...result, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish theme.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
