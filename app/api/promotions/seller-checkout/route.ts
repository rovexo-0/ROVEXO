import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { paySellerPromotion } from "@/lib/promotions/pay";
import {
  sanitizePromotionCheckoutError,
  toPromotionPaymentSafeError,
} from "@/lib/promotions/payment-safe";

const sellerCheckoutSchema = z.object({
  type: z.enum(["store_featured", "boost_package"]),
  packageId: z.string().min(2),
  paymentMethod: z.enum(["wallet", "default_card"]),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "promotions-seller-checkout", 10, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = sellerCheckoutSchema.parse(await request.json());
    const result = await paySellerPromotion({
      sellerId: auth.user.id,
      type: body.type,
      packageId: body.packageId,
      paymentMethod: body.paymentMethod,
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
