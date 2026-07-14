import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimitForUser } from "@/lib/api/rate-limit";
import {
  appendMessage,
  deleteMessage,
  editMessage,
  getConversationById,
  markConversationRead,
  reactToMessage,
  updateConversationPreferences,
} from "@/lib/messages/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const conversation = await getConversationById(id, auth.user.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
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

    if (!body.content?.trim() || !body.senderRole) {
      return NextResponse.json({ error: "Invalid message payload." }, { status: 400 });
    }

    const existing = await getConversationById(id, auth.user.id);
    if (!existing) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const kind = body.kind === "photo" || body.kind === "emoji" ? body.kind : "text";

    const result = await appendMessage({
      conversationId: id,
      senderId: auth.user.id,
      senderRole: body.senderRole,
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
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const body = (await request.json()) as {
    action?: "read" | "archive" | "mute" | "pin" | "block" | "edit" | "delete" | "react";
    value?: boolean;
    messageId?: string;
    content?: string;
    emoji?: string;
  };

  const existing = await getConversationById(id, auth.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  if (body.action === "read" || !body.action) {
    await markConversationRead(id, auth.user.id);
  } else if (body.action === "archive") {
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

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  await updateConversationPreferences({
    conversationId: id,
    viewerId: auth.user.id,
    patch: { archived: true },
  });

  return NextResponse.json({ success: true });
}
