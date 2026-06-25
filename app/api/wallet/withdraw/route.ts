import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";

/**
 * Manual seller withdrawals were removed in v1.0.
 * Payouts are transferred automatically to Stripe Connect after the hold period.
 */
export async function POST() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  return NextResponse.json(
    {
      error:
        "Manual withdrawals are no longer supported. Payouts are sent automatically to your Stripe Connect account after the hold period.",
    },
    { status: 410 },
  );
}
