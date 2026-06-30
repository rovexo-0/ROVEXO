import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/lib/orders/types";

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  buyerName: string;
  sellerName: string;
  total: number;
  createdAt: string;
};

export type AdminStats = {
  totalOrders: number;
  awaitingPayment: number;
  awaitingShipment: number;
  completed: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const admin = createAdminClient();
  const { data } = await admin.from("orders").select("status");

  const rows = data ?? [];
  return {
    totalOrders: rows.length,
    awaitingPayment: rows.filter((row) => row.status === "awaiting_payment").length,
    awaitingShipment: rows.filter((row) => row.status === "awaiting_shipment").length,
    completed: rows.filter((row) => row.status === "completed").length,
  };
}

export async function listAdminOrders(limit = 50): Promise<AdminOrderRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      total,
      created_at,
      buyer:profiles!orders_buyer_id_fkey ( full_name ),
      seller:profiles!orders_seller_id_fkey ( full_name )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const buyer = row.buyer as { full_name: string } | null;
    const seller = row.seller as { full_name: string } | null;
    return {
      id: row.id,
      orderNumber: row.order_number,
      status: row.status as OrderStatus,
      buyerName: buyer?.full_name ?? "Buyer",
      sellerName: seller?.full_name ?? "Seller",
      total: Number(row.total),
      createdAt: row.created_at,
    };
  });
}

export async function adminUpdateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("orders").update({ status }).eq("id", orderId);
  return !error;
}
