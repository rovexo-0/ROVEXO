"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LockLineIcon } from "@/components/icons/RvxLineIcons";
import { PublishedCheckmark } from "@/features/sell/components/PublishedCheckmark";
import { formatListingPrice } from "@/lib/listing-card/format";

type CheckoutSuccessViewProps = {
  productTitle: string;
  totalPaid: number;
  /** Present only when server already verified Absolute Law DONE gates. */
  conversationId?: string | null;
  /** Order id for silent DONE-readiness poll until allPass. */
  orderId?: string | null;
  /** Server-side gate result — DONE must not exist until true. */
  doneReady?: boolean;
};

/**
 * Absolute Law FINAL LOCK — Payment Success.
 * DONE exists only when payment + order + transaction + conversation + messages + lifecycle = PASS.
 * INTERZIS: Home · Orders · Inbox · retry copy · wait copy · missing-hub copy.
 */
export function CheckoutSuccessView({
  productTitle,
  totalPaid,
  conversationId: initialConversationId = null,
  orderId = null,
  doneReady: initialDoneReady = false,
}: CheckoutSuccessViewProps) {
  const router = useRouter();
  /** Poll may upgrade readiness; until then derive from server props (no syncing effect). */
  const [polled, setPolled] = useState<{
    doneReady: boolean;
    conversationId: string;
  } | null>(null);

  const conversationId =
    polled?.conversationId ?? (initialConversationId?.trim() ?? "");
  const doneReady =
    polled?.doneReady ?? (initialDoneReady && Boolean(initialConversationId?.trim()));

  useEffect(() => {
    if (doneReady || !orderId?.trim()) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/checkout/done-ready?order_id=${encodeURIComponent(orderId.trim())}`,
          { cache: "no-store", headers: { Accept: "application/json" } },
        );
        if (!res.ok || cancelled) return;
        const payload = (await res.json()) as {
          allPass?: boolean;
          conversationId?: string | null;
        };
        if (payload.allPass && payload.conversationId?.trim()) {
          setPolled({
            doneReady: true,
            conversationId: payload.conversationId.trim(),
          });
          return;
        }
      } catch {
        // Silent — Absolute Law forbids user-facing wait / error destinations.
      }
      if (!cancelled) {
        timer = setTimeout(() => {
          void poll();
        }, 1200);
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [doneReady, orderId]);

  const handleDone = useCallback(() => {
    if (!doneReady || !conversationId) return;
    router.replace(`/inbox/conversation/${conversationId}`);
  }, [conversationId, doneReady, router]);

  /* Absolute Law: AUTO_OPEN Transaction Conversation when all DONE gates PASS. */
  useEffect(() => {
    if (!doneReady || !conversationId) return;
    router.replace(`/inbox/conversation/${conversationId}`);
  }, [conversationId, doneReady, router]);

  return (
    <section
      className="ckt-v1__success flex w-full flex-col items-center justify-center px-ds-2 py-ds-8 text-center"
      data-checkout-success="v1.0"
      data-checkout-absolute-law="1.0-final-lock"
      data-done-equals-transaction-conversation="true"
      data-inbox-fallback="forbidden"
      data-done-ready={doneReady ? "true" : "false"}
      aria-labelledby="checkout-success-heading"
    >
      <PublishedCheckmark />

      <h2
        id="checkout-success-heading"
        className="mt-ds-4 text-[20px] font-semibold tracking-tight text-text-primary"
      >
        Payment Successful
      </h2>

      <p className="mt-ds-2 max-w-[280px] text-sm text-text-secondary">
        Thank you for shopping with Rovexo.
      </p>

      <div className="mt-ds-6 w-full max-w-none px-ds-2">
        <p className="text-base font-semibold text-text-primary">{productTitle}</p>
        <p className="mt-ds-2 text-lg font-semibold text-primary">
          {formatListingPrice(totalPaid)}
        </p>
      </div>

      <div className="mt-ds-8 w-full max-w-none px-ds-2">
        {doneReady ? (
          <button
            type="button"
            className="ckt-v1__cta"
            onClick={handleDone}
            aria-label="Done — open transaction conversation"
          >
            DONE
          </button>
        ) : null}
        <p className="ckt-v1__secure mt-ds-4">
          <LockLineIcon width={14} height={14} aria-hidden />
          Secure Checkout
          <span className="ckt-v1__secure-sub">Your payment is protected.</span>
        </p>
      </div>
    </section>
  );
}
