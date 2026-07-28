import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { getPromotionPaymentOptions } from "@/lib/promotions/payment-options";
import { toPromotionPaymentSafeError } from "@/lib/promotions/payment-safe";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "promotions-payment-options", 30, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const amountRaw = new URL(request.url).searchParams.get("amountCents");
    const amountCents = amountRaw ? Number.parseInt(amountRaw, 10) : 0;
    const options = await getPromotionPaymentOptions(
      auth.user.id,
      Number.isFinite(amountCents) ? amountCents : 0,
    );
    return NextResponse.json({ success: true, options });
  } catch {
    return NextResponse.json(
      { success: false, error: toPromotionPaymentSafeError("process") },
      { status: 500 },
    );
  }
}
