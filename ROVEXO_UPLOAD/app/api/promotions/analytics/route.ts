import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordPromotionAnalyticsEvent } from "@/lib/promotions/analytics";

const trackSchema = z.object({
  productId: z.string().uuid(),
  eventType: z.enum(["impression", "click"]),
  surface: z.enum(["homepage", "search", "category", "listing", "seller"]),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "promotion-analytics", 120, 60_000);
  if (limited) return limited;

  try {
    const body = trackSchema.parse(await request.json());
    const admin = createAdminClient();

    const { data: product } = await admin
      .from("products")
      .select("id, seller_id, status, bumped_until, featured_until")
      .eq("id", body.productId)
      .eq("status", "published")
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    const now = Date.now();
    const isPromoted =
      (product.bumped_until && new Date(product.bumped_until).getTime() > now) ||
      (product.featured_until && new Date(product.featured_until).getTime() > now);

    if (!isPromoted) {
      return NextResponse.json({ success: true, skipped: true });
    }

    await recordPromotionAnalyticsEvent({
      productId: product.id,
      sellerId: product.seller_id,
      eventType: body.eventType,
      surface: body.surface,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }
}
