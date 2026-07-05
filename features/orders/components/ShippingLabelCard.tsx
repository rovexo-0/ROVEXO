"use client";

import { LabelCard } from "@/features/shipping/components/LabelCard";
import type { Order } from "@/lib/orders/types";

type ShippingLabelCardProps = {
  order: Order;
};

/** @deprecated Use LabelCard from features/shipping/components — kept for zero regression. */
export function ShippingLabelCard({ order }: ShippingLabelCardProps) {
  return <LabelCard order={order} />;
}
