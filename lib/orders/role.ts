import type { Order, OrderViewRole } from "@/lib/orders/types";
import { isBuyerCancellableOrderStatus } from "@/lib/orders/cancellation";

export function resolveOrderViewRole(order: Order, userId: string): OrderViewRole | null {
  if (order.buyer.id === userId) return "buyer";
  if (order.seller.id === userId) return "seller";
  return null;
}

export function filterOrdersByRole(orders: Order[], userId: string, role: OrderViewRole): Order[] {
  return orders.filter((order) => resolveOrderViewRole(order, userId) === role);
}

const SELLER_ACTIONS = new Set(["add_tracking", "mark_delivered", "refund"]);
const BUYER_ACTIONS = new Set(["confirm_ok", "report_issue", "cancel"]);

export function canPerformOrderAction(
  action: import("@/lib/orders/types").OrderAction,
  order: Order,
  userId: string,
  isAdmin = false,
): boolean {
  if (isAdmin) {
    return true;
  }

  const role = resolveOrderViewRole(order, userId);
  if (!role) {
    return false;
  }

  if (role === "seller") {
    return SELLER_ACTIONS.has(action);
  }

  if (role === "buyer") {
    if (action === "cancel") {
      return isBuyerCancellableOrderStatus(order.status);
    }
    return BUYER_ACTIONS.has(action);
  }

  return false;
}
