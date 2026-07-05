"use client";

import { useCallback, useMemo, useState } from "react";
import { getDeliveryPrice } from "@/lib/checkout/delivery";
import { calculateOrderTotals } from "@/lib/orders/pricing";
import type { Order } from "@/lib/orders/types";
import type { ProductDetail } from "@/lib/products/types";
import type { CheckoutDraft, CheckoutView } from "@/features/checkout/types";

export function useCheckoutForm(product: ProductDetail, initialDraft: CheckoutDraft) {
  const [view, setView] = useState<CheckoutView>("checkout");
  const [draft, setDraft] = useState<CheckoutDraft>(initialDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totals = useMemo(
    () =>
      calculateOrderTotals(
        product.price,
        getDeliveryPrice(draft.deliveryOption, {
          listingOffersFreeDelivery: product.freeDelivery,
          listingShippingPrice: product.shippingPrice ?? null,
        }),
      ),
    [draft.deliveryOption, product.freeDelivery, product.price, product.shippingPrice],
  );

  const updateDraft = useCallback((patch: Partial<CheckoutDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const canPay =
    product.availability !== "out_of_stock" &&
    product.stock > 0 &&
    draft.recipientName.trim().length > 0 &&
    draft.addressLine.trim().length > 0 &&
    draft.postcode.trim().length > 0 &&
    draft.country.trim().length > 0 &&
    draft.acceptedReturnPolicy;

  const placeOrder = useCallback(async () => {
    if (!canPay || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let shippingAddressId = draft.addressId;

      if (!shippingAddressId) {
        const addressResponse = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientName: draft.recipientName,
            addressLine: draft.addressLine,
            postcode: draft.postcode,
            country: draft.country,
            addressType: "shipping",
            isDefault: true,
          }),
        });
        const addressPayload = (await addressResponse.json()) as {
          address?: { id: string };
          error?: string;
        };
        if (!addressResponse.ok || !addressPayload.address?.id) {
          setErrorMessage(addressPayload.error ?? "Unable to save shipping address.");
          return;
        }
        shippingAddressId = addressPayload.address.id;
        updateDraft({ addressId: shippingAddressId });
      }

      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          deliveryOption: draft.deliveryOption,
          shippingAddressId,
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
  }, [canPay, draft, isSubmitting, product.slug, updateDraft]);

  return {
    view,
    draft,
    totals,
    order,
    isSubmitting,
    canPay,
    errorMessage,
    updateDraft,
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
