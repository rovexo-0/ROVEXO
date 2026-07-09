import { cn } from "@/lib/cn";
import { CommercePageHeader } from "@/features/commerce-ui/components/CommercePageHeader";
import {
  OrderInfoCard,
  OrderItemsPreviewCard,
  OrderPlacedBanner,
  OrderStatusCard,
} from "@/features/commerce-ui/components/OrderDetailCards";
import { ShipmentCard } from "@/features/commerce-ui/components/ShipmentCard";
import { OrderSummaryTotals } from "@/features/commerce-ui/components/OrderSummaryTotals";
import type {
  CommerceLineItem,
  CommerceOrderMeta,
  CommerceSellerShipment,
  CommerceTotals,
} from "@/features/commerce-ui/types";

type OrderDetailsViewProps = {
  meta: CommerceOrderMeta;
  items: CommerceLineItem[];
  totals: CommerceTotals;
  /** Shipments grouped by seller — parcels from different sellers are never mixed. */
  sellerShipments: CommerceSellerShipment[];
  /** @deprecated Use sellerShipments — kept for preview mocks. */
  parcelCount?: number;
  shipmentReady?: boolean;
  trackingHref?: string;
  backHref?: string;
  showSuccessBanner?: boolean;
  /** When true, omits the page header (used inside account shell). */
  embedded?: boolean;
  className?: string;
};

/**
 * Canonical Order Details UI (UI LOCK).
 *
 * After payment the buyer sees order summary and per-seller shipment groups.
 * Parcels from different sellers are never mixed in one shipment card.
 */
export function OrderDetailsView({
  meta,
  items,
  totals,
  sellerShipments,
  parcelCount,
  shipmentReady,
  trackingHref,
  backHref = "/orders",
  showSuccessBanner = true,
  embedded = false,
  className,
}: OrderDetailsViewProps) {
  const shipments =
    sellerShipments.length > 0
      ? sellerShipments
      : [
          {
            sellerId: "default",
            sellerName: "Seller",
            parcelCount: parcelCount ?? 0,
            shipmentReady: shipmentReady ?? false,
            parcels: [],
            trackingHref: trackingHref ?? "#",
          },
        ];

  return (
    <div className={cn("flex min-h-full flex-col bg-background", className)}>
      {embedded ? null : <CommercePageHeader title="Order Details" backHref={backHref} />}

      <div
        className={cn(
          "mx-auto flex w-full max-w-lg flex-1 flex-col gap-ds-4",
          embedded ? "px-0 py-0" : "px-ds-4 py-ds-5 pb-[calc(84px+env(safe-area-inset-bottom))]",
        )}
      >
        {showSuccessBanner ? <OrderPlacedBanner /> : null}
        <OrderInfoCard meta={meta} />
        <OrderStatusCard meta={meta} />
        <OrderItemsPreviewCard items={items} />

        {shipments.map((shipment) => (
          <ShipmentCard
            key={shipment.sellerId}
            sellerName={shipment.sellerName}
            parcelCount={shipment.parcelCount}
            ready={shipment.shipmentReady}
            href={shipment.trackingHref}
            parcels={shipment.parcels}
          />
        ))}

        <OrderSummaryTotals totals={totals} title="Order Summary" />
      </div>
    </div>
  );
}
