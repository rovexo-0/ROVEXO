import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { cancelUserSubscription, getUserSubscriptionRecord } from "@/lib/monetization/stripe";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const subscription = await getUserSubscriptionRecord(auth.user.id);
  return NextResponse.json({ subscription });
}

export async function DELETE() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const success = await cancelUserSubscription(auth.user.id);
  if (!success) return NextResponse.json({ error: "No active subscription to cancel." }, { status: 400 });
  return NextResponse.json({ success: true });
}
