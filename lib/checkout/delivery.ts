export type DeliveryOptionId = "standard" | "express";

export type DeliveryOption = {
  id: DeliveryOptionId;
  label: string;
  eta: string;
  price: number;
};

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  { id: "standard", label: "Standard Delivery", eta: "2–3 days", price: 4.99 },
  { id: "express", label: "Express Delivery", eta: "Next Day", price: 9.99 },
];

export function getDeliveryPrice(optionId: DeliveryOptionId): number {
  return DELIVERY_OPTIONS.find((option) => option.id === optionId)?.price ?? 4.99;
}

export function getDeliveryCarrier(optionId: DeliveryOptionId): "Royal Mail" | "DPD" {
  return optionId === "express" ? "DPD" : "Royal Mail";
}
