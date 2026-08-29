import { NextResponse } from "next/server";
import {
  requireCookieOrBearerApiAuth,
  withPrivateNoStore,
} from "@/lib/auth/require-cookie-or-bearer-api-auth-v1";
import { enforceRateLimit, enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { syncConversationOpen } from "@/lib/inbox/inbox-event-engine-v1";
import { findOrCreateConversation } from "@/lib/messages/conversations";
import { listConversations } from "@/lib/messages/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireCookieOrBearerApiAuth(request);
  if (auth instanceof NextResponse) {
    return withPrivateNoStore(auth);
  }

  const conversations = await listConversations(auth.user.id, auth.supabase);
  return withPrivateNoStore(NextResponse.json({ conversations }));
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "messages", 30, 60_000);
  if (limited) return limited;

  const auth = await requireCookieOrBearerApiAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const userLimited = await enforceRateLimitForUser(auth.user.id, "messages-user", 60, 60_000);
  if (userLimited) return userLimited;

  const body = (await request.json()) as { productSlug?: string };
  if (!body.productSlug?.trim()) {
    return NextResponse.json({ error: "Product is required." }, { status: 400 });
  }

  const result = await findOrCreateConversation({
    buyerId: auth.user.id,
    productSlug: body.productSlug.trim(),
    supabase: auth.supabase,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    conversationId: result.conversationId,
    href: `/inbox/conversation/${result.conversationId}`,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireCookieOrBearerApiAuth(request);
  if (auth instanceof NextResponse) {
    return withPrivateNoStore(auth);
  }

  const body = (await request.json().catch(() => null)) as { markAllRead?: boolean } | null;
  if (!body?.markAllRead) {
    return withPrivateNoStore(
      NextResponse.json({ error: "Unsupported action." }, { status: 400 }),
    );
  }

  const conversations = await listConversations(auth.user.id, auth.supabase);
  for (const conversation of conversations) {
    if (conversation.unreadCount <= 0) continue;
    const sync = await syncConversationOpen({
      conversationId: conversation.id,
      viewerId: auth.user.id,
      source: "messages_tab",
    });
    if (!sync.ok) {
      return withPrivateNoStore(
        NextResponse.json({ error: sync.message }, { status: sync.httpStatus }),
      );
    }
  }

  const next = await listConversations(auth.user.id, auth.supabase);
  return withPrivateNoStore(NextResponse.json({ conversations: next }));
}
