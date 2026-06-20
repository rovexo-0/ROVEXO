"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { CheckoutAddressCard } from "@/features/checkout/components/CheckoutAddressCard";
import { CheckoutDeliverySection } from "@/features/checkout/components/CheckoutDeliverySection";
import { CheckoutPageHeader } from "@/features/checkout/components/CheckoutPageHeader";
import { CheckoutPayFooter } from "@/features/checkout/components/CheckoutPayFooter";
import { CheckoutPaymentMethodCard } from "@/features/checkout/components/CheckoutPaymentMethodCard";
import { CheckoutProcessingOverlay } from "@/features/checkout/components/CheckoutProcessingOverlay";
import { CheckoutProductCard } from "@/features/checkout/components/CheckoutProductCard";
import { CheckoutSuccessView } from "@/features/checkout/components/CheckoutSuccessView";
import { OrderSummary } from "@/features/checkout/components/OrderSummary";
import { useCheckoutForm } from "@/features/checkout/hooks/use-checkout-form";
import type { CheckoutDraft } from "@/features/checkout/types";
import type { Order } from "@/lib/orders/types";
import type { ProductDetail } from "@/lib/products/types";

type CheckoutPageProps = {
  product: ProductDetail;
  initialDraft: CheckoutDraft;
};

export function CheckoutPage({ product, initialDraft }: CheckoutPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useCheckoutForm(product, initialDraft);
  const { view, totals, isSubmitting, canPay, placeOrder, errorMessage, setSuccessOrder, setView } = form;
  const isSuccess = view === "success";

  useEffect(() => {
    const orderStatus = searchParams.get("order");
    const sessionId = searchParams.get("session_id");
    const orderId = searchParams.get("order_id");

    if (orderStatus === "cancelled" && orderId) {
      void fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      }).finally(() => {
        router.replace(`/checkout/${product.slug}`);
      });
      return;
    }

    if (orderStatus === "success") {
      if (sessionId) {
        void fetch(`/api/orders/confirm?session_id=${encodeURIComponent(sessionId)}`)
          .then((response) => response.json())
          .then((payload: { success?: boolean; order?: Order }) => {
            if (payload.success && payload.order) {
              setSuccessOrder(payload.order);
              setView("success");
            }
            router.replace(`/checkout/${product.slug}`);
          });
      } else {
        setView("success");
        router.replace(`/checkout/${product.slug}`);
      }
    }
  }, [product.slug, router, searchParams, setSuccessOrder, setView]);

  return (
    <BetaAppShell showBottomNav={false}>
      {!isSuccess && <CheckoutPageHeader backHref={`/listing/${product.slug}`} />}

      <main
        className={cn(
          "mx-auto flex w-full max-w-2xl flex-col",
          isSuccess
            ? "min-h-[100dvh] justify-center px-ds-4 py-ds-6"
            : "gap-ds-5 px-ds-4 py-ds-4 pb-[calc(84px+env(safe-area-inset-bottom))]",
        )}
      >
        {isSuccess ? (
          <CheckoutSuccessView form={form} />
        ) : (
          <>
            {product.availability === "out_of_stock" || product.stock <= 0 ? (
              <Card padding="sm" className="border-danger/30 bg-danger/5 shadow-ds-soft">
                <p className="text-sm font-medium text-danger">This item is out of stock.</p>
              </Card>
            ) : null}

            {errorMessage && (
              <Card padding="sm" className="border-danger/30 bg-danger/5 shadow-ds-soft">
                <p className="text-sm font-medium text-danger">{errorMessage}</p>
              </Card>
            )}

            <CheckoutProductCard product={product} />
            <CheckoutDeliverySection form={form} />
            <CheckoutAddressCard form={form} />
            <CheckoutPaymentMethodCard form={form} />
            <OrderSummary totals={totals} />
          </>
        )}
      </main>

      {!isSuccess && (
        <CheckoutPayFooter
          disabled={!canPay}
          loading={isSubmitting}
          onPay={() => void placeOrder()}
        />
      )}

      {isSubmitting && <CheckoutProcessingOverlay />}
    </BetaAppShell>
  );
}

/** @deprecated Use CheckoutPage */
export const CheckoutWizard = CheckoutPage;
