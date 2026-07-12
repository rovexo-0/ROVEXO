"use client";

import { CanonicalInfoBlock, CanonicalModal } from "@/src/components/canonical";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";

import { getStripePublishableKey, isStripePublishableKeyConfigured } from "@/lib/stripe/client";

type CardSetupSheetProps = {
  open: boolean;
  clientSecret: string;
  onClose: () => void;
  onComplete: (setupIntentId: string) => Promise<void>;
};

export function CardSetupSheet({ open, clientSecret, onClose, onComplete }: CardSetupSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let mountContainer: HTMLDivElement | null = null;

    void (async () => {
      if (!isStripePublishableKeyConfigured()) {
        if (!cancelled) {
          setError("Stripe publishable key is missing (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).");
        }
        return;
      }

      const stripe = await loadStripe(getStripePublishableKey());
      if (!stripe || cancelled) {
        if (!cancelled) {
          setError("Unable to load Stripe.js. Check your connection and try again.");
        }
        return;
      }

      stripeRef.current = stripe;
      const elements = stripe.elements({
        clientSecret,
        appearance: { theme: "stripe" },
      });
      elementsRef.current = elements;

      const paymentElement = elements.create("payment");
      const container = containerRef.current;
      if (!container) return;
      mountContainer = container;
      container.innerHTML = "";
      paymentElement.mount(container);
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
      setReady(false);
      stripeRef.current = null;
      elementsRef.current = null;
      if (mountContainer) {
        mountContainer.innerHTML = "";
      }
    };
  }, [clientSecret, open]);

  const handleSave = useCallback(async () => {
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements) {
      setError("Stripe Elements is still loading. Wait a moment and try again.");
      return;
    }

    setBusy(true);
    setError(null);

    const result = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Card could not be saved.");
      setBusy(false);
      return;
    }

    const setupIntentId = result.setupIntent?.id;
    if (!setupIntentId || result.setupIntent.status !== "succeeded") {
      setError("Card setup did not complete. Please try again.");
      setBusy(false);
      return;
    }

    try {
      await onComplete(setupIntentId);
      onClose();
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "Unable to save card.");
    } finally {
      setBusy(false);
    }
  }, [onClose, onComplete]);

  return (
    <CanonicalModal
      open={open}
      variant="information"
      title="Add card"
      cancelLabel="Cancel"
      confirmLabel={busy ? "Saving…" : "Save card"}
      loading={busy}
      confirmDisabled={busy || !ready}
      onClose={onClose}
      onConfirm={() => void handleSave()}
    >
      <div className="flex flex-col gap-ds-4">
        <CanonicalInfoBlock variant="description">
          Your card is saved securely with Stripe for faster checkout.
        </CanonicalInfoBlock>
        <div ref={containerRef} className="min-h-[8rem]" key={clientSecret} />
        {error ? <CanonicalInfoBlock variant="error">{error}</CanonicalInfoBlock> : null}
      </div>
    </CanonicalModal>
  );
}
