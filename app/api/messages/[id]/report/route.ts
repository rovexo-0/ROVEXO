import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { createContentReport } from "@/lib/moderation/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const reportSchema = z.object({
  reason: z.string().min(1),
  details: z.string().max(1000).optional(),
});

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    const body = reportSchema.parse(await request.json());
    const admin = createAdminClient();

    const { data: conversation } = await admin
      .from("conversations")
      .select("id, buyer_id, seller_id")
      .eq("id", id)
      .maybeSingle();

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    if (conversation.buyer_id !== auth.user.id && conversation.seller_id !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    await admin.from("conversation_reports").insert({
      conversation_id: id,
      reporter_id: auth.user.id,
      reason: body.reason,
      details: body.details ?? "",
    });

    await createContentReport({
      reporterId: auth.user.id,
      targetType: "conversation",
      targetId: id,
      reason: body.reason,
      details: body.details,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid report." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to submit report." }, { status: 500 });
  }
}
