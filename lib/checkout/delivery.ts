import { allCarrierNames, type UkCarrier } from "@/lib/shipping/carriers";
import { fetchShippingQuotes, getConfiguredProviders } from "@/lib/shipping/pricing/service";

export type DeliveryOptionId = "standard" | "express";

export type DeliveryOption = {
  id: DeliveryOptionId;
  label: string;
  eta: string;
  carrier: UkCarrier;
};

/** Delivery options — prices come from listing shipping_price or live provider quotes (never hardcoded). */
export const DELIVERY_OPTIONS: DeliveryOption[] = [
  { id: "standard", label: "Standard Delivery", eta: "2–4 days", carrier: "Royal Mail" },
  { id: "express", label: "Express Delivery", eta: "1–2 days", carrier: "DPD" },
];

export const CHECKOUT_CARRIERS = allCarrierNames();

export function getDeliveryPrice(
  _optionId: DeliveryOptionId,
  options?: { listingOffersFreeDelivery?: boolean; listingShippingPrice?: number | null },
): number | null {
  if (options?.listingOffersFreeDelivery) {
    return 0;
  }
  if (options?.listingShippingPrice != null && options.listingShippingPrice >= 0) {
    return options.listingShippingPrice;
  }
  return null;
}

export function getDeliveryCarrier(optionId: DeliveryOptionId): UkCarrier {
  return DELIVERY_OPTIONS.find((option) => option.id === optionId)?.carrier ?? "Royal Mail";
}

export function isLiveShippingPricingAvailable(): boolean {
  return getConfiguredProviders().some((provider) => provider.configured);
}

export async function resolveLiveDeliveryQuotes(
  input: Parameters<typeof fetchShippingQuotes>[0],
) {
  return fetchShippingQuotes(input);
}
