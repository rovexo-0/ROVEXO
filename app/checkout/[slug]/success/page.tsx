import { redirect } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CheckoutPageHeader } from "@/features/checkout/components/CheckoutPageHeader";
import { CheckoutSuccessView } from "@/features/checkout/components/CheckoutSuccessView";
import { loadCheckoutPageProps } from "@/features/checkout/lib/load-checkout-page";
import { confirmOrderCheckoutSession } from "@/lib/orders/checkout";
import { getOrderById } from "@/lib/orders/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthContext } from "@/lib/auth/session";
import "@/styles/rovexo/checkout-v1.css";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order_id?: string; session_id?: string }>;
};

async function resolveConversationId(buyerId: string, productId: string | null, sellerId: string | null) {
  if (!productId) return null;
  const admin = createAdminClient();
  let query = admin
    .from("conversations")
    .select("id")
    .eq("product_id", productId)
    .eq("buyer_id", buyerId);
  if (sellerId) {
    query = query.eq("seller_id", sellerId);
  }
  const { data } = await query.maybeSingle();
  return data?.id ?? null;
}

export default async function CheckoutSuccessRoute({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  await loadCheckoutPageProps(slug);

  const auth = await getAuthContext();
  if (!auth) {
    redirect(`/login?next=${encodeURIComponent(`/checkout/${slug}/success`)}`);
  }
  const userId = auth.user.id;

  let orderId = query.order_id ?? null;

  if (query.session_id) {
    const confirmed = await confirmOrderCheckoutSession(query.session_id, userId);
    if (confirmed.success && confirmed.order?.id) {
      orderId = confirmed.order.id;
    }
  }

  if (!orderId) {
    redirect(`/checkout/${slug}`);
  }

  const order = await getOrderById(orderId);
  if (!order || order.buyer.id !== userId) {
    redirect("/orders");
  }

  const conversationId = await resolveConversationId(
    userId,
    order.product?.id ?? null,
    order.seller?.id ?? null,
  );

  return (
    <BetaAppShell showBottomNav={false} className="checkout-v1-shell">
      <div className="ckt-v1" data-checkout-version="v1.0" data-checkout-sprint="2-payment">
        <CheckoutPageHeader backHref="/orders" backLabel="Orders" />
        <main className="ckt-v1__main">
          <CheckoutSuccessView
            orderId={order.id}
            orderNumber={order.orderNumber}
            conversationId={conversationId}
            estimatedDelivery={
              order.trackingNumber
                ? `Tracking ${order.trackingNumber}`
                : null
            }
          />
        </main>
      </div>
    </BetaAppShell>
  );
}
