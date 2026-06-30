import type { DeliveryCarrier } from "@/lib/products/types";

export type OrderStatus =
  | "awaiting_payment"
  | "awaiting_shipment"
  | "shipped"
  | "delivered"
  | "issue_open"
  | "completed"
  | "cancelled";

export type OrderViewRole = "buyer" | "seller";

export type OrderParty = {
  id: string;
  name: string;
};

export type OrderTotals = {
  itemPrice: number;
  protectedFee: number;
  delivery: number;
  total: number;
};

export type OrderProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  imageUrl: string;
  condition: string;
};

export type DeliveryStage = {
  id: "placed" | "shipped" | "delivered";
  label: string;
  timestamp?: string;
  done: boolean;
  current: boolean;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  product: OrderProduct;
  buyer: OrderParty;
  seller: OrderParty;
  totals: OrderTotals;
  deliveryCarrier: DeliveryCarrier;
  trackingNumber?: string;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  disputesDisabled: boolean;
};

export type CreateOrderInput = {
  productSlug: string;
  deliveryCarrier: DeliveryCarrier;
};

export type OrderAction =
  | "confirm_ok"
  | "report_issue"
  | "add_tracking"
  | "mark_delivered"
  | "cancel"
  | "refund";

export type AddTrackingInput = {
  trackingNumber: string;
};
