import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  loadBusinessHomeExtras,
  loadBusinessStatus,
} from "@/lib/business/business-onboarding-v1";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const status = await loadBusinessStatus(auth.user.id, { refresh: true });
    if (!status.stripe.verified) {
      return NextResponse.json(
        { error: "Stripe verification is required.", nextStep: status.nextStep, status },
        { status: 409 },
      );
    }
    const extras = await loadBusinessHomeExtras(auth.user.id);
    return NextResponse.json({ status, ...extras });
  } catch {
    return NextResponse.json({ error: "Unable to load business home." }, { status: 500 });
  }
}
