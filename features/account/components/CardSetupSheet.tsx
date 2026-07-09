"use client";

import { useEffect, useRef, useState } from "react";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { Button } from "@/components/ui/Button";
import { getStripePublishableKey, isStripePublishableKeyConfigured } from "@/lib/stripe/client";

type CardSetupSheetProps = {
  open: boolean;
  clientSecret: string;
  onClose: () => void;
  onComplete: (setupIntentId: string) => Promise<void>;
};

type CardSetupStripeFieldsProps = {
  clientSecret: string;
  onClose: () => void;
  onComplete: (setupIntentId: string) => Promise<void>;
};

function CardSetupStripeFields({ clientSecret, onClose, onComplete }: CardSetupStripeFieldsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

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
      container.innerHTML = "";
      paymentElement.mount(container);
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
      stripeRef.current = null;
      elementsRef.current = null;
      const container = containerRef.current;
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [clientSecret]);

  const handleSave = async () => {
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
  };

  return (
    <>
      <div ref={containerRef} className="mt-ds-4 min-h-[8rem]" />

      {error ? <p className="mt-ds-3 text-sm text-danger">{error}</p> : null}

      <div className="mt-ds-5 flex flex-wrap justify-end gap-ds-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={() => void handleSave()} disabled={busy || !ready}>
          {busy ? "Saving…" : "Save card"}
        </Button>
      </div>
    </>
  );
}

export function CardSetupSheet({ open, clientSecret, onClose, onComplete }: CardSetupSheetProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[240] flex items-end justify-center bg-black/50 p-ds-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Add card"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-ds-xl bg-surface p-ds-5 shadow-ds-floating sm:rounded-ds-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-text-primary">Add card</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Your card is saved securely with Stripe for faster checkout.
        </p>

        <CardSetupStripeFields
          key={clientSecret}
          clientSecret={clientSecret}
          onClose={onClose}
          onComplete={onComplete}
        />
      </div>
    </div>
  );
}
