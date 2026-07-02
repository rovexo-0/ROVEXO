import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getHomepageBuilderDraftDocument, getHomepageBuilderLiveDocument } from "@/lib/homepage-builder-engine/config";
import { compareHomepageDocuments } from "@/lib/homepage-builder-engine/versioning";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const [draft, live] = await Promise.all([getHomepageBuilderDraftDocument(), getHomepageBuilderLiveDocument()]);
  const diff = compareHomepageDocuments(live.settings.production, draft.settings.draft);
  return NextResponse.json({ diff, from: live.settings.production.version, to: draft.settings.draft.version });
}

export async function POST() {
  return GET();
}
