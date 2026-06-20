import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { createPromotionCheckoutSession } from "@/lib/promotions/service";

const checkoutSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["bump", "feature"]),
  durationId: z.string().min(2),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "promotions-checkout", 10, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = checkoutSchema.parse(await request.json());
    const result = await createPromotionCheckoutSession({
      sellerId: auth.user.id,
      productId: body.productId,
      type: body.type,
      durationId: body.durationId,
    });

    if ("error" in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, url: result.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid promotion checkout request." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Unable to start promotion checkout." },
      { status: 500 },
    );
  }
}
