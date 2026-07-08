import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { buildReceiptHtml } from "@/lib/invoices/receipt";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, order_number, invoice_number, item_price, protected_fee, delivery_fee, total, paid_at, buyer_id, seller_id, order_items ( title )",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.buyer_id !== auth.user.id && order.seller_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const itemTitle =
    (order.order_items as Array<{ title: string }> | null)?.[0]?.title ?? "Order item";

  const html = buildReceiptHtml({
    orderNumber: order.order_number,
    invoiceNumber: order.invoice_number ?? `INV-${order.order_number}`,
    itemTitle,
    itemPrice: Number(order.item_price),
    platformFee: Number(order.protected_fee),
    deliveryFee: Number(order.delivery_fee),
    total: Number(order.total),
    paidAt: order.paid_at ?? new Date().toISOString(),
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=60",
    },
  });
}
