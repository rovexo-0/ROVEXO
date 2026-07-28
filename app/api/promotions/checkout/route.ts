import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { payListingPromotion } from "@/lib/promotions/pay";
import {
  sanitizePromotionCheckoutError,
  toPromotionPaymentSafeError,
} from "@/lib/promotions/payment-safe";

const checkoutSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["bump", "feature"]),
  durationId: z.string().min(2),
  paymentMethod: z.enum(["wallet", "default_card"]),
  scheduledStartAt: z.string().datetime().optional().nullable(),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "promotions-checkout", 10, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = checkoutSchema.parse(await request.json());
    const result = await payListingPromotion({
      sellerId: auth.user.id,
      productId: body.productId,
      type: body.type,
      durationId: body.durationId,
      paymentMethod: body.paymentMethod,
      scheduledStartAt: body.scheduledStartAt,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: sanitizePromotionCheckoutError(result.error) },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      activated: true,
      url: result.url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: toPromotionPaymentSafeError("process") },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: toPromotionPaymentSafeError("process") },
      { status: 500 },
    );
  }
}
