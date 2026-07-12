"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CanonicalButton } from "@/src/components/canonical";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { useToast } from "@/components/ui/Toast";
import { trackTransactionHubMakeOffer } from "@/lib/transaction-hub/analytics";
import type { OfferComposerProduct } from "@/lib/transaction-hub/product-action-bar";

type OfferComposerSheetProps = {
  open: boolean;
  onClose: () => void;
  product: OfferComposerProduct;
  conversationId?: string;
  onOfferSent?: (context: { conversationHref?: string }) => void;
};

const priceFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function OfferComposerSheet({
  open,
  onClose,
  product,
  conversationId,
  onOfferSent,
}: OfferComposerSheetProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const parsed = Number.parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      pushToast({ title: "Enter a valid offer amount.", variant: "error" });
      return;
    }

    if (parsed >= product.price) {
      pushToast({
        title: "Offer must be below the listing price.",
        variant: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          amount: parsed,
          message: message.trim() || undefined,
          conversationId,
        }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !payload.success) {
        pushToast({
          title: payload.error ?? "Unable to submit offer.",
          variant: "error",
        });
        return;
      }

      trackTransactionHubMakeOffer(
        {
          conversationId: conversationId ?? "product-detail",
          productSlug: product.slug,
          productId: product.id,
        },
        parsed,
      );

      let conversationHref: string | undefined;
      try {
        const chatResponse = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productSlug: product.slug }),
        });
        const chatPayload = (await chatResponse.json()) as { href?: string };
        conversationHref = chatPayload.href;
      } catch {
        conversationHref = undefined;
      }

      pushToast({
        title: "Offer sent",
        description: "Continue the conversation in chat.",
        variant: "success",
      });

      setAmount("");
      setMessage("");
      onClose();

      if (onOfferSent) {
        onOfferSent({ conversationHref });
        return;
      }

      if (conversationHref) {
        router.push(conversationHref);
      }
    } catch {
      pushToast({
        title: "Unable to submit offer.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    amount,
    conversationId,
    message,
    onClose,
    onOfferSent,
    product.id,
    product.price,
    product.slug,
    pushToast,
    router,
  ]);

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      variant="sheet"
      zIndex={210}
      ariaLabel="Make offer"
      lockScroll
    >
      <div className="flex flex-col gap-ds-4 p-ds-4">
        <div className="flex flex-col gap-ds-1">
          <h2 className="text-lg font-semibold text-text-primary">Make Offer</h2>
          <p className="text-sm text-text-secondary">
            Listing price: {priceFormatter.format(product.price)}
          </p>
        </div>

        <label className="flex flex-col gap-ds-1 text-left">
          <span className="text-sm font-medium text-text-primary">Your offer (£)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            className="min-h-[44px] rounded-ds-md border border-border px-ds-3 text-base"
            value={amount}
            disabled={submitting}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
          />
        </label>

        <label className="flex flex-col gap-ds-1 text-left">
          <span className="text-sm font-medium text-text-primary">Message (optional)</span>
          <textarea
            className="min-h-[88px] rounded-ds-md border border-border px-ds-3 py-ds-2 text-base"
            value={message}
            disabled={submitting}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Add a note for the seller"
            maxLength={500}
          />
        </label>

        <div className="flex flex-col gap-ds-2">
          <CanonicalButton fullWidth loading={submitting} onClick={() => void handleSubmit()}>
            Submit Offer
          </CanonicalButton>
          <CanonicalButton fullWidth variant="ghost" disabled={submitting} onClick={onClose}>
            Cancel
          </CanonicalButton>
        </div>
      </div>
    </ModalContainer>
  );
}
