import type { ShippingMethod } from "@/lib/shipping/carriers";

export function deliveryCarriersForMethod(method: ShippingMethod): string[] {
  switch (method) {
    case "collection_only":
      return [];
    case "local_delivery":
      return ["Local Delivery"];
    case "delivery_available":
      return ["Royal Mail", "Evri"];
    default:
      return ["Royal Mail", "Evri"];
  }
}
