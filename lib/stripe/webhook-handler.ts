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
import {
  extractConnectAccountIdFromEvent,
  syncConnectAccountFromStripeAccountId,
} from "@/lib/stripe/connect";
import {
  reverseFailedStripeTransfer,
  syncStripeRefundFromCharge,
} from "@/lib/stripe/webhook-sync";
import { syncChargebackTrustFromDispute } from "@/lib/trust/chargeback";
import {
  confirmWithdrawalBankCompleted,
  markWithdrawalPayoutFailed,
} from "@/lib/wallet/store";
import { isStripePayoutId } from "@/lib/stripe/stripe-object-ids-v1";
import { roundWalletMoney } from "@/lib/wallet/security";

function paymentIntentIdFrom(
  value: string | Stripe.PaymentIntent | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

type WithdrawalCorrelation = {
  userId: string;
  transactionId: string;
  method: "metadata" | "connect_amount_unique";
};

/**
 * Safe correlation for Express automatic payouts.
 * Prefer Transfer metadata on the payout when present.
 * Else: connected account + exact amount/currency + single awaiting pending row.
 * Never correlate on amount alone. Never fabricate multi-match.
 */
async function resolveWithdrawalForPayout(
  payout: Stripe.Payout,
  connectedAccountId: string | null | undefined,
): Promise<WithdrawalCorrelation | null> {
  const metaUserId = payout.metadata?.userId?.trim() || null;
  const metaTxId = payout.metadata?.walletTransactionId?.trim() || null;
  if (metaUserId && metaTxId) {
    return {
      userId: metaUserId,
      transactionId: metaTxId,
      method: "metadata",
    };
  }

  if (!connectedAccountId) {
    logStripeWebhookEvent(
      "Payout correlation skipped — no Connect account on event and no metadata",
      { payoutId: payout.id },
      "warn",
    );
    return null;
  }

  const admin = createAdminClient();
  const { data: sellers } = await admin
    .from("seller_profiles")
    .select(
      "id, stripe_connect_account_id, stripe_connect_account_id_individual, stripe_connect_account_id_business",
    )
    .or(
      [
        `stripe_connect_account_id.eq.${connectedAccountId}`,
        `stripe_connect_account_id_individual.eq.${connectedAccountId}`,
        `stripe_connect_account_id_business.eq.${connectedAccountId}`,
      ].join(","),
    )
    .limit(2);

  if (!sellers?.length || sellers.length > 1) {
    logStripeWebhookEvent(
      "Payout correlation skipped — Connect account seller unresolved",
      {
        payoutId: payout.id,
        connectedAccountId,
        sellerMatches: sellers?.length ?? 0,
      },
      "warn",
    );
    return null;
  }

  const userId = sellers[0].id;
  const amountGbp = roundWalletMoney(Math.abs(payout.amount) / 100);
  const currency = (payout.currency ?? "").toLowerCase();
  if (currency !== "gbp") {
    logStripeWebhookEvent(
      "Payout correlation skipped — non-GBP",
      { payoutId: payout.id, currency },
      "warn",
    );
    return null;
  }

  const { data: candidates } = await admin
    .from("wallet_transactions")
    .select("id, amount, status, type, stripe_transfer_id, stripe_payout_id, description")
    .eq("user_id", userId)
    .eq("type", "withdrawal")
    .eq("status", "pending")
    .not("stripe_transfer_id", "is", null)
    .is("stripe_payout_id", null);

  const matches = (candidates ?? []).filter((row) => {
    const rowAmt = roundWalletMoney(Math.abs(Number(row.amount)));
    return rowAmt === amountGbp;
  });

  if (matches.length !== 1) {
    logStripeWebhookEvent(
      "Payout correlation skipped — not uniquely attributable (Express auto-payout limitation)",
      {
        payoutId: payout.id,
        connectedAccountId,
        amountGbp,
        candidateCount: matches.length,
      },
      "warn",
    );
    return null;
  }

  return {
    userId,
    transactionId: matches[0].id,
    method: "connect_amount_unique",
  };
}

/**
 * Fail-closed wallet sync from Express payout webhooks.
 * Transfer id and payout id stay separate. Transfer success ≠ bank paid.
 */
async function syncWalletWithdrawalFromPayout(
  eventType: "payout.paid" | "payout.failed",
  payout: Stripe.Payout,
  connectedAccountId: string | null | undefined,
): Promise<void> {
  if (!isStripePayoutId(payout.id)) {
    return;
  }

  const correlated = await resolveWithdrawalForPayout(payout, connectedAccountId);
  if (!correlated) {
    return;
  }

  const { userId, transactionId, method } = correlated;

  if (eventType === "payout.paid") {
    const ok = await confirmWithdrawalBankCompleted({
      userId,
      transactionId,
      stripePayoutId: payout.id,
    });
    logStripeWebhookEvent("Withdrawal bank confirm from payout.paid", {
      payoutId: payout.id,
      transactionId,
      correlation: method,
      confirmed: ok,
    });
    return;
  }

  // payout.failed: mark failure accurately; never invent Available credit / reverse Transfer.
  const ok = await markWithdrawalPayoutFailed({
    userId,
    transactionId,
    stripePayoutId: payout.id,
    failureCode: payout.failure_code ?? "unknown",
  });
  logStripeWebhookEvent("Withdrawal payout.failed recorded (no Available restore)", {
    payoutId: payout.id,
    transactionId,
    correlation: method,
    recorded: ok,
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
    const handling = await dispatchStripeWebhookEvent(event);
    await admin
      .from("stripe_webhook_events")
      .update({
        status: "completed",
        handling_result: handling,
        processed_at: new Date().toISOString(),
      })
      .eq("event_id", event.id);
  } catch (error) {
    // Release claim so Stripe retries can re-process (safe failure + recoverable).
    await admin.from("stripe_webhook_events").delete().eq("event_id", event.id);
    throw error;
  }
}

async function dispatchStripeWebhookEvent(
  event: Stripe.Event,
): Promise<"handled" | "ignored_unhandled_type"> {
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
      // Accounts V2: never trust V1 snapshot fields on the event object.
      // Identify account id → v2.core.accounts.retrieve(+includes) → map → persist.
      const accountId = extractConnectAccountIdFromEvent(event);
      if (accountId) {
        await syncConnectAccountFromStripeAccountId(accountId);
      }
      break;
    }
    case "payout.paid":
    case "payout.failed": {
      const payout = event.data.object as Stripe.Payout;
      const connectedAccountId =
        typeof event.account === "string" ? event.account : null;
      logStripeWebhookEvent(`Connect payout ${event.type}`, {
        payoutId: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        destination: payout.destination,
        connectedAccountId,
      });
      await syncWalletWithdrawalFromPayout(event.type, payout, connectedAccountId);
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
      return "ignored_unhandled_type";
  }
  return "handled";
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
