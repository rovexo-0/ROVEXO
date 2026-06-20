import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimitForUser } from "@/lib/api/rate-limit";
import {
  appendMessage,
  getConversationById,
  markConversationRead,
} from "@/lib/messages/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await context.params;
  const conversation = await getConversationById(id, auth.user.id);

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const userLimited = await enforceRateLimitForUser(auth.user.id, "messages-send", 60, 60_000);
  if (userLimited) return userLimited;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { content?: string; senderRole?: "buyer" | "seller" };

    if (!body.content?.trim() || !body.senderRole) {
      return NextResponse.json({ error: "Invalid message payload." }, { status: 400 });
    }

    const existing = await getConversationById(id, auth.user.id);
    if (!existing) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const message = await appendMessage({
      conversationId: id,
      senderId: auth.user.id,
      senderRole: body.senderRole,
      content: body.content.trim(),
    });

    if (!message) {
      return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
    }

    const conversation = await getConversationById(id, auth.user.id);
    return NextResponse.json({ conversation });
  } catch {
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }
}

export async function PATCH(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await context.params;
  const existing = await getConversationById(id, auth.user.id);

  if (!existing) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  await markConversationRead(id, auth.user.id);
  const conversation = await getConversationById(id, auth.user.id);
  return NextResponse.json({ conversation });
}
