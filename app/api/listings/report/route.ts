import { enforceRateLimit } from "@/lib/api/rate-limit";
import { requireApiAuth } from "@/lib/auth/session";
import { createContentReport } from "@/lib/moderation/service";
import { emitSmartNotification } from "@/lib/notifications/events";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const reportSchema = z.object({
  productSlug: z.string().min(1),
  reason: z.string().min(1),
  message: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "listing-report", 10, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = reportSchema.parse(await request.json());
    const supabase = await createClient();

    const { data: product } = await supabase
      .from("products")
      .select("id, title")
      .eq("slug", body.productSlug)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    await createContentReport({
      reporterId: auth.user.id,
      targetType: "listing",
      targetId: product.id,
      productSlug: body.productSlug,
      reason: body.reason,
      details: body.message,
    });

    await emitSmartNotification({
      userId: auth.user.id,
      eventType: "support_reply",
      idempotencyKey: `listing-report-ack-${auth.user.id}-${product.id}`,
      notificationType: "system",
      title: "Listing report received",
      subtitle: `We received your report for “${product.title}”.`,
      href: `/listing/${body.productSlug}`,
      detail: [body.reason, body.message].filter(Boolean).join(" — "),
      payload: { productId: product.id, productSlug: body.productSlug, reason: body.reason },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid report." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to submit report." }, { status: 500 });
  }
}
