/** UK-first shipping carriers — official names; guidance translated via i18n.
 * v1.0 customer-facing active set is EVRi / Royal Mail
 * (`lib/shipping/v1-0-carrier-whitelist-v1.ts`). DPD/InPost retained in the
 * full list for technical/i18n completeness but must not be offered in checkout v1.0.
 */
export const UK_SHIPPING_CARRIERS = [
  { id: "royal-mail", name: "Royal Mail", trackingSupported: true },
  { id: "evri", name: "EVRi", trackingSupported: true },
  { id: "dpd-uk", name: "DPD UK", trackingSupported: true },
  { id: "ups-uk", name: "UPS UK", trackingSupported: true },
  { id: "dhl-uk", name: "DHL UK", trackingSupported: true },
  { id: "fedex-uk", name: "FedEx UK", trackingSupported: true },
  { id: "inpost-uk", name: "InPost UK", trackingSupported: true },
  { id: "parcelforce", name: "Parcelforce", trackingSupported: true },
  { id: "yodel", name: "Yodel", trackingSupported: true },
] as const;

/** v1.0 customer-facing carrier names only. */
export const V1_0_UK_SHIPPING_CARRIERS = UK_SHIPPING_CARRIERS.filter((carrier) =>
  carrier.id === "royal-mail" || carrier.id === "evri",
);

export type UkShippingCarrierId = (typeof UK_SHIPPING_CARRIERS)[number]["id"];

export function getUkCarrierName(id: UkShippingCarrierId): string {
  return UK_SHIPPING_CARRIERS.find((carrier) => carrier.id === id)?.name ?? id;
}
