"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { triggerCommerceHaptic } from "@/lib/mobile-ui/haptic";
import {
  trackTransactionHubBuyNow,
  trackTransactionHubOfferOpened,
  trackTransactionHubViewListing,
} from "@/lib/transaction-hub/analytics";
import { PRODUCT_ACTION_BAR_VISUAL } from "@/lib/transaction-hub/product-action-bar";

type UseProductActionBarOptions = {
  productSlug: string;
  productId: string;
  canBuyNow: boolean;
  canMakeOffer: boolean;
  /** Return `true` when navigation away started — keeps loading until unmount. */
  onBuyNow: () => void | Promise<void | boolean>;
  onMakeOffer: () => void;
};

/**
 * Product sticky actions — Buy Now + Make Offer only.
 * Absolute Law: Buy Now ≠ Add to Cart. No cart hooks, sessions, or redirects.
 */
export function useProductActionBar({
  productSlug,
  productId,
  canBuyNow,
  canMakeOffer,
  onBuyNow,
  onMakeOffer,
}: UseProductActionBarOptions) {
  const [buyState, setBuyState] = useState<"idle" | "loading">("idle");
  const buyBusyRef = useRef(false);

  const analyticsContext = {
    conversationId: "product-detail",
    productSlug,
    productId,
  };

  useEffect(() => {
    trackTransactionHubViewListing(analyticsContext);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per listing
  }, [productId, productSlug]);

  const handleBuyNow = useCallback(() => {
    if (!canBuyNow || buyBusyRef.current) return;
    buyBusyRef.current = true;
    triggerCommerceHaptic();
    setBuyState("loading");
    trackTransactionHubBuyNow({
      conversationId: "product-detail",
      productSlug,
      productId,
    });
    void (async () => {
      let navigated = false;
      try {
        const result = await onBuyNow();
        navigated = result === true;
      } finally {
        if (navigated) {
          // Keep loading + disabled until Product page unmounts after checkout push.
          return;
        }
        window.setTimeout(() => {
          setBuyState("idle");
          buyBusyRef.current = false;
        }, PRODUCT_ACTION_BAR_VISUAL.releaseDurationMs);
      }
    })();
  }, [canBuyNow, onBuyNow, productId, productSlug]);

  const handleMakeOffer = useCallback(() => {
    if (!canMakeOffer) return;
    triggerCommerceHaptic();
    trackTransactionHubOfferOpened({
      conversationId: "product-detail",
      productSlug,
      productId,
    });
    onMakeOffer();
  }, [canMakeOffer, onMakeOffer, productId, productSlug]);

  return {
    buyState,
    handleBuyNow: canBuyNow ? handleBuyNow : undefined,
    handleMakeOffer: canMakeOffer ? handleMakeOffer : undefined,
  };
}
