"use client";

import { SellerFulfillmentCard } from "@/features/orders/components/SellerFulfillmentCard";
import { ShipmentWizard } from "@/features/shipping/components/ShipmentWizard";
import type { SellerShipmentView } from "@/lib/commerce/view-types";
import type { Order } from "@/lib/orders/types";

type SellerOrderFulfillmentProps = {
  order: Order;
  userId: string;
  shipment: SellerShipmentView;
  onOrderUpdated: (order: Order) => void;
};

export function SellerOrderFulfillment({
  order,
  userId,
  shipment,
  onOrderUpdated,
}: SellerOrderFulfillmentProps) {
  return (
    <div className="flex flex-col gap-ds-5">
      <ShipmentWizard
        order={order}
        userId={userId}
        initialRecord={shipment.record}
        initialParcels={shipment.parcels}
      />
      <SellerFulfillmentCard order={order} onUpdated={onOrderUpdated} />
    </div>
  );
}
