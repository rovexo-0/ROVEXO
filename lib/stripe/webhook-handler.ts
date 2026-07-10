import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { logPaymentError, logStripeWebhookEvent } from "@/lib/ops/logger";
import { cancelPendingOrder, fulfillOrderFromStripeSession } from "@/lib/orders/checkout";
import { completePaidOrderFulfillment } from "@/lib/orders/post-payment.server";
import { fulfillPromotionFromStripeSession } from "@/lib/promotions/service";
import {
  fulfillSubscriptionFromStripeSession,
  syncSubscriptionFromStripe,
} from "@/lib/monetization/stripe";
import { recordPlatformAnalyticsEvent } from "@/lib/platform-analytics/events";
import { syncConnectAccountFromStripe } from "@/lib/stripe/connect";
import {
  reverseFailedStripeTransfer,
  syncStripeRefundFromCharge,
} from "@/lib/stripe/webhook-sync";
import { syncChargebackTrustFromDispute } from "@/lib/trust/chargeback";

function paymentIntentIdFrom(
  value: string | Stripe.PaymentIntent | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function syncRefundRecord(refund: Stripe.Refund): Promise<void> {
  const paymentIntentId = paymentIntentIdFrom(refund.payment_intent);
  if (!paymentIntentId || !refund.id) {
    return;
  }
  await syncStripeRefundFromCharge({ paymentIntentId, refundId: refund.id });
}

async function cancelOrderByPaymentIntent(paymentIntentId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, status")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (order?.status === "awaiting_payment") {
    await cancelPendingOrder(order.id);
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.metadata?.checkoutType === "promotion") {
    await fulfillPromotionFromStripeSession(session);
    await recordPlatformAnalyticsEvent({ domain: "promotions", metric: "checkout_completed" });
    return;
  }

  if (session.metadata?.checkoutType === "order") {
    const result = await fulfillOrderFromStripeSession(session);
    if (!result.success) {
      throw new Error(result.error ?? "Order fulfillment failed after checkout.session.completed.");
    }
    await recordPlatformAnalyticsEvent({ domain: "orders", metric: "checkout_completed" });
    return;
  }

  if (session.metadata?.checkoutType === "subscription") {
    await fulfillSubscriptionFromStripeSession(session);
    await recordPlatformAnalyticsEvent({ domain: "monetization", metric: "subscription_activated" });
  }
}

/**
 * Processes a verified Stripe webhook event.
 * Shared by /api/stripe/webhook and /api/webhooks/stripe (legacy).
 */
export async function processStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  logStripeWebhookEvent("Received event", { eventId: event.id, eventType: event.type });

  switch (event.type) {
    case "checkout.session.completed": {
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
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
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.orderId;
      if (orderId) {
        const result = await completePaidOrderFulfillment({
          orderId,
          stripePaymentIntentId: paymentIntent.id,
        });
        if (!result.success) {
          throw new Error(
            result.error ?? "Order fulfillment failed after payment_intent.succeeded.",
          );
        }
        logStripeWebhookEvent("payment_intent.succeeded fulfilled order", {
          orderId,
          paymentIntentId: paymentIntent.id,
        });
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      if (paymentIntent.metadata?.orderId) {
        await cancelPendingOrder(paymentIntent.metadata.orderId);
      } else {
        await cancelOrderByPaymentIntent(paymentIntent.id);
      }
      logStripeWebhookEvent("payment_intent.payment_failed processed", {
        paymentIntentId: paymentIntent.id,
      });
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = paymentIntentIdFrom(charge.payment_intent);
      const refundId = charge.refunds?.data[0]?.id;
      if (paymentIntentId && refundId) {
        await syncStripeRefundFromCharge({ paymentIntentId, refundId });
      }
      break;
    }
    case "refund.created":
    case "refund.updated": {
      await syncRefundRecord(event.data.object as Stripe.Refund);
      break;
    }
    case "customer.created":
    case "customer.updated":
    case "customer.deleted": {
      const customer = event.data.object as Stripe.Customer | Stripe.DeletedCustomer;
      logStripeWebhookEvent(`Stripe customer event: ${event.type}`, {
        customerId: customer.id,
        deleted: "deleted" in customer ? customer.deleted : false,
      });
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionFromStripe(subscription);
      await recordPlatformAnalyticsEvent({
        domain: "monetization",
        metric:
          event.type === "customer.subscription.deleted"
            ? "subscription_cancelled"
            : "subscription_renewed",
      });
      break;
    }
    case "account.updated": {
      await syncConnectAccountFromStripe(event.data.object as Stripe.Account);
      break;
    }
    case "payout.paid":
    case "payout.failed": {
      const payout = event.data.object as Stripe.Payout;
      logStripeWebhookEvent(`Connect payout ${event.type}`, {
        payoutId: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        destination: payout.destination,
      });
      break;
    }
    case "transfer.created": {
      const transfer = event.data.object as Stripe.Transfer;
      logStripeWebhookEvent("Platform transfer created", {
        transferId: transfer.id,
        amount: transfer.amount,
        destination: transfer.destination,
        orderId: transfer.metadata?.orderId ?? null,
      });
      break;
    }
    case "transfer.reversed": {
      await reverseFailedStripeTransfer((event.data.object as Stripe.Transfer).id);
      break;
    }
    case "charge.dispute.created": {
      const dispute = event.data.object as Stripe.Dispute;
      await syncChargebackTrustFromDispute({
        disputeId: dispute.id,
        paymentIntentId: paymentIntentIdFrom(dispute.payment_intent),
      });
      break;
    }
    case "charge.dispute.closed": {
      const dispute = event.data.object as Stripe.Dispute;
      logStripeWebhookEvent("charge.dispute.closed", {
        disputeId: dispute.id,
        status: dispute.status,
        paymentIntentId: paymentIntentIdFrom(dispute.payment_intent),
      });
      break;
    }
    default:
      logStripeWebhookEvent("Unhandled Stripe event type", { eventType: event.type }, "warn");
      break;
  }
}

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  try {
    await processStripeWebhookEvent(event);
    logStripeWebhookEvent("Event processed", { eventId: event.id, eventType: event.type });
  } catch (error) {
    logPaymentError("Stripe webhook handler failed", error, {
      eventId: event.id,
      eventType: event.type,
    });
    throw error;
  }
}
