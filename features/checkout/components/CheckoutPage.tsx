"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { CheckoutProcessingOverlay } from "@/features/checkout/components/CheckoutProcessingOverlay";
import { CheckoutSuccessView } from "@/features/checkout/components/CheckoutSuccessView";
import { CheckoutWizardV1 } from "@/features/checkout/components/CheckoutWizardV1";
import { useCheckoutForm } from "@/features/checkout/hooks/use-checkout-form";
import type { CheckoutDraft } from "@/features/checkout/types";
import type { Order } from "@/lib/orders/types";
import type { ProductDetail } from "@/lib/products/types";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import { getActiveMarket } from "@/lib/seo/markets";

type CheckoutPageProps = {
  product: ProductDetail;
  initialDraft: CheckoutDraft;
  liveShippingEnabled?: boolean;
  buyerPhone?: string | null;
};

export function CheckoutPage({
  product,
  initialDraft,
  liveShippingEnabled = true,
  buyerPhone = null,
}: CheckoutPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useCheckoutForm(product, initialDraft, { liveShippingEnabled });
  const { view, order, isSubmitting, errorMessage } = form;
  const isSuccess = view === "success";
  const purchaseTrackedRef = useRef(false);

  useEffect(() => {
    const { currency } = getActiveMarket();
    trackGaEvent("begin_checkout", {
      item_id: product.id,
      item_name: product.title,
      value: product.price,
      currency,
    });
  }, [product.id, product.price, product.title]);

  useEffect(() => {
    if (view !== "success" || !order || purchaseTrackedRef.current) return;

    purchaseTrackedRef.current = true;
    const { currency } = getActiveMarket();
    trackGaEvent("purchase", {
      transaction_id: order.id,
      value: order.totals.total,
      currency,
      item_id: product.id,
      item_name: product.title,
    });
  }, [order, product.id, product.title, view]);

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
            const resolvedOrderId = payload.order?.id ?? orderId;
            if (resolvedOrderId) {
              router.replace(
                payload.success
                  ? `/orders/${resolvedOrderId}?placed=1`
                  : `/orders/${resolvedOrderId}`,
              );
              return;
            }
            router.replace(`/checkout/${product.slug}`);
          });
        return;
      }

      if (orderId) {
        router.replace(`/orders/${orderId}?placed=1`);
        return;
      }
    }
  }, [product.slug, router, searchParams]);

  return (
    <BetaAppShell showBottomNav={!isSuccess} className="checkout-v1-shell">
      <main
        className={cn(
          isSuccess &&
            "mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col justify-center px-ds-4 py-ds-6",
        )}
      >
        {isSuccess ? (
          <CheckoutSuccessView form={form} />
        ) : (
          <>
            {product.availability === "out_of_stock" || product.stock <= 0 ? (
              <Card padding="sm" className="mx-auto mb-4 mt-4 max-w-2xl border-danger/30 bg-danger/5">
                <p className="text-sm font-medium text-danger">This item is out of stock.</p>
              </Card>
            ) : null}

            {errorMessage ? (
              <Card padding="sm" className="mx-auto mb-4 mt-4 max-w-2xl border-danger/30 bg-danger/5">
                <p className="text-sm font-medium text-danger">{errorMessage}</p>
              </Card>
            ) : null}

            <CheckoutWizardV1 product={product} form={form} buyerPhone={buyerPhone} />
          </>
        )}
      </main>

      {isSubmitting ? <CheckoutProcessingOverlay /> : null}
    </BetaAppShell>
  );
}

/** @deprecated Use CheckoutPage */
export const CheckoutWizard = CheckoutPage;
