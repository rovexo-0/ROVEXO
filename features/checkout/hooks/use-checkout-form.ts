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
  options?: { liveShippingEnabled?: boolean },
) {
  const liveShippingEnabled = options?.liveShippingEnabled ?? true;
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

  const updateDraft = useCallback((patch: Partial<CheckoutDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

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

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const shippingAddressId = draft.addressId;
      if (!shippingAddressId) {
        setErrorMessage("Delivery address is required. Return to Delivery and continue again.");
        return;
      }

      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          deliveryOption: draft.deliveryOption,
          shippingAddressId,
          shippingQuoteId: selectedQuote?.id ?? null,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        url?: string;
        order?: Order;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error ?? "Unable to start checkout.");
        return;
      }

      if (payload.url?.includes("order=success")) {
        if (payload.order) {
          setOrder(payload.order);
        }
        setView("success");
        return;
      }

      if (payload.url) {
        window.location.href = payload.url;
        return;
      }

      setErrorMessage("Unable to start checkout.");
    } catch {
      setErrorMessage("Unable to start checkout.");
    } finally {
      setIsSubmitting(false);
    }
  }, [canPay, draft.addressId, draft.deliveryOption, isSubmitting, product.slug, selectedQuote]);

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
