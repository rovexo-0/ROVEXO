import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit, enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { findOrCreateConversation } from "@/lib/messages/conversations";
import { listConversations } from "@/lib/messages/store";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const conversations = await listConversations(auth.user.id);
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "messages", 30, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
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
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    conversationId: result.conversationId,
    href: `/messages/${result.conversationId}`,
  });
}
