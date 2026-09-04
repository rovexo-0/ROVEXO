"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getDeliveryPrice,
  resolveCheckoutDeliveryOptionId,
  resolveLiveDeliveryQuotes,
} from "@/lib/checkout/delivery";
import type { CheckoutCarrierQuote, CheckoutShippingQuoteReason } from "@/lib/checkout/types";
import { calculateOrderTotals } from "@/lib/orders/pricing";
import type { Order } from "@/lib/orders/types";
import type { ProductDetail } from "@/lib/products/types";
import type { CheckoutDraft, CheckoutView } from "@/features/checkout/types";
import {
  isCanonicalBuyNowRvxCode,
  toBuyNowPublicMessage,
  RVX_UNCLASSIFIED,
  type RvxClassifiedCode,
} from "@/lib/checkout/buy-now-guard-v1";
import { mapOrderCheckoutErrorToRvx } from "@/lib/checkout/map-order-checkout-error-v1";
import {
  CHECKOUT_RACE_CONDITION_V1,
  isItemJustSoldError,
} from "@/lib/checkout/checkout-race-condition-v1";

function toPublicCheckoutError(raw: string, codeHint?: string): string {
  if (isItemJustSoldError(raw) || codeHint === CHECKOUT_RACE_CONDITION_V1.conflictCode) {
    return CHECKOUT_RACE_CONDITION_V1.conflictMessage;
  }
  const embedded = raw.match(/\bRVX-20(?:0[1-9]|1[0-2]|99)\b/);
  const fromHint =
    codeHint &&
    (codeHint === RVX_UNCLASSIFIED || isCanonicalBuyNowRvxCode(codeHint))
      ? (codeHint as RvxClassifiedCode)
      : null;
  const fromEmbed =
    embedded?.[0] &&
    (embedded[0] === RVX_UNCLASSIFIED || isCanonicalBuyNowRvxCode(embedded[0]))
      ? (embedded[0] as RvxClassifiedCode)
      : null;
  if (fromHint) return toBuyNowPublicMessage(fromHint);
  if (fromEmbed) return toBuyNowPublicMessage(fromEmbed);
  return toBuyNowPublicMessage(mapOrderCheckoutErrorToRvx(raw).code);
}

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
    pendingOrderId?: string | null;
    checkoutSessionId?: string | null;
    onDraftChange?: (draft: CheckoutDraft) => void;
  },
) {
  const router = useRouter();
  const liveShippingEnabled = options?.liveShippingEnabled ?? true;
  const hubConversationId = options?.hubConversationId;
  const offerId = options?.offerId ?? null;
  const pendingOrderId = options?.pendingOrderId ?? null;
  const checkoutSessionId = options?.checkoutSessionId ?? null;
  const liveShippingActive = liveShippingEnabled;
  const [view, setView] = useState<CheckoutView>("checkout");
  const [draft, setDraft] = useState<CheckoutDraft>(initialDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Sync lock — blocks double-click before React re-renders isSubmitting. */
  const submittingLockRef = useRef(false);
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
        setDraft((current) => {
          const nextDeliveryOption = resolveCheckoutDeliveryOptionId(
            result.options,
            current.deliveryOption,
          );
          if (nextDeliveryOption === current.deliveryOption) {
            return current;
          }
          const next = { ...current, deliveryOption: nextDeliveryOption };
          onDraftChange?.(next);
          return next;
        });
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
    onDraftChange,
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
    if (!canPay || isSubmitting || submittingLockRef.current) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErrorMessage(toBuyNowPublicMessage(RVX_UNCLASSIFIED));
      return;
    }

    submittingLockRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const shippingAddressId = draft.addressId;
      if (!shippingAddressId) {
        setErrorMessage(toBuyNowPublicMessage("RVX-2005"));
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

      let idempotencyKey: string | null = null;
      try {
        idempotencyKey = sessionStorage.getItem(`rvx_bn_idem_${product.slug}`);
      } catch {
        idempotencyKey = null;
      }

      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        },
        body: JSON.stringify({
          productSlug: product.slug,
          deliveryOption: draft.deliveryOption,
          shippingAddressId,
          shippingQuoteId: selectedQuote?.id ?? null,
          hubConversationId,
          paymentMethodId: walletPaymentMethodId,
          paymentMethod: draft.paymentMethod,
          offerId,
          idempotencyKey,
          orderId: pendingOrderId,
          checkoutSessionId,
          appBaseUrl: window.location.origin,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        url?: string;
        order?: Order;
        error?: string;
        code?: string;
      };

      if (!response.ok || !payload.success) {
        if (
          response.status === CHECKOUT_RACE_CONDITION_V1.httpConflict ||
          isItemJustSoldError(payload.error) ||
          payload.code === CHECKOUT_RACE_CONDITION_V1.conflictCode
        ) {
          setErrorMessage(CHECKOUT_RACE_CONDITION_V1.conflictMessage);
          router.replace(`/listing/${product.slug}`);
          return;
        }
        const raw = payload.error ?? "";
        setErrorMessage(toPublicCheckoutError(raw, payload.code));
        return;
      }

      if (payload.url) {
        window.location.href = payload.url;
        return;
      }

      setErrorMessage(toBuyNowPublicMessage(RVX_UNCLASSIFIED));
    } catch {
      setErrorMessage(toBuyNowPublicMessage(RVX_UNCLASSIFIED));
    } finally {
      submittingLockRef.current = false;
      setIsSubmitting(false);
    }
  }, [
    canPay,
    checkoutSessionId,
    draft.addressId,
    draft.deliveryOption,
    draft.paymentMethod,
    hubConversationId,
    isSubmitting,
    offerId,
    pendingOrderId,
    product.slug,
    router,
    selectedQuote,
  ]);

  return {
    view,
    draft,
    totals,
    order,
    isSubmitting,
    isResolvingAddress,
    canPay,
    errorMessage,
    clearErrorMessage: () => setErrorMessage(null),
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
