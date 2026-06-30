import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { createPromotionCheckoutSession } from "@/lib/promotions/service";

const featureSchema = z.object({
  productId: z.string().uuid(),
  durationId: z.enum(["7d", "14d", "30d"]).optional().default("7d"),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "listings-feature", 10, 60_000);
  if (limited) return limited;

  const auth = await requireApiRole(["seller", "business", "admin"]);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = featureSchema.parse(await request.json());
    const result = await createPromotionCheckoutSession({
      sellerId: auth.user.id,
      productId: body.productId,
      type: "feature",
      durationId: body.durationId,
    });

    if ("error" in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, url: result.url });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid feature request." }, { status: 400 });
  }
}
