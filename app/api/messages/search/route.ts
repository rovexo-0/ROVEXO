import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { searchConversationMessages } from "@/lib/messages/store";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchConversationMessages(auth.user.id, query);
  return NextResponse.json({ results });
}
