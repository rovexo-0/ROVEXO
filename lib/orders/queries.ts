import { listOrders, getOrderById } from "@/lib/orders/store";
import { filterOrdersByRole, resolveOrderViewRole } from "@/lib/orders/role";
import type { Order, OrderViewRole } from "@/lib/orders/types";

export async function fetchOrders(): Promise<Order[]> {
  return listOrders();
}

export async function fetchOrdersForUser(userId: string, role: OrderViewRole): Promise<Order[]> {
  return filterOrdersByRole(await listOrders(), userId, role);
}

export async function fetchOrderById(id: string): Promise<Order | null> {
  return getOrderById(id);
}

export async function fetchOrderForUser(id: string, userId: string): Promise<Order | null> {
  const order = await getOrderById(id);
  if (!order || !resolveOrderViewRole(order, userId)) return null;
  return order;
}

export function getOrderViewRole(order: Order, userId: string): OrderViewRole | null {
  return resolveOrderViewRole(order, userId);
}
