import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { logPaymentSetupError, paymentSetupErrorMessage } from "@/lib/payments/errors";
import { readJsonObjectBody } from "@/lib/payments/request-body";
import {
  completePaymentMethodSetup,
  completePaymentMethodSetupIntent,
  createPaymentMethodSetupIntent,
  listPaymentMethods,
} from "@/lib/payments/repository";
import { isStripeConfigured } from "@/lib/stripe/server";
import { syncAutoVerifiedProfile } from "@/lib/profile/auto-verified";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const methods = await listPaymentMethods(auth.user.id);
    return NextResponse.json({ methods });
  } catch (error) {
    logPaymentSetupError("GET /api/payment-methods", error);
    const { message, status, code } = paymentSetupErrorMessage(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error: "Stripe is not configured on the server. Set STRIPE_SECRET_KEY in production.",
          code: "stripe_not_configured",
        },
        { status: 503 },
      );
    }

    const body = await readJsonObjectBody(request);
    const action = typeof body.action === "string" ? body.action : "create_setup_intent";

    if (action === "complete_setup" && typeof body.sessionId === "string") {
      const method = await completePaymentMethodSetup(auth.user.id, body.sessionId);
      if (!method) {
        return NextResponse.json(
          { error: "Stripe checkout did not return a saved card.", code: "payment_method_missing" },
          { status: 400 },
        );
      }
      await syncAutoVerifiedProfile(auth.user.id);
      return NextResponse.json({ method });
    }

    if (action === "complete_setup_intent" && typeof body.setupIntentId === "string") {
      const method = await completePaymentMethodSetupIntent(auth.user.id, body.setupIntentId);
      await syncAutoVerifiedProfile(auth.user.id);
      return NextResponse.json({ method });
    }

    const setup = await createPaymentMethodSetupIntent(auth.user.id);
    return NextResponse.json({
      clientSecret: setup.clientSecret,
      setupIntentId: setup.setupIntentId,
    });
  } catch (error) {
    logPaymentSetupError("POST /api/payment-methods", error);
    const { message, status, code } = paymentSetupErrorMessage(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
