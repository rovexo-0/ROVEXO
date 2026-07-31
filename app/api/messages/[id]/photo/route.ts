import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { appendMessage, getConversationById } from "@/lib/messages/store";
import { StorageValidationError, uploadMessageImage } from "@/lib/storage/upload";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Messages photo attachment — upload to existing `messages` bucket + append photo message.
 * Reuses Storage + Messages store. No parallel upload/storage architecture.
 */
export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const userLimited = await enforceRateLimitForUser(auth.user.id, "messages-photo", 30, 60_000);
  if (userLimited) return userLimited;

  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const file = formData.get("file");
    const senderRoleRaw = formData.get("senderRole");
    const senderRole =
      senderRoleRaw === "buyer" || senderRoleRaw === "seller" ? senderRoleRaw : null;

    if (!(file instanceof File) || !senderRole) {
      return NextResponse.json({ error: "Invalid photo payload." }, { status: 400 });
    }

    const existing = await getConversationById(id, auth.user.id);
    if (!existing) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
    if (existing.blocked) {
      return NextResponse.json({ error: "You cannot message this user." }, { status: 400 });
    }

    const uploaded = await uploadMessageImage(id, file);
    const result = await appendMessage({
      conversationId: id,
      senderId: auth.user.id,
      senderRole,
      content: uploaded.path,
      kind: "photo",
    });

    if (!result.message) {
      return NextResponse.json({ error: result.error ?? "Unable to send photo." }, { status: 400 });
    }

    const conversation = await getConversationById(id, auth.user.id);
    return NextResponse.json({
      conversation,
      message: result.message,
      warning: result.warning ?? null,
    });
  } catch (error) {
    if (error instanceof StorageValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to send photo." }, { status: 500 });
  }
}
