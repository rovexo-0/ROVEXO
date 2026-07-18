import { Package } from "lucide-react";
import { cn } from "@/lib/cn";
import { CommercePageHeader } from "@/features/commerce-ui/components/CommercePageHeader";
import { InfoBannerCard } from "@/features/commerce-ui/components/InfoBannerCard";
import { OrderContextCard } from "@/features/commerce-ui/components/OrderContextCard";
import { ParcelTrackingCard } from "@/features/commerce-ui/components/ParcelTrackingCard";
import { NeedHelpCard } from "@/features/commerce-ui/components/NeedHelpCard";
import type { CommerceSellerShipment } from "@/features/commerce-ui/types";

type TrackingViewProps = {
  orderNumber: string;
  itemCount: number;
  /** @deprecated Use sellerShipments */
  sellerName?: string;
  /** Shipments grouped by seller — parcels from different sellers are never mixed. */
  sellerShipments: CommerceSellerShipment[];
  orderId?: string;
  orderHref: string;
  backHref?: string;
  /** When true, omits the page header (used inside account shell). */
  embedded?: boolean;
  className?: string;
};

/**
 * Canonical Tracking UI (UI LOCK).
 *
 * Parcels are grouped by seller. Each parcel is an independent card titled
 * "Parcel X of Y" with its own product allocation and timeline.
 */
export function TrackingView({
  orderNumber,
  itemCount,
  sellerShipments,
  orderId,
  orderHref,
  backHref = "/orders",
  embedded = false,
  className,
}: TrackingViewProps) {
  const primarySeller = sellerShipments[0]?.sellerName ?? "Seller";

  return (
    <div className={cn("flex min-h-full flex-col bg-background", className)}>
      {embedded ? null : <CommercePageHeader title="Tracking" backHref={backHref} />}

      <div
        className={cn(
          "flex w-full flex-1 flex-col gap-ds-4",
          embedded
            ? "px-0 py-0"
            : "w-full max-w-none px-ds-4 py-ds-5 pb-[calc(84px+env(safe-area-inset-bottom))]",
        )}
      >
        <InfoBannerCard
          tone="info"
          icon={<Package className="h-5 w-5" />}
          title="Your order is on the way!"
          description="Below you can find tracking information for all parcels in this order."
        />

        <OrderContextCard
          orderNumber={orderNumber}
          itemCount={itemCount}
          sellerName={primarySeller}
          orderHref={orderHref}
        />

        {sellerShipments.map((shipment) => (
          <section key={shipment.sellerId} className="flex flex-col gap-ds-4">
            <h2 className="text-sm font-semibold text-text-primary">
              Shipment from {shipment.sellerName}
            </h2>
            {shipment.parcels.map((parcel) => (
              <ParcelTrackingCard
                key={parcel.id}
                parcel={parcel}
                orderId={orderId}
                showOperations={Boolean(orderId)}
              />
            ))}
          </section>
        ))}

        <NeedHelpCard />
      </div>
    </div>
  );
}
