/**
 * Blood XXIV + Master Architecture — AUTO_CANCEL_ENGINE
 * 1) Expire Checkout Sessions (120s Absolute Law)
 * 2) Drain legacy awaiting_payment orders
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { cancelPendingOrder } from "@/lib/orders/checkout";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";
import { FINANCIAL_LOGGER } from "@/lib/checkout/engines/idempotency-engine-v1";
import {
  BUY_NOW_AUTO_CANCEL_MINUTES,
  CHECKOUT_SESSION_TTL_SECONDS,
  DB_PENDING_PAYMENT,
} from "@/lib/checkout/engines/status-map-v1";
import { CHECKOUT_SESSION_ENGINE_expireAll } from "@/lib/checkout/engines/checkout-session-engine-v1";

export { BUY_NOW_AUTO_CANCEL_MINUTES, CHECKOUT_SESSION_TTL_SECONDS };

export async function AUTO_CANCEL_ENGINE_run(): Promise<{
  cancelled: number;
  sessionsExpired: number;
}> {
  const sessions = await CHECKOUT_SESSION_ENGINE_expireAll();

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: expired } = await admin
    .from("orders")
    .select("id, stripe_session_id, stripe_payment_intent_id")
    .eq("status", DB_PENDING_PAYMENT)
    .lt("reserved_until", now);

  let cancelled = 0;
  for (const order of expired ?? []) {
    await AUTO_CANCEL_ENGINE_cancelOrder(order.id, {
      stripeSessionId: order.stripe_session_id,
      stripePaymentIntentId: order.stripe_payment_intent_id,
    });
    cancelled += 1;
  }

  FINANCIAL_LOGGER(
    "FINISHED",
    `auto-cancelled=${cancelled} sessions-expired=${sessions.expired}`,
  );
  return { cancelled, sessionsExpired: sessions.expired };
}

export async function AUTO_CANCEL_ENGINE_cancelOrder(
  orderId: string,
  stripe?: { stripeSessionId?: string | null; stripePaymentIntentId?: string | null },
): Promise<void> {
  if (isStripeConfigured()) {
    try {
      const stripeClient = getStripeClient();
      if (stripe?.stripeSessionId) {
        try {
          await stripeClient.checkout.sessions.expire(stripe.stripeSessionId);
        } catch {
          // Session may already be expired/consumed.
        }
      }
      if (stripe?.stripePaymentIntentId?.startsWith("pi_")) {
        try {
          await stripeClient.paymentIntents.cancel(stripe.stripePaymentIntentId);
        } catch {
          // PI may already be cancelled/succeeded.
        }
      }
    } catch {
      // Fail closed — still cancel local order.
    }
  }

  await cancelPendingOrder(orderId, "Auto-cancelled: payment window expired.", {
    initiatedBy: "system",
  });
  FINANCIAL_LOGGER("STOP", `auto-cancel order=${orderId}`);
}

export async function AUTO_CANCEL_ENGINE_isExpired(reservedUntil: string | null | undefined): Promise<boolean> {
  if (!reservedUntil) return true;
  return new Date(reservedUntil).getTime() <= Date.now();
}

/**
 * Blood XXIV Task 003 — cancel one expired PENDING_PAYMENT order now.
 * Vercel Hobby cron is daily; 15-minute unlock must not wait for that cron.
 */
export async function AUTO_CANCEL_ENGINE_cancelIfExpired(input: {
  orderId: string;
  reservedUntil: string | null | undefined;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}): Promise<boolean> {
  if (!(await AUTO_CANCEL_ENGINE_isExpired(input.reservedUntil))) {
    return false;
  }
  await AUTO_CANCEL_ENGINE_cancelOrder(input.orderId, {
    stripeSessionId: input.stripeSessionId,
    stripePaymentIntentId: input.stripePaymentIntentId,
  });
  return true;
}
