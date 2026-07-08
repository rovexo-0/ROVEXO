import type { UkCarrier } from "@/lib/shipping/carriers";

export type CheckoutCarrierQuote = {
  id: string;
  carrier: UkCarrier | string;
  serviceName: string;
  price: number;
  eta: string;
};
