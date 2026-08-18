import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { logPaymentError, logStripeWebhookEvent } from "@/lib/ops/logger";
import { cancelPendingOrder, fulfillOrderFromStripeSession } from "@/lib/orders/checkout";
import { completePaidOrderFulfillment } from "@/lib/orders/post-payment.server";
import { fulfillPromotionFromStripeSession } from "@/lib/promotions/service";
import { fulfillSellerPromotionFromStripeSession } from "@/lib/promotions/seller-promotions";
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
import {
  confirmWithdrawalCompleted,
  rollbackWithdrawal,
} from "@/lib/wallet/store";

function paymentIntentIdFrom(
  value: string | Stripe.PaymentIntent | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * Fail-closed: only settle wallet withdrawals when Stripe metadata uniquely
 * identifies the pending row. Uncertain payouts stay pending (never auto-complete).
 */
async function syncWalletWithdrawalFromPayout(
  eventType: "payout.paid" | "payout.failed",
  payout: Stripe.Payout,
): Promise<void> {
  const userId = payout.metadata?.userId?.trim() || null;
  const transactionId = payout.metadata?.walletTransactionId?.trim() || null;

  if (!userId || !transactionId) {
    logStripeWebhookEvent(
      "Payout event ignored — missing walletTransactionId/userId metadata",
      { eventType, payoutId: payout.id },
      "warn",
    );
    return;
  }

  if (eventType === "payout.paid") {
    // Idempotent confirm — may already be completed after transfer.create confirmation.
    const ok = await confirmWithdrawalCompleted({
      userId,
      transactionId,
      stripeTransferId: payout.id,
    });
    logStripeWebhookEvent("Withdrawal confirm from payout.paid", {
      payoutId: payout.id,
      transactionId,
      confirmed: ok,
    });
    return;
  }

  // payout.failed: only roll back while still pending. If already completed,
  // funds may sit on Connect — never invent Available credit (uncertainty rule).
  const ok = await rollbackWithdrawal({
    userId,
    transactionId,
    reason: `payout_failed:${payout.id}:${payout.failure_code ?? "unknown"}`,
  });
  logStripeWebhookEvent("Withdrawal rollback from payout.failed", {
    payoutId: payout.id,
    transactionId,
    rolledBack: ok,
  });
}

async function syncRefundRecord(refund: Stripe.Refund): Promise<void> {
  const paymentIntentId = paymentIntentIdFrom(refund.payment_intent);
  if (!paymentIntentId || !refund.id) {
    return;
  }
  await syncStripeRefundFromCharge({
    paymentIntentId,
    refundId: refund.id,
    amount: Math.round(refund.amount) / 100,
    stripeStatus: refund.status,
    failureReason: refund.failure_reason ?? null,
  });
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

  if (session.metadata?.checkoutType === "seller_promotion") {
    await fulfillSellerPromotionFromStripeSession(session);
    await recordPlatformAnalyticsEvent({ domain: "promotions", metric: "seller_checkout_completed" });
    return;
  }

  if (session.metadata?.checkoutType === "order") {
    const result = await fulfillOrderFromStripeSession(session);
    if (!result.success) {
      const { isItemJustSoldError } = await import(
        "@/lib/checkout/checkout-race-condition-v1"
      );
      if (isItemJustSoldError(result.error)) {
        logStripeWebhookEvent("checkout.session.completed ITEM_JUST_SOLD — refunded", {
          sessionId: session.id,
          error: result.error,
        });
        return;
      }
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
 * Wallet Security Certification v1.0 — durable event idempotency.
 */
export async function processStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  logStripeWebhookEvent("Received event", { eventId: event.id, eventType: event.type });

  const admin = createAdminClient();
  const { data: claimed, error: claimError } = await admin
    .from("stripe_webhook_events")
    .insert({
      event_id: event.id,
      event_type: event.type,
      status: "processing",
    })
    .select("event_id");

  if (claimError) {
    // Unique violation → already processed or in-flight (replay / retry protection).
    if (claimError.code === "23505") {
      logStripeWebhookEvent("Duplicate webhook skipped", {
        eventId: event.id,
        eventType: event.type,
      });
      return;
    }
    throw claimError;
  }

  if (!claimed?.length) {
    return;
  }

  try {
    await dispatchStripeWebhookEvent(event);
    await admin
      .from("stripe_webhook_events")
      .update({ status: "completed", processed_at: new Date().toISOString() })
      .eq("event_id", event.id);
  } catch (error) {
    // Release claim so Stripe retries can re-process (safe failure + recoverable).
    await admin.from("stripe_webhook_events").delete().eq("event_id", event.id);
    throw error;
  }
}

async function dispatchStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    }
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.checkoutType === "order") {
        if (session.metadata.checkoutSessionId) {
          const {
            CHECKOUT_SESSION_ENGINE_getByPublicId,
            CHECKOUT_SESSION_ENGINE_destroy,
          } = await import("@/lib/checkout/engines/checkout-session-engine-v1");
          const row = await CHECKOUT_SESSION_ENGINE_getByPublicId(
            session.metadata.checkoutSessionId,
          );
          if (row && row.status === "open") {
            await CHECKOUT_SESSION_ENGINE_destroy({
              session: row,
              status: event.type === "checkout.session.expired" ? "expired" : "cancelled",
            });
          }
        } else if (session.metadata.orderId) {
          await cancelPendingOrder(session.metadata.orderId);
        }
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
      const checkoutSessionId = paymentIntent.metadata?.checkoutSessionId;
      if (checkoutSessionId) {
        const { createOrderFromPaidCheckoutSession } = await import(
          "@/lib/orders/create-order-from-checkout-session.server"
        );
        const { parseConfirmedShippingQuotePayloadFromMetadata } = await import(
          "@/lib/shipping/selected-shipping-quote-contract-v1"
        );
        const result = await createOrderFromPaidCheckoutSession({
          checkoutSessionPublicId: checkoutSessionId,
          shippingAddressId: paymentIntent.metadata?.shippingAddressId || null,
          deliveryCarrier: paymentIntent.metadata?.deliveryCarrier || null,
          selectedShippingQuoteId: paymentIntent.metadata?.shippingQuoteId || null,
          selectedShippingQuotePayload: parseConfirmedShippingQuotePayloadFromMetadata({
            selectedQuoteId: paymentIntent.metadata?.shippingQuoteId || null,
            shippingOptionCode: paymentIntent.metadata?.shippingOptionCode || null,
            contractId: paymentIntent.metadata?.shippingContractId || null,
          }),
          stripePaymentIntentId: paymentIntent.id,
        });
        if (!result.success) {
          const { isItemJustSoldError, CHECKOUT_RACE_CONDITION_V1 } = await import(
            "@/lib/checkout/checkout-race-condition-v1"
          );
          if (isItemJustSoldError(result.error)) {
            const {
              CHECKOUT_SESSION_ENGINE_getByPublicId,
              CHECKOUT_SESSION_ENGINE_destroy,
            } = await import("@/lib/checkout/engines/checkout-session-engine-v1");
            const row = await CHECKOUT_SESSION_ENGINE_getByPublicId(checkoutSessionId);
            if (row && row.status === "open") {
              await CHECKOUT_SESSION_ENGINE_destroy({ session: row, status: "cancelled" });
            }
            try {
              const { getStripeClient, isStripeConfigured } = await import("@/lib/stripe/server");
              if (isStripeConfigured() && !paymentIntent.id.startsWith("pi_virtual_")) {
                const stripe = getStripeClient();
                await stripe.refunds.create(
                  {
                    payment_intent: paymentIntent.id,
                    reason: "requested_by_customer",
                    metadata: {
                      reason: CHECKOUT_RACE_CONDITION_V1.conflictCode,
                      checkoutSessionId,
                    },
                  },
                  { idempotencyKey: `item-just-sold-refund-${paymentIntent.id}` },
                );
              }
            } catch (refundError) {
              console.error(
                "[stripe-webhook] ITEM_JUST_SOLD refund failed:",
                refundError instanceof Error ? refundError.message : refundError,
              );
            }
            logStripeWebhookEvent("payment_intent.succeeded ITEM_JUST_SOLD — refunded", {
              checkoutSessionId,
              paymentIntentId: paymentIntent.id,
            });
            break;
          }
          throw new Error(
            result.error ?? "Order create failed after payment_intent.succeeded.",
          );
        }
        logStripeWebhookEvent("payment_intent.succeeded created order from checkout session", {
          checkoutSessionId,
          orderId: result.orderId,
          paymentIntentId: paymentIntent.id,
        });
      } else {
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
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      if (paymentIntent.metadata?.checkoutSessionId) {
        const {
          CHECKOUT_SESSION_ENGINE_getByPublicId,
          CHECKOUT_SESSION_ENGINE_destroy,
        } = await import("@/lib/checkout/engines/checkout-session-engine-v1");
        const row = await CHECKOUT_SESSION_ENGINE_getByPublicId(
          paymentIntent.metadata.checkoutSessionId,
        );
        if (row && row.status === "open") {
          await CHECKOUT_SESSION_ENGINE_destroy({ session: row, status: "cancelled" });
        }
      } else if (paymentIntent.metadata?.orderId) {
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
      const refund = charge.refunds?.data[0];
      if (paymentIntentId && refund?.id) {
        await syncStripeRefundFromCharge({
          paymentIntentId,
          refundId: refund.id,
          amount: Math.round(refund.amount) / 100,
          stripeStatus: refund.status,
          failureReason: refund.failure_reason ?? null,
        });
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
      await syncWalletWithdrawalFromPayout(event.type, payout);
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
