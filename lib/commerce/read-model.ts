import {
  getUiParcelsFromOrder,
  isShipmentReady,
  mapOrderToCommerceTotals,
  mapOrderToLineItems,
  mapOrderToMeta,
  mapOrderToSellerGroup,
  mapShipmentParcelsToUi,
} from "@/lib/commerce/mappers";
import { getShippingRecord } from "@/lib/shipping/store";
import { listShipmentParcelsForOrder } from "@/lib/shipping/parcels-repository";
import type { Order } from "@/lib/orders/types";
import type { CommerceParcel, CommerceTotals } from "@/features/commerce-ui/types";
import type { ShipmentParcel, ShippingRecord } from "@/lib/shipping/types";

export type BuyerCommerceOrderView = {
  meta: ReturnType<typeof mapOrderToMeta>;
  items: ReturnType<typeof mapOrderToLineItems>;
  totals: CommerceTotals;
  sellerName: string;
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

  return {
    meta: mapOrderToMeta(order),
    items: mapOrderToLineItems(order),
    totals: mapOrderToCommerceTotals(order.totals),
    sellerName: order.seller.name,
    parcels: commerceParcels,
    parcelCount: commerceParcels.length,
    shipmentReady: isShipmentReady(commerceParcels),
  };
}

export function mapProductToCheckoutSellerGroup(input: {
  sellerId: string;
  sellerName: string;
  productId: string;
  title: string;
  price: number;
  imageUrl: string | null;
  quantity?: number;
}) {
  return {
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    items: [
      {
        id: input.productId,
        title: input.title,
        quantity: input.quantity ?? 1,
        price: input.price,
        imageUrl: input.imageUrl,
      },
    ],
  };
}

export { mapOrderToCommerceTotals, mapOrderToSellerGroup };
