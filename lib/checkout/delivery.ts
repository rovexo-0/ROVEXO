import { allCarrierNames, type UkCarrier } from "@/lib/shipping/carriers";

export type DeliveryOptionId = "standard" | "express";

export type DeliveryOption = {
  id: DeliveryOptionId;
  label: string;
  eta: string;
  price: number;
  carrier: UkCarrier;
};

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  { id: "standard", label: "Standard Delivery", eta: "2–4 days", price: 4.99, carrier: "Royal Mail" },
  { id: "express", label: "Express Delivery", eta: "1–2 days", price: 9.99, carrier: "DPD" },
];

export const CHECKOUT_CARRIERS = allCarrierNames();

export function getDeliveryPrice(optionId: DeliveryOptionId): number {
  return DELIVERY_OPTIONS.find((option) => option.id === optionId)?.price ?? 4.99;
}

export function getDeliveryCarrier(optionId: DeliveryOptionId): UkCarrier {
  return DELIVERY_OPTIONS.find((option) => option.id === optionId)?.carrier ?? "Royal Mail";
}
