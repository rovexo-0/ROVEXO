import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getHomepageBuilderDraftDocument } from "@/lib/homepage-builder-engine/config";
import { validateHomepageDocument } from "@/lib/homepage-builder-engine/publish";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const draft = await getHomepageBuilderDraftDocument();
  const result = validateHomepageDocument(draft.settings.draft);
  return NextResponse.json({ ok: result.valid, ...result });
}
