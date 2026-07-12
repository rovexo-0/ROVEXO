"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { triggerCommerceHaptic } from "@/lib/mobile-ui/haptic";
import {
  trackTransactionHubAddToCart,
  trackTransactionHubBuyNow,
  trackTransactionHubOfferOpened,
  trackTransactionHubViewListing,
} from "@/lib/transaction-hub/analytics";
import {
  addToCartFromHub,
  flushHubActionQueue,
  isProductInCart,
} from "@/lib/transaction-hub/cart-engine";
import type { ProductActionButtonState } from "@/lib/transaction-hub/product-action-bar";
import { PRODUCT_ACTION_BAR_VISUAL } from "@/lib/transaction-hub/product-action-bar";

type UseProductActionBarOptions = {
  productSlug: string;
  productId: string;
  canBuyNow: boolean;
  canAddToCart: boolean;
  canMakeOffer: boolean;
  onBuyNow: () => void;
  onMakeOffer: () => void;
  onCartSuccess?: (context?: { queued?: boolean }) => void;
  onCartError?: (message: string) => void;
};

export function useProductActionBar({
  productSlug,
  productId,
  canBuyNow,
  canAddToCart,
  canMakeOffer,
  onBuyNow,
  onMakeOffer,
  onCartSuccess,
  onCartError,
}: UseProductActionBarOptions) {
  const [buyState, setBuyState] = useState<"idle" | "loading">("idle");
  const [cartState, setCartState] = useState<ProductActionButtonState>("idle");
  const buyBusyRef = useRef(false);
  const cartBusyRef = useRef(false);
  const addedTimerRef = useRef<number | null>(null);

  const analyticsContext = {
    conversationId: "product-detail",
    productSlug,
    productId,
  };

  const clearAddedTimer = useCallback(() => {
    if (addedTimerRef.current != null) {
      window.clearTimeout(addedTimerRef.current);
      addedTimerRef.current = null;
    }
  }, []);

  const refreshCartMembership = useCallback(async () => {
    if (!canAddToCart) return;
    const inCart = await isProductInCart(productSlug);
    setCartState(inCart ? "in_cart" : "idle");
  }, [canAddToCart, productSlug]);

  useEffect(() => {
    trackTransactionHubViewListing(analyticsContext);
    void isProductInCart(productSlug).then((inCart) => {
      if (inCart) setCartState("in_cart");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per listing
  }, [productId, productSlug]);

  useEffect(() => {
    const handleOnline = () => {
      void flushHubActionQueue().then(() => refreshCartMembership());
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [refreshCartMembership]);

  useEffect(() => () => clearAddedTimer(), [clearAddedTimer]);

  const handleBuyNow = useCallback(() => {
    if (!canBuyNow || buyBusyRef.current) return;
    buyBusyRef.current = true;
    triggerCommerceHaptic();
    setBuyState("loading");
    trackTransactionHubBuyNow(analyticsContext);
    onBuyNow();
    window.setTimeout(() => {
      setBuyState("idle");
      buyBusyRef.current = false;
    }, PRODUCT_ACTION_BAR_VISUAL.releaseDurationMs);
  }, [canBuyNow, onBuyNow, productId, productSlug]);

  const handleMakeOffer = useCallback(() => {
    if (!canMakeOffer) return;
    triggerCommerceHaptic();
    trackTransactionHubOfferOpened(analyticsContext);
    onMakeOffer();
  }, [canMakeOffer, onMakeOffer, productId, productSlug]);

  const handleAddToCart = useCallback(async () => {
    if (!canAddToCart || cartBusyRef.current || cartState === "in_cart") return;
    cartBusyRef.current = true;
    triggerCommerceHaptic();
    setCartState("loading");
    clearAddedTimer();

    try {
      const result = await addToCartFromHub(productSlug);

      if (!result.success) {
        setCartState("idle");
        onCartError?.(result.error);
        return;
      }

      if (result.alreadyInCart) {
        setCartState("in_cart");
        return;
      }

      if (result.queued) {
        onCartSuccess?.({ queued: true });
        setCartState("idle");
        return;
      }

      trackTransactionHubAddToCart(analyticsContext);
      onCartSuccess?.();
      setCartState("success");
      addedTimerRef.current = window.setTimeout(() => {
        setCartState("in_cart");
        addedTimerRef.current = null;
      }, PRODUCT_ACTION_BAR_VISUAL.toastDurationMs);
    } finally {
      cartBusyRef.current = false;
    }
  }, [
    canAddToCart,
    cartState,
    clearAddedTimer,
    onCartError,
    onCartSuccess,
    productId,
    productSlug,
  ]);

  return {
    buyState,
    cartState,
    handleBuyNow: canBuyNow ? handleBuyNow : undefined,
    handleAddToCart: canAddToCart ? () => void handleAddToCart() : undefined,
    handleMakeOffer: canMakeOffer ? handleMakeOffer : undefined,
  };
}
