import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getHomepageBuilderDraftDocument } from "@/lib/homepage-builder-engine/config";
import { preparePreviewDocument } from "@/lib/homepage-builder-engine/publish";
import { buildPreviewSections } from "@/lib/homepage-builder-engine/preview";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const url = new URL(request.url);
  const mode = (url.searchParams.get("mode") ?? "desktop") as import("@/lib/homepage-builder-engine/types").HomepagePreviewMode;
  const draft = await getHomepageBuilderDraftDocument();
  const preview = preparePreviewDocument(draft.settings.draft);
  const sections = buildPreviewSections(preview.sections, mode);
  return NextResponse.json({ preview, sections, mode });
}

export async function POST() {
  return GET(new Request("http://local/preview?mode=desktop"));
}
