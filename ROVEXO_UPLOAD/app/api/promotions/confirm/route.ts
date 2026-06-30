import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { confirmPromotionCheckoutSession } from "@/lib/promotions/service";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: "Missing checkout session id." },
      { status: 400 },
    );
  }

  const result = await confirmPromotionCheckoutSession(sessionId, auth.user.id);
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error ?? "Unable to confirm promotion." },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
