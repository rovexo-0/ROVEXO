import { notFound, redirect } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CheckoutSuccessView } from "@/features/checkout/components/CheckoutSuccessView";
import { loadCheckoutPageProps } from "@/features/checkout/lib/load-checkout-page";
import { evaluateDoneReadinessGate } from "@/lib/checkout/done-readiness-gate-v1";
import { confirmOrderCheckoutSession } from "@/lib/orders/checkout";
import { getOrderById } from "@/lib/orders/store";
import type { OrderStatus } from "@/lib/orders/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthContext } from "@/lib/auth/session";
import "@/styles/rovexo/checkout-v1.css";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order_id?: string; session_id?: string; cs?: string; visual?: string }>;
};

/** Success UI is only for paid-or-later orders — never awaiting_payment. */
const SUCCESS_ORDER_STATUSES = new Set<OrderStatus>([
  "awaiting_shipment",
  "shipped",
  "delivered",
  "completed",
  "issue_open",
]);

/**
 * Absolute Law FINAL LOCK — Payment Successful.
 * DONE exists only when evaluateDoneReadinessGate().allPass.
 */
export default async function CheckoutSuccessRoute({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;

  /**
   * Localhost visual chrome only — Absolute Law forbids DONE without real gates.
   * Shows success layout without DONE button (golden rule: no DONE until 100% PASS).
   */
  if (process.env.NODE_ENV === "development" && query.visual === "absolute-law") {
    const auth = await getAuthContext();
    if (!auth) {
      redirect(`/login?next=${encodeURIComponent(`/checkout/${slug}/success?visual=absolute-law`)}`);
    }
    await loadCheckoutPageProps(slug, { enforceBuyNowGuard: false });
    const admin = createAdminClient();
    const { data: product } = await admin
      .from("products")
      .select("id, title, price")
      .eq("slug", slug)
      .maybeSingle();
    if (!product) {
      redirect(`/listing/${slug}`);
    }
    const { calculateOrderTotals } = await import("@/lib/orders/pricing");
    const totals = calculateOrderTotals(Number(product.price ?? 0), 4.49);
    return (
      <BetaAppShell showBottomNav={false} className="checkout-v1-shell">
        <div
          className="ckt-v1"
          data-checkout-version="v1.0"
          data-checkout-absolute-law="1.0-final-lock"
          data-checkout-visual-proof="development-no-done"
        >
          <main className="ckt-v1__main flex min-h-[100dvh] w-full flex-col justify-center">
            <CheckoutSuccessView
              productTitle={product.title}
              totalPaid={totals.total}
              doneReady={false}
              conversationId={null}
              orderId={null}
            />
          </main>
        </div>
      </BetaAppShell>
    );
  }

  await loadCheckoutPageProps(slug, { enforceBuyNowGuard: false });

  const auth = await getAuthContext();
  if (!auth) {
    redirect(`/login?next=${encodeURIComponent(`/checkout/${slug}/success`)}`);
  }
  const userId = auth.user.id;

  let orderId = query.order_id ?? null;
  let sessionConfirmed = false;

  if (query.session_id) {
    const confirmed = await confirmOrderCheckoutSession(query.session_id, userId);
    if (confirmed.success && confirmed.order?.id) {
      orderId = confirmed.order.id;
      sessionConfirmed = true;
    } else if (!orderId) {
      redirect(`/checkout/${slug}?order=payment_failed`);
    }
  }

  if (!orderId && query.cs) {
    const { resolveOrderIdFromCheckoutSession } = await import(
      "@/lib/orders/create-order-from-checkout-session.server"
    );
    orderId = await resolveOrderIdFromCheckoutSession(query.cs);
  }

  if (!orderId) {
    redirect(`/checkout/${slug}`);
  }

  const order = await getOrderById(orderId);
  if (!order || order.buyer.id !== userId) {
    notFound();
  }

  if (!SUCCESS_ORDER_STATUSES.has(order.status)) {
    if (query.session_id && !sessionConfirmed) {
      redirect(`/checkout/${slug}?order=payment_failed`);
    }
    redirect(`/checkout/${slug}`);
  }

  const gate = await evaluateDoneReadinessGate({
    orderId: order.id,
    buyerId: userId,
  });

  return (
    <BetaAppShell showBottomNav={false} className="checkout-v1-shell">
      <div
        className="ckt-v1"
        data-checkout-version="v1.0"
        data-checkout-absolute-law="1.0-final-lock"
        data-checkout-freeze="ABSOLUTE-LAW-V1"
        data-done-gate={gate.allPass ? "PASS" : "PENDING"}
      >
        <main className="ckt-v1__main flex min-h-[100dvh] w-full flex-col justify-center">
          <CheckoutSuccessView
            productTitle={order.product.title}
            totalPaid={order.totals.total}
            orderId={order.id}
            doneReady={gate.allPass}
            conversationId={gate.allPass ? gate.conversationId : null}
          />
        </main>
      </div>
    </BetaAppShell>
  );
}
