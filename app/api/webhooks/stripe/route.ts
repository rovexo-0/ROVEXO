import { NextResponse } from "next/server";
import Stripe from "stripe";
import { handleStripeWebhookEvent } from "@/lib/stripe/webhook-handler";
import { getStripeClient, getStripeWebhookSecret, isStripeConfigured } from "@/lib/stripe/server";
import {
  isWalletMoneyEnvReady,
  MISSING_REQUIRED_SECRET,
} from "@/lib/wallet/env-validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Legacy Stripe webhook path — same fail-closed contract as /api/stripe/webhook. */
export async function POST(request: Request) {
  if (!isWalletMoneyEnvReady("webhook") || !isStripeConfigured()) {
    return NextResponse.json(
      { error: MISSING_REQUIRED_SECRET, code: "MISSING_REQUIRED_SECRET" },
      { status: 503 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(body, signature, getStripeWebhookSecret());
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    await handleStripeWebhookEvent(event);
  } catch {
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
