import { enforceRateLimit } from "@/lib/api/rate-limit";
import { requireApiAuth } from "@/lib/auth/session";
import { createContentReport } from "@/lib/moderation/service";
import { emitSmartNotification } from "@/lib/notifications/events";
import { NextResponse } from "next/server";
import { z } from "zod";

const reportSchema = z.object({
  sellerId: z.string().uuid(),
  reason: z.string().min(1),
  message: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "seller-report", 10, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = reportSchema.parse(await request.json());

    await createContentReport({
      reporterId: auth.user.id,
      targetType: "profile",
      targetId: body.sellerId,
      reason: body.reason,
      details: body.message,
    });

    await emitSmartNotification({
      userId: auth.user.id,
      eventType: "support_reply",
      idempotencyKey: `seller-report-ack-${auth.user.id}-${body.sellerId}`,
      notificationType: "system",
      title: "Seller report received",
      subtitle: "We received your report and will review it.",
      href: "/help/category/safety",
      payload: { sellerId: body.sellerId, reason: body.reason },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid report." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to submit report." }, { status: 500 });
  }
}
