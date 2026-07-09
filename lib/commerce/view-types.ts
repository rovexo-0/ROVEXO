import type { CommerceParcel, CommerceSellerShipment, CommerceTotals } from "@/features/commerce-ui/types";
import type { ShipmentParcel, ShippingRecord } from "@/lib/shipping/types";
import type { mapOrderToLineItems, mapOrderToMeta } from "@/lib/commerce/mappers";

export type BuyerCommerceOrderView = {
  meta: ReturnType<typeof mapOrderToMeta>;
  items: ReturnType<typeof mapOrderToLineItems>;
  totals: CommerceTotals;
  sellerName: string;
  /** Shipments grouped by seller — parcels from different sellers are never mixed. */
  sellerShipments: CommerceSellerShipment[];
  parcels: CommerceParcel[];
  parcelCount: number;
  shipmentReady: boolean;
};

export type SellerShipmentView = {
  record: ShippingRecord | null;
  parcels: ShipmentParcel[];
  commerceParcels: CommerceParcel[];
  shipmentReady: boolean;
};
