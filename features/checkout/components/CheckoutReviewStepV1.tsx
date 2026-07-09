"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { formatListingPrice } from "@/lib/listing-card/format";
import {
  getPaymentMethodLabel,
  SAVED_CARD_DETAIL,
} from "@/lib/checkout/payment";
import { SellerSummaryCard } from "@/features/commerce-ui/components/SellerSummaryCard";
import { OrderSummaryTotals } from "@/features/commerce-ui/components/OrderSummaryTotals";
import { mapOrderToCommerceTotals, mapProductToCheckoutSellerGroup } from "@/lib/commerce/mappers";
import type { CheckoutFormController } from "@/features/checkout/hooks/use-checkout-form";
import type { CheckoutStep } from "@/features/checkout/types";
import type { OrderTotals } from "@/lib/orders/types";
import type { ProductDetail } from "@/lib/products/types";
type CheckoutReviewStepV1Props = {
  form: CheckoutFormController;
  product: ProductDetail;
  totals: OrderTotals;
  buyerPhone?: string | null;
  orderNotes: string;
  onChangeStep: (step: CheckoutStep) => void;
};

function detectMobilePlatform() {
  if (typeof navigator === "undefined") {
    return { isIOS: false, isAndroid: false };
  }
  const ua = navigator.userAgent;
  return {
    isIOS: /iPhone|iPad|iPod/i.test(ua),
    isAndroid: /Android/i.test(ua),
  };
}

export function CheckoutReviewStepV1({
  form,
  product,
  totals,
  buyerPhone,
  orderNotes,
  onChangeStep,
}: CheckoutReviewStepV1Props) {
  const { draft } = form;
  const [{ isIOS, isAndroid }] = useState(detectMobilePlatform);

  const shippingPrice = product.freeDelivery ? 0 : totals.delivery;
  const paymentLabel = getPaymentMethodLabel(draft.paymentMethod, { isIOS, isAndroid });
  const sellerGroup = mapProductToCheckoutSellerGroup({
    sellerId: product.sellerId ?? product.id,
    sellerName: product.sellerName,
    productId: product.id,
    title: product.title,
    price: product.price,
    imageUrl: product.imageUrl,
  });
  return (
    <div className="ckt-v1__step">
      <section className="ckt-v1__section" aria-labelledby="ckt-review-order">
        <h2 id="ckt-review-order" className="ckt-v1__section-title">
          Review Your Order
        </h2>

        <div className="ckt-v1__review-group">
          <div className="ckt-v1__review-row">
            <div>
              <p className="ckt-v1__review-label">Delivery</p>
              <p className="ckt-v1__review-value">{draft.recipientName}</p>
              {buyerPhone ? <p className="ckt-v1__review-subvalue">{buyerPhone}</p> : null}
              <p className="ckt-v1__review-subvalue">
                {[draft.addressLine, draft.postcode, draft.country].filter(Boolean).join(", ")}
              </p>
              {orderNotes ? <p className="ckt-v1__review-subvalue">Note: {orderNotes}</p> : null}
            </div>
            <button
              type="button"
              className={cn("ckt-v1__change", focusRing)}
              onClick={() => onChangeStep("delivery")}
            >
              Change
            </button>
          </div>

          <div className="ckt-v1__review-row">
            <div>
              <p className="ckt-v1__review-label">Shipping</p>
              <p className="ckt-v1__review-value">
                {product.freeDelivery ? "Included" : formatListingPrice(shippingPrice)}
              </p>
            </div>            <button
              type="button"
              className={cn("ckt-v1__change", focusRing)}
              onClick={() => onChangeStep("delivery")}
            >
              Change
            </button>
          </div>

          <div className="ckt-v1__review-row">
            <div>
              <p className="ckt-v1__review-label">Payment Method</p>
              <p className="ckt-v1__review-value">{paymentLabel}</p>
              {draft.paymentMethod === "saved_card" ? (
                <p className="ckt-v1__review-subvalue">{SAVED_CARD_DETAIL}</p>
              ) : null}
            </div>
            <button
              type="button"
              className={cn("ckt-v1__change", focusRing)}
              onClick={() => onChangeStep("payment")}
            >
              Change
            </button>
          </div>
        </div>
      </section>

      <section className="ckt-v1__section" aria-labelledby="ckt-review-items">
        <div className="flex items-center gap-ds-2">
          <Package className="h-5 w-5 text-text-secondary" aria-hidden />
          <h2 id="ckt-review-items" className="ckt-v1__section-title">
            Order Summary
          </h2>
        </div>
        <SellerSummaryCard group={sellerGroup} />
      </section>

      <section className="ckt-v1__section" aria-label="Order total">
        <OrderSummaryTotals totals={mapOrderToCommerceTotals(totals)} accentTotal />
      </section>    </div>
  );
}
