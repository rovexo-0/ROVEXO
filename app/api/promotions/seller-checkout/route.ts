import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { createSellerPromotionCheckoutSession } from "@/lib/promotions/seller-promotions";

const sellerCheckoutSchema = z.object({
  type: z.enum(["store_featured", "boost_package"]),
  packageId: z.string().min(2),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "promotions-seller-checkout", 10, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = sellerCheckoutSchema.parse(await request.json());
    const result = await createSellerPromotionCheckoutSession({
      sellerId: auth.user.id,
      type: body.type,
      packageId: body.packageId,
    });

    if ("error" in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, url: result.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid seller promotion checkout request." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Unable to start seller promotion checkout." },
      { status: 500 },
    );
  }
}
