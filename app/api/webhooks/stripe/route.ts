import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cancelPendingOrder, fulfillOrderFromStripeSession } from "@/lib/orders/checkout";
import { fulfillPromotionFromStripeSession } from "@/lib/promotions/service";
import { getStripeClient, getStripeWebhookSecret, isStripeConfigured } from "@/lib/stripe/server";
import {
  reverseFailedStripeTransfer,
  syncStripeRefundFromCharge,
} from "@/lib/stripe/webhook-sync";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
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
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.checkoutType === "promotion") {
          await fulfillPromotionFromStripeSession(session);
        } else if (session.metadata?.checkoutType === "order") {
          await fulfillOrderFromStripeSession(session);
        }
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.checkoutType === "order" && session.metadata.orderId) {
          await cancelPendingOrder(session.metadata.orderId);
        }
        break;
      }
      case "transfer.reversed": {
        const transfer = event.data.object as Stripe.Transfer;
        await reverseFailedStripeTransfer(transfer.id);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        const refundId = charge.refunds?.data[0]?.id;
        if (paymentIntentId && refundId) {
          await syncStripeRefundFromCharge({ paymentIntentId, refundId });
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
