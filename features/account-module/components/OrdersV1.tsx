"use client";

import { OrdersHubV1 } from "@/features/orders/components/OrdersHubV1";
import type { Order } from "@/lib/orders/types";

type OrdersV1Props = {
  boughtOrders: Order[];
  soldOrders: Order[];
  unreadNotifications?: number;
};

/** Account module entry — delegates to canonical Orders Hub v1.0. */
export function OrdersV1({ boughtOrders, soldOrders, unreadNotifications = 0 }: OrdersV1Props) {
  return (
    <OrdersHubV1
      boughtOrders={boughtOrders}
      soldOrders={soldOrders}
      unreadNotifications={unreadNotifications}
    />
  );
}
