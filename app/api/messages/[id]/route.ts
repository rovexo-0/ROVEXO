import { NextResponse } from "next/server";
import {
  requireCookieOrBearerApiAuth,
  withPrivateNoStore,
} from "@/lib/auth/require-cookie-or-bearer-api-auth-v1";
import { enforceRateLimitForUser } from "@/lib/api/rate-limit";
import {
  appendMessage,
  deleteMessage,
  editMessage,
  getConversationById,
  reactToMessage,
  updateConversationPreferences,
} from "@/lib/messages/store";
import { getViewerRole } from "@/lib/messages/types";
import {
  INBOX_EVENT_ENGINE_V1,
  syncConversationOpen,
  type InboxSyncOpenSource,
} from "@/lib/inbox/inbox-event-engine-v1";

type RouteContext = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireCookieOrBearerApiAuth(request);
  if (auth instanceof NextResponse) return withPrivateNoStore(auth);

  const { id } = await context.params;
  const conversation = await getConversationById(id, auth.user.id, auth.supabase);
  if (!conversation) {
    return withPrivateNoStore(
      NextResponse.json({ error: "Conversation not found." }, { status: 404 }),
    );
  }

  return withPrivateNoStore(NextResponse.json({ conversation }));
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireCookieOrBearerApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  const userLimited = await enforceRateLimitForUser(auth.user.id, "messages-send", 60, 60_000);
  if (userLimited) return userLimited;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      content?: string;
      senderRole?: "buyer" | "seller";
      replyToId?: string;
      kind?: "text" | "photo" | "emoji";
    };

    if (!body.content?.trim()) {
      return NextResponse.json({ error: "Invalid message payload." }, { status: 400 });
    }

    const existing = await getConversationById(id, auth.user.id);
    if (!existing) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    // P11.1 H-03 — bind senderRole server-side (ignore client spoof).
    const senderRole = getViewerRole(existing.participant);

    const kind = body.kind === "photo" || body.kind === "emoji" ? body.kind : "text";

    const result = await appendMessage({
      conversationId: id,
      senderId: auth.user.id,
      senderRole,
      content: body.content.trim(),
      replyToId: body.replyToId,
      kind,
    });

    if (!result.message) {
      return NextResponse.json({ error: result.error ?? "Unable to send message." }, { status: 400 });
    }

    const conversation = await getConversationById(id, auth.user.id);
    return NextResponse.json({ conversation, warning: result.warning ?? null });
  } catch {
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireCookieOrBearerApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const body = (await request.json()) as {
    action?: "read" | "archive" | "mute" | "pin" | "block" | "edit" | "delete" | "react";
    value?: boolean;
    messageId?: string;
    content?: string;
    emoji?: string;
    source?: InboxSyncOpenSource;
  };

  const existing = await getConversationById(id, auth.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  if (body.action === "read" || !body.action) {
    void INBOX_EVENT_ENGINE_V1.bloodLaw;
    const sync = await syncConversationOpen({
      conversationId: id,
      viewerId: auth.user.id,
      source: body.source ?? "hub_mount",
    });
    if (!sync.ok) {
      return NextResponse.json(
        { success: false, error: sync.message, code: sync.code, bloodLaw: "XLIII" },
        { status: sync.httpStatus },
      );
    }
    const conversation = await getConversationById(id, auth.user.id);
    return NextResponse.json({
      success: true,
      bloodLaw: "XLIII",
      conversation,
      sync,
    });
  }

  if (body.action === "archive") {
    await updateConversationPreferences({
      conversationId: id,
      viewerId: auth.user.id,
      patch: { archived: body.value ?? true },
    });
  } else if (body.action === "mute") {
    await updateConversationPreferences({
      conversationId: id,
      viewerId: auth.user.id,
      patch: { muted: body.value ?? true },
    });
  } else if (body.action === "pin") {
    await updateConversationPreferences({
      conversationId: id,
      viewerId: auth.user.id,
      patch: { pinned: body.value ?? true },
    });
  } else if (body.action === "block") {
    await updateConversationPreferences({
      conversationId: id,
      viewerId: auth.user.id,
      patch: { blocked: body.value ?? true },
    });
  } else if (body.action === "edit" && body.messageId && body.content) {
    await editMessage({
      conversationId: id,
      messageId: body.messageId,
      senderId: auth.user.id,
      content: body.content,
    });
  } else if (body.action === "delete" && body.messageId) {
    await deleteMessage({
      conversationId: id,
      messageId: body.messageId,
      senderId: auth.user.id,
    });
  } else if (body.action === "react" && body.messageId && body.emoji) {
    await reactToMessage({
      conversationId: id,
      messageId: body.messageId,
      userId: auth.user.id,
      emoji: body.emoji,
    });
  }

  const conversation = await getConversationById(id, auth.user.id);
  return NextResponse.json({ conversation });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireCookieOrBearerApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  await updateConversationPreferences({
    conversationId: id,
    viewerId: auth.user.id,
    patch: { archived: true },
  });

  return NextResponse.json({ success: true });
}
