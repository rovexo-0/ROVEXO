"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalContainer } from "@/components/ui/ModalContainer";
import {
  buildBuyNowCheckoutHref,
  useBuyNowNavigation,
} from "@/features/checkout/hooks/use-buy-now-navigation";

type CheckoutHubSheetProps = {
  open: boolean;
  onClose: () => void;
  productSlug: string;
  conversationId?: string;
  /** Locked accepted offer — checkout must price from this, not listing price. */
  offerId?: string | null;
  acceptedOfferPrice?: number | null;
  /**
   * Demo / known-invalid resume — never call Buy Now; show canonical session fail-closed.
   * Live failures on resume also map to the same Owner copy (never generic Sorry).
   */
  sessionUnavailable?: boolean;
};

/** Blood XXIV + Owner freeze blocker — resume fail-closed (never generic runtime dialogs). */
export const CHECKOUT_RESUME_SESSION_UNAVAILABLE = {
  code: "RVX-2010",
  title: "Checkout session is no longer available.",
  body: "Return to your Order and start Checkout again.",
} as const;

/**
 * Blood XXIV — hub resume no longer embeds a parallel checkout wizard.
 * Opens Buy Now guard → full-page `/checkout/{slug}` only.
 * Forbidden: payment without order guard · duplicate checkout UI · generic errors.
 */
export function CheckoutHubSheet({
  open,
  onClose,
  productSlug,
  conversationId,
  offerId = null,
  sessionUnavailable = false,
}: CheckoutHubSheetProps) {
  const router = useRouter();
  const { executeBuyNow } = useBuyNowNavigation();
  const [showSessionUnavailable, setShowSessionUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    if (sessionUnavailable) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resume fail-closed opens with sheet
      setShowSessionUnavailable(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setShowSessionUnavailable(false);

    void (async () => {
      const result = await executeBuyNow({
        productSlug,
        offerId,
        conversationId: conversationId ?? null,
      });

      if (cancelled) return;

      if (!result.ok) {
        /* Resume path: failed guard → canonical session fail-closed (never Buy Now public Sorry dialog). */
        setShowSessionUnavailable(true);
        setLoading(false);
        return;
      }

      onClose();
      router.push(buildBuyNowCheckoutHref(productSlug, result.checkoutPath));
    })().catch(() => {
      if (!cancelled) {
        setShowSessionUnavailable(true);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    conversationId,
    executeBuyNow,
    offerId,
    onClose,
    open,
    productSlug,
    router,
    sessionUnavailable,
  ]);

  if (!open) return null;

  return (
    <>
      <ModalContainer
        open={loading && !showSessionUnavailable}
        onClose={onClose}
        variant="fullscreen"
        zIndex={230}
        ariaLabel="Checkout"
        lockScroll
        panelClassName="thub-v1__checkout-panel"
      >
        <div className="flex min-h-[50dvh] items-center justify-center p-ds-6 text-sm text-text-secondary">
          Opening checkout…
        </div>
      </ModalContainer>

      <ModalContainer
        open={showSessionUnavailable}
        onClose={onClose}
        variant="centered"
        zIndex={240}
        ariaLabel="Checkout unavailable"
        lockScroll
        panelClassName="bn-public-error"
      >
        <div
          className="bn-public-error__panel"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="checkout-resume-fail-title"
          data-checkout-resume-fail-closed="RVX-2010"
        >
          <p
            className="bn-public-error__title"
            data-rvx-code={CHECKOUT_RESUME_SESSION_UNAVAILABLE.code}
          >
            {CHECKOUT_RESUME_SESSION_UNAVAILABLE.code}
          </p>
          <p id="checkout-resume-fail-title" className="bn-public-error__body">
            {CHECKOUT_RESUME_SESSION_UNAVAILABLE.title}
          </p>
          <p className="bn-public-error__body">{CHECKOUT_RESUME_SESSION_UNAVAILABLE.body}</p>
          <button type="button" className="bn-public-error__ok" onClick={onClose}>
            OK
          </button>
        </div>
      </ModalContainer>
    </>
  );
}
