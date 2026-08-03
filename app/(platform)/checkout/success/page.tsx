import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { getOrderById } from "@/lib/orders/store";

type Props = {
  searchParams: Promise<{ order_id?: string; session_id?: string }>;
};

/**
 * Checkout Absolute Law v1.0 FINAL LOCK —
 * Never land on My Orders, Inbox list, or Home after payment.
 * Resolve slug success → DONE → Transaction Conversation only.
 */
export default async function CheckoutGlobalSuccessRoute({ searchParams }: Props) {
  const query = await searchParams;
  const auth = await getAuthContext();
  if (!auth) {
    redirect(`/login?next=${encodeURIComponent("/checkout/success")}`);
  }

  if (query.order_id) {
    const order = await getOrderById(query.order_id);
    if (order?.buyer.id === auth.user.id && order.product?.slug) {
      const qs = new URLSearchParams({ order_id: order.id });
      if (query.session_id) qs.set("session_id", query.session_id);
      redirect(`/checkout/${order.product.slug}/success?${qs.toString()}`);
    }
  }

  // INTERZIS: Home / Inbox / Orders fallback — no legal destination without order.
  notFound();
}
