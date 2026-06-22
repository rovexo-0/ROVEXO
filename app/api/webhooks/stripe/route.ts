import { NextResponse } from "next/server";
import Stripe from "stripe";
import { logPaymentError } from "@/lib/ops/logger";
import { cancelPendingOrder, fulfillOrderFromStripeSession } from "@/lib/orders/checkout";
import { fulfillPromotionFromStripeSession } from "@/lib/promotions/service";
import {
  fulfillSubscriptionFromStripeSession,
  syncSubscriptionFromStripe,
} from "@/lib/monetization/stripe";
import { recordPlatformAnalyticsEvent } from "@/lib/platform-analytics/events";
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
          await recordPlatformAnalyticsEvent({ domain: "promotions", metric: "checkout_completed" });
        } else if (session.metadata?.checkoutType === "order") {
          await fulfillOrderFromStripeSession(session);
          await recordPlatformAnalyticsEvent({ domain: "orders", metric: "checkout_completed" });
        } else if (session.metadata?.checkoutType === "subscription") {
          await fulfillSubscriptionFromStripeSession(session);
          await recordPlatformAnalyticsEvent({ domain: "monetization", metric: "subscription_activated" });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionFromStripe(subscription);
        await recordPlatformAnalyticsEvent({
          domain: "monetization",
          metric: event.type === "customer.subscription.deleted" ? "subscription_cancelled" : "subscription_renewed",
        });
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.checkoutType === "order" && session.metadata.orderId) {
          await cancelPendingOrder(session.metadata.orderId);
        } else if (
          session.metadata?.checkoutType === "promotion" &&
          session.metadata.promotionId
        ) {
          const { markPendingPromotionFailed } = await import("@/lib/promotions/service");
          await markPendingPromotionFailed(session.metadata.promotionId);
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
    logPaymentError("Stripe webhook handler failed", error, { eventType: event.type });
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
