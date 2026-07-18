"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { CheckoutProcessingOverlay } from "@/features/checkout/components/CheckoutProcessingOverlay";
import { CheckoutWizardV1 } from "@/features/checkout/components/CheckoutWizardV1";
import { useCheckoutForm } from "@/features/checkout/hooks/use-checkout-form";
import type { CheckoutDraft } from "@/features/checkout/types";
import type { ProductDetail } from "@/lib/products/types";
import {
  clearHubCheckoutDraft,
  loadHubCheckoutDraft,
  persistHubCheckoutDraft,
} from "@/lib/transaction-hub/checkout-validation";
import { trackTransactionHubCheckoutStarted } from "@/lib/transaction-hub/analytics";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import { getActiveMarket } from "@/lib/seo/markets";

type CheckoutBootstrap = {
  product: ProductDetail;
  initialDraft: CheckoutDraft;
  buyerPhone: string | null;
  liveShippingEnabled: boolean;
};

type CheckoutHubSheetProps = {
  open: boolean;
  onClose: () => void;
  productSlug: string;
  conversationId?: string;
  /** Locked accepted offer — checkout must price from this, not listing price. */
  offerId?: string | null;
  acceptedOfferPrice?: number | null;
};

export function CheckoutHubSheet({
  open,
  onClose,
  productSlug,
  conversationId,
  offerId = null,
  acceptedOfferPrice = null,
}: CheckoutHubSheetProps) {
  const router = useRouter();
  const [bootstrap, setBootstrap] = useState<CheckoutBootstrap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bootstrap fetch on sheet open
    setLoading(true);
    setError(null);

    void fetch(
      `/api/transaction-hub/checkout?slug=${encodeURIComponent(productSlug)}${conversationId ? `&conversationId=${encodeURIComponent(conversationId)}` : ""}`,
    )
      .then(async (response) => {
        const payload = (await response.json()) as CheckoutBootstrap & {
          success?: boolean;
          error?: string;
          completionRedirect?: string;
        };

        if (cancelled) return;

        if (!response.ok || !payload.success || !payload.product) {
          if (payload.completionRedirect) {
            router.push(payload.completionRedirect);
            onClose();
            return;
          }
          setError(payload.error ?? "Unable to open checkout.");
          return;
        }

        const restoredDraft = loadHubCheckoutDraft(productSlug);
        const lockedPrice =
          acceptedOfferPrice != null &&
          Number.isFinite(acceptedOfferPrice) &&
          acceptedOfferPrice > 0
            ? Math.round(acceptedOfferPrice * 100) / 100
            : null;

        setBootstrap({
          product:
            lockedPrice != null
              ? { ...payload.product, price: lockedPrice }
              : payload.product,
          initialDraft: restoredDraft ?? payload.initialDraft,
          buyerPhone: payload.buyerPhone,
          liveShippingEnabled: payload.liveShippingEnabled,
        });

        trackTransactionHubCheckoutStarted({
          conversationId: conversationId ?? "product-detail",
          productSlug,
          productId: payload.product.id,
        });

        const { currency } = getActiveMarket();
        trackGaEvent("begin_checkout", {
          item_id: payload.product.id,
          item_name: payload.product.title,
          value: lockedPrice ?? payload.product.price,
          currency,
          source: "transaction_hub_embedded",
        });
      })
      .catch(() => {
        if (!cancelled) setError("Unable to open checkout.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [acceptedOfferPrice, conversationId, onClose, open, productSlug, router]);

  const handleDraftChange = useCallback(
    (draft: CheckoutDraft) => {
      persistHubCheckoutDraft(productSlug, draft);
    },
    [productSlug],
  );

  if (!open) return null;

  return (
    <ModalContainer
      open
      onClose={onClose}
      variant="fullscreen"
      zIndex={230}
      ariaLabel="Checkout"
      lockScroll
      panelClassName="thub-v1__checkout-panel"
    >
      {loading ? (
        <div className="flex min-h-[50dvh] items-center justify-center p-ds-6 text-sm text-text-secondary">
          Loading checkout…
        </div>
      ) : null}

      {error ? (
        <div className="flex min-h-[40dvh] flex-col items-center justify-center gap-ds-3 p-ds-6 text-center">
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
          <button type="button" className="text-sm font-semibold text-primary" onClick={onClose}>
            Back to chat
          </button>
        </div>
      ) : null}

      {bootstrap ? (
        <CheckoutHubContent
          bootstrap={bootstrap}
          conversationId={conversationId}
          offerId={offerId}
          onClose={() => {
            clearHubCheckoutDraft(productSlug);
            onClose();
          }}
          onDraftChange={handleDraftChange}
        />
      ) : null}
    </ModalContainer>
  );
}

function CheckoutHubContent({
  bootstrap,
  conversationId,
  offerId,
  onClose,
  onDraftChange,
}: {
  bootstrap: CheckoutBootstrap;
  conversationId?: string;
  offerId?: string | null;
  onClose: () => void;
  onDraftChange: (draft: CheckoutDraft) => void;
}) {
  const form = useCheckoutForm(bootstrap.product, bootstrap.initialDraft, {
    liveShippingEnabled: bootstrap.liveShippingEnabled,
    hubConversationId: conversationId,
    offerId,
    onDraftChange,
  });

  return (
    <div className="thub-v1__checkout" data-transaction-hub-checkout="embedded">
      {form.errorMessage ? (
        <div className="w-full px-ds-4 pt-ds-3">
          <p className="rounded-ds-md border border-destructive/30 bg-destructive/5 px-ds-3 py-ds-2 text-sm text-destructive" role="alert">
            {form.errorMessage}
          </p>
        </div>
      ) : null}

      <CheckoutWizardV1
        product={bootstrap.product}
        form={form}
        buyerPhone={bootstrap.buyerPhone}
        embedded
        onClose={onClose}
      />

      {form.isSubmitting ? <CheckoutProcessingOverlay /> : null}
    </div>
  );
}
