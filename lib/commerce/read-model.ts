import "server-only";

import {
  buildSellerShipments,
  getUiParcelsFromOrder,
  isShipmentReady,
  mapOrderToCommerceTotals,
  mapOrderToLineItems,
  mapOrderToMeta,
  mapShipmentParcelsToUi,
} from "@/lib/commerce/mappers";
import { getShippingRecord } from "@/lib/shipping/store";
import { listShipmentParcelsForOrder } from "@/lib/shipping/parcels-repository";
import type { Order } from "@/lib/orders/types";
import type { BuyerCommerceOrderView, SellerShipmentView } from "@/lib/commerce/view-types";

export type { BuyerCommerceOrderView, SellerShipmentView };

export async function getSellerShipmentView(order: Order): Promise<SellerShipmentView> {
  const record = await getShippingRecord(order.id);
  const parcels = await listShipmentParcelsForOrder(order.id);
  const commerceParcels =
    parcels.length > 0
      ? mapShipmentParcelsToUi(order, record, parcels)
      : getUiParcelsFromOrder(order, record);

  return {
    record,
    parcels,
    commerceParcels,
    shipmentReady: isShipmentReady(commerceParcels),
  };
}

export async function getBuyerCommerceOrderView(order: Order): Promise<BuyerCommerceOrderView> {
  const record = await getShippingRecord(order.id);
  const parcels = await listShipmentParcelsForOrder(order.id);
  const commerceParcels =
    parcels.length > 0
      ? mapShipmentParcelsToUi(order, record, parcels)
      : getUiParcelsFromOrder(order, record);
  const trackingHref = `/orders/${order.id}/tracking`;

  return {
    meta: mapOrderToMeta(order),
    items: mapOrderToLineItems(order),
    totals: mapOrderToCommerceTotals(order.totals),
    sellerName: order.seller.name,
    sellerShipments: buildSellerShipments(order, commerceParcels, trackingHref),
    parcels: commerceParcels,
    parcelCount: commerceParcels.length,
    shipmentReady: isShipmentReady(commerceParcels),
  };
}
