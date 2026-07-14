"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDeliveryPrice,
  pickDefaultShippingQuote,
  resolveLiveDeliveryQuotes,
} from "@/lib/checkout/delivery";
import type { CheckoutCarrierQuote, CheckoutShippingQuoteReason } from "@/lib/checkout/types";
import { calculateOrderTotals } from "@/lib/orders/pricing";
import type { Order } from "@/lib/orders/types";
import type { ProductDetail } from "@/lib/products/types";
import type { CheckoutDraft, CheckoutView } from "@/features/checkout/types";

function hasCompleteAddress(draft: CheckoutDraft): boolean {
  return (
    draft.recipientName.trim().length > 0 &&
    draft.addressLine.trim().length > 0 &&
    draft.postcode.trim().length > 0 &&
    draft.country.trim().length > 0
  );
}

export function useCheckoutForm(
  product: ProductDetail,
  initialDraft: CheckoutDraft,
  options?: {
    liveShippingEnabled?: boolean;
    hubConversationId?: string;
    offerId?: string | null;
    onDraftChange?: (draft: CheckoutDraft) => void;
  },
) {
  const liveShippingEnabled = options?.liveShippingEnabled ?? true;
  const hubConversationId = options?.hubConversationId;
  const offerId = options?.offerId ?? null;
  const liveShippingActive = liveShippingEnabled;
  const [view, setView] = useState<CheckoutView>("checkout");
  const [draft, setDraft] = useState<CheckoutDraft>(initialDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shippingQuotes, setShippingQuotes] = useState<CheckoutCarrierQuote[]>([]);
  const [shippingQuotesLoading, setShippingQuotesLoading] = useState(false);
  const [liveQuotesAttempted, setLiveQuotesAttempted] = useState(false);
  const [livePricingAvailable, setLivePricingAvailable] = useState(liveShippingActive);
  const [quotesRefreshKey, setQuotesRefreshKey] = useState(0);
  const [shippingQuoteReason, setShippingQuoteReason] = useState<CheckoutShippingQuoteReason | null>(
    null,
  );

  const addressReady = hasCompleteAddress(draft);
  const shouldFetchLiveQuotes =
    liveShippingActive && !product.freeDelivery && addressReady;
  const activeShippingQuotes = useMemo(
    () => (shouldFetchLiveQuotes ? shippingQuotes : []),
    [shouldFetchLiveQuotes, shippingQuotes],
  );
  const quotesAttempted = shouldFetchLiveQuotes ? liveQuotesAttempted : true;
  const hasListingShippingPrice =
    product.shippingPrice != null && product.shippingPrice >= 0;

  const selectedQuote = useMemo(
    () => activeShippingQuotes.find((quote) => quote.id === draft.deliveryOption) ?? null,
    [activeShippingQuotes, draft.deliveryOption],
  );

  const totals = useMemo(
    () =>
      calculateOrderTotals(
        product.price,
        getDeliveryPrice({
          listingOffersFreeDelivery: product.freeDelivery,
          listingShippingPrice: product.shippingPrice ?? null,
          selectedQuote,
          liveQuotesAttempted: quotesAttempted,
        }),
      ),
    [
      quotesAttempted,
      product.freeDelivery,
      product.price,
      product.shippingPrice,
      selectedQuote,
    ],
  );

  const onDraftChange = options?.onDraftChange;

  const updateDraft = useCallback((patch: Partial<CheckoutDraft>) => {
    setDraft((current) => {
      const next = { ...current, ...patch };
      onDraftChange?.(next);
      return next;
    });
  }, [onDraftChange]);

  const retryShippingQuotes = useCallback(() => {
    setLiveQuotesAttempted(false);
    setShippingQuotes([]);
    setShippingQuoteReason(null);
    setQuotesRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!shouldFetchLiveQuotes) {
      return;
    }

    let cancelled = false;

    void resolveLiveDeliveryQuotes({
      productSlug: product.slug,
      recipientName: draft.recipientName,
      addressLine: draft.addressLine,
      postcode: draft.postcode,
      country: draft.country,
    })
      .then((result) => {
        if (cancelled) return;
        setLiveQuotesAttempted(true);
        setLivePricingAvailable(result.live);
        setShippingQuotes(result.options);
        setShippingQuoteReason(result.reason ?? null);
        const defaultQuote = pickDefaultShippingQuote(result.options);
        setDraft((current) => ({
          ...current,
          deliveryOption: defaultQuote?.id ?? current.deliveryOption,
        }));
      })
      .finally(() => {
        if (!cancelled) setShippingQuotesLoading(false);
      });

    queueMicrotask(() => {
      if (!cancelled) setShippingQuotesLoading(true);
    });

    return () => {
      cancelled = true;
    };
  }, [
    draft.addressLine,
    draft.country,
    draft.postcode,
    draft.recipientName,
    product.slug,
    quotesRefreshKey,
    shouldFetchLiveQuotes,
  ]);

  const deliveryResolved =
    product.freeDelivery || selectedQuote != null || hasListingShippingPrice;

  const shippingBlocked =
    shippingQuoteReason === "seller_dispatch_not_ready" &&
    !hasListingShippingPrice &&
    !product.freeDelivery;

  const shippingStepComplete =
    product.freeDelivery ||
    selectedQuote != null ||
    (hasListingShippingPrice && quotesAttempted);

  const canPay =
    product.availability !== "out_of_stock" &&
    product.stock > 0 &&
    draft.recipientName.trim().length > 0 &&
    draft.addressLine.trim().length > 0 &&
    draft.postcode.trim().length > 0 &&
    draft.country.trim().length > 0 &&
    deliveryResolved &&
    shippingStepComplete &&
    !shippingBlocked &&
    !shippingQuotesLoading;

  const resolveDeliveryAddress = useCallback(async (): Promise<boolean> => {
    if (draft.addressId) {
      return true;
    }

    setIsResolvingAddress(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/checkout/shipping-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: draft.recipientName,
          addressLine: draft.addressLine,
          postcode: draft.postcode,
          country: draft.country,
        }),
      });
      const payload = (await response.json()) as {
        addressId?: string;
        error?: string;
      };

      if (!response.ok || !payload.addressId) {
        setErrorMessage(payload.error ?? "Unable to confirm delivery address.");
        return false;
      }

      updateDraft({ addressId: payload.addressId });
      return true;
    } catch {
      setErrorMessage("Unable to confirm delivery address.");
      return false;
    } finally {
      setIsResolvingAddress(false);
    }
  }, [draft.addressId, draft.addressLine, draft.country, draft.postcode, draft.recipientName, updateDraft]);

  const placeOrder = useCallback(async () => {
    if (!canPay || isSubmitting) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErrorMessage("You're offline. Check your connection and try again.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const shippingAddressId = draft.addressId;
      if (!shippingAddressId) {
        setErrorMessage("Delivery address is required. Return to Delivery and continue again.");
        return;
      }

      let walletPaymentMethodId: string | null = null;
      try {
        const methodsResponse = await fetch("/api/payment-methods");
        if (methodsResponse.ok) {
          const methodsPayload = (await methodsResponse.json()) as {
            methods?: Array<{ id: string; isDefault?: boolean }>;
          };
          const methods = methodsPayload.methods ?? [];
          walletPaymentMethodId =
            methods.find((method) => method.isDefault)?.id ?? methods[0]?.id ?? null;
        }
      } catch {
        // Wallet methods optional for guest Stripe Checkout cards.
      }

      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          deliveryOption: draft.deliveryOption,
          shippingAddressId,
          shippingQuoteId: selectedQuote?.id ?? null,
          hubConversationId,
          paymentMethodId: walletPaymentMethodId,
          offerId,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        url?: string;
        order?: Order;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        const raw = payload.error ?? "Unable to start checkout.";
        const lower = raw.toLowerCase();
        if (lower.includes("declined")) {
          setErrorMessage("Card declined. Try another payment method or card.");
        } else if (lower.includes("3d") || lower.includes("authentication")) {
          setErrorMessage("Payment authentication was cancelled. You can try again.");
        } else if (lower.includes("cancel")) {
          setErrorMessage("Payment was cancelled. Your checkout details were kept.");
        } else if (lower.includes("ship") || lower.includes("sendcloud")) {
          setErrorMessage("Shipping is temporarily unavailable. Try again in a moment.");
        } else {
          setErrorMessage(raw);
        }
        return;
      }

      if (payload.url) {
        window.location.href = payload.url;
        return;
      }

      setErrorMessage("Unable to start checkout.");
    } catch {
      setErrorMessage("Something went wrong. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [canPay, draft.addressId, draft.deliveryOption, hubConversationId, isSubmitting, offerId, product.slug, selectedQuote]);

  return {
    view,
    draft,
    totals,
    order,
    isSubmitting,
    isResolvingAddress,
    canPay,
    errorMessage,
    shippingQuotes: activeShippingQuotes,
    shippingQuotesLoading,
    liveQuotesAttempted: quotesAttempted,
    liveShippingEnabled: livePricingAvailable,
    selectedQuote,
    shippingQuoteReason,
    retryShippingQuotes,
    updateDraft,
    resolveDeliveryAddress,
    placeOrder,
    setSuccessOrder: setOrder,
    setView,
  };
}

export type CheckoutFormController = ReturnType<typeof useCheckoutForm>;

/** @deprecated Use useCheckoutForm */
export const useCheckoutWizard = useCheckoutForm;
/** @deprecated Use CheckoutFormController */
export type CheckoutWizardController = CheckoutFormController;
