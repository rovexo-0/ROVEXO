import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  completePaymentMethodSetup,
  createPaymentMethodSetupSession,
  listPaymentMethods,
} from "@/lib/payments/repository";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const methods = await listPaymentMethods(auth.user.id);
  return NextResponse.json({ methods });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = (await request.json()) as { action?: string; sessionId?: string };

    if (body.action === "complete_setup" && body.sessionId) {
      const method = await completePaymentMethodSetup(auth.user.id, body.sessionId);
      return NextResponse.json({ method });
    }

    const url = await createPaymentMethodSetupSession(auth.user.id);
    if (!url) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Unable to start card setup." }, { status: 500 });
  }
}
