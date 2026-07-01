/** UK-first shipping carriers — official names; guidance translated via i18n. */
export const UK_SHIPPING_CARRIERS = [
  { id: "royal-mail", name: "Royal Mail", trackingSupported: true },
  { id: "evri", name: "Evri", trackingSupported: true },
  { id: "dpd-uk", name: "DPD UK", trackingSupported: true },
  { id: "ups-uk", name: "UPS UK", trackingSupported: true },
  { id: "dhl-uk", name: "DHL UK", trackingSupported: true },
  { id: "fedex-uk", name: "FedEx UK", trackingSupported: true },
  { id: "inpost-uk", name: "InPost UK", trackingSupported: true },
  { id: "parcelforce", name: "Parcelforce", trackingSupported: true },
  { id: "yodel", name: "Yodel", trackingSupported: true },
] as const;

export type UkShippingCarrierId = (typeof UK_SHIPPING_CARRIERS)[number]["id"];

export function getUkCarrierName(id: UkShippingCarrierId): string {
  return UK_SHIPPING_CARRIERS.find((carrier) => carrier.id === id)?.name ?? id;
}
