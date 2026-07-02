import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  getMessagesEngineAnalyticsForUser,
  getMessagesEngineContext,
  getMessagesEngineConversationContext,
  getPublicMessagesEngineConfig,
  listMessagesEngineSummaries,
} from "@/lib/messages-engine/reader";
import type { MessagesEngineFilterId } from "@/lib/messages-engine/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");
  const filter = url.searchParams.get("filter") as MessagesEngineFilterId | null;
  const query = url.searchParams.get("q") ?? undefined;

  if (conversationId) {
    const context = await getMessagesEngineConversationContext(conversationId, auth.user.id);
    if (!context) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    return NextResponse.json({ context });
  }

  const [config, context, summaries, analytics] = await Promise.all([
    getPublicMessagesEngineConfig(),
    getMessagesEngineContext(auth.user.id),
    listMessagesEngineSummaries(auth.user.id, { filter: filter ?? undefined, query }),
    getMessagesEngineAnalyticsForUser(auth.user.id),
  ]);

  return NextResponse.json({ config, context, summaries, analytics });
}
