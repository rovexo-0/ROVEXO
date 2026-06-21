import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { upsertPresence } from "@/lib/messages/store";

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    online?: boolean;
    typingConversationId?: string | null;
  };

  await upsertPresence({
    userId: auth.user.id,
    online: body.online,
    typingConversationId: body.typingConversationId,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  await upsertPresence({
    userId: auth.user.id,
    online: false,
    typingConversationId: null,
  });

  return NextResponse.json({ success: true });
}
