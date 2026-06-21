import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { createPromotionCheckoutSession } from "@/lib/promotions/service";

const bumpSchema = z.object({
  productId: z.string().uuid(),
  durationId: z.enum(["24h", "3d", "7d"]).optional().default("24h"),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "listings-bump", 10, 60_000);
  if (limited) return limited;

  const auth = await requireApiRole(["seller", "business", "admin"]);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bumpSchema.parse(await request.json());
    const result = await createPromotionCheckoutSession({
      sellerId: auth.user.id,
      productId: body.productId,
      type: "bump",
      durationId: body.durationId,
    });

    if ("error" in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, url: result.url });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid bump request." }, { status: 400 });
  }
}
