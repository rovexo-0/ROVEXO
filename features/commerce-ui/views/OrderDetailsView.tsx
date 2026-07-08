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
  CommerceParcel,
  CommerceTotals,
} from "@/features/commerce-ui/types";

type OrderDetailsViewProps = {
  meta: CommerceOrderMeta;
  items: CommerceLineItem[];
  totals: CommerceTotals;
  /** Total parcels the seller created after payment. */
  parcelCount: number;
  /** True once carrier labels exist. */
  shipmentReady: boolean;
  trackingHref: string;
  parcels?: CommerceParcel[];
  backHref?: string;
  showSuccessBanner?: boolean;
  /** When true, omits the page header (used inside account shell). */
  embedded?: boolean;
  className?: string;
};

/**
 * Canonical Order Details UI (UI LOCK).
 *
 * After payment the buyer sees order summary, shipment status and parcel count
 * (never "Label 1/2"). Before labels exist the shipment reads "Preparing Shipment".
 */
export function OrderDetailsView({
  meta,
  items,
  totals,
  parcelCount,
  shipmentReady,
  trackingHref,
  parcels = [],
  backHref = "/orders",
  showSuccessBanner = true,
  embedded = false,
  className,
}: OrderDetailsViewProps) {
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

        <ShipmentCard
          parcelCount={parcelCount}
          ready={shipmentReady}
          href={trackingHref}
          parcels={parcels}
        />

        <OrderSummaryTotals totals={totals} title="Order Summary" />
      </div>
    </div>
  );
}
