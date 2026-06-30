import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { deleteSavedSearch, listSavedSearches, saveSearch } from "@/lib/launch/saved-searches";

const saveSchema = z.object({
  query: z.string().min(1).max(200),
  filters: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;
  const searches = await listSavedSearches(auth.user.id);
  return NextResponse.json({ searches });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = saveSchema.parse(await request.json());
    const search = await saveSearch(auth.user.id, body.query, body.filters ?? {});
    if (!search) return NextResponse.json({ error: "Unable to save search." }, { status: 500 });
    return NextResponse.json({ success: true, search });
  } catch {
    return NextResponse.json({ error: "Invalid saved search request." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const searchId = new URL(request.url).searchParams.get("id");
  if (!searchId) return NextResponse.json({ error: "Missing search id." }, { status: 400 });

  const success = await deleteSavedSearch(auth.user.id, searchId);
  if (!success) return NextResponse.json({ error: "Unable to delete search." }, { status: 500 });
  return NextResponse.json({ success: true });
}
