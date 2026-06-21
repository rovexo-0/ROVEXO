import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { markPendingPromotionFailed } from "@/lib/promotions/service";

const cancelSchema = z.object({
  promotionId: z.string().uuid(),
});

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = cancelSchema.parse(await request.json());
    await markPendingPromotionFailed(body.promotionId, auth.user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }
}
