"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PublishedCheckmark } from "@/features/sell/components/PublishedCheckmark";

type CheckoutSuccessViewProps = {
  orderNumber: string;
  orderId: string;
  conversationId?: string | null;
  estimatedDelivery?: string | null;
};

/** Sprint 2 success screen — order, conversation, shopping CTAs. */
export function CheckoutSuccessView({
  orderNumber,
  orderId,
  conversationId,
  estimatedDelivery,
}: CheckoutSuccessViewProps) {
  return (
    <section
      className="ckt-v1__success flex w-full flex-col items-center justify-center px-ds-2 py-ds-8 text-center"
      data-checkout-success="v1.0"
      aria-labelledby="checkout-success-heading"
    >
      <PublishedCheckmark />

      <h2 id="checkout-success-heading" className="mt-ds-4 text-[16px] font-semibold text-text-primary">
        Payment successful
      </h2>

      <p className="mt-ds-2 text-sm text-text-secondary">Order #{orderNumber}</p>
      {estimatedDelivery ? (
        <p className="mt-ds-1 text-sm text-text-secondary">Estimated delivery: {estimatedDelivery}</p>
      ) : (
        <p className="mt-ds-1 text-sm text-text-secondary">Tracking will update once the seller ships.</p>
      )}

      <div className="mt-ds-6 flex w-full max-w-none flex-col gap-ds-3">
        <Link href={`/orders/${orderId}?placed=1`} className="block w-full">
          <Button variant="primary" fullWidth size="lg" className="min-h-ds-7 rounded-ds-lg text-base">
            View Order
          </Button>
        </Link>

        {conversationId ? (
          <Link href={`/inbox/conversation/${conversationId}`} className="block w-full">
            <Button variant="secondary" fullWidth size="lg" className="min-h-ds-7 rounded-ds-lg text-base">
              Open Conversation
            </Button>
          </Link>
        ) : null}

        <Link href="/" className="block w-full">
          <Button variant="secondary" fullWidth size="lg" className="min-h-ds-7 rounded-ds-lg text-base">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </section>
  );
}
