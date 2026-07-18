import { cn } from "@/lib/cn";
import { CommercePageHeader } from "@/features/commerce-ui/components/CommercePageHeader";
import { ParcelTrackingCard } from "@/features/commerce-ui/components/ParcelTrackingCard";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import type { CommerceSellerShipment } from "@/features/commerce-ui/types";

type TrackingViewProps = {
  orderNumber: string;
  itemCount: number;
  sellerName?: string;
  sellerShipments: CommerceSellerShipment[];
  orderId?: string;
  orderHref: string;
  backHref?: string;
  embedded?: boolean;
  className?: string;
};

/**
 * Tracking — Absolute Final.
 * Status · courier · parcel · delivery updates · order updates.
 * No help micro-cards. No operations grid.
 */
export function TrackingView({
  orderNumber,
  itemCount,
  sellerShipments,
  orderHref,
  backHref = "/orders",
  embedded = false,
  className,
}: TrackingViewProps) {
  const primarySeller = sellerShipments[0]?.sellerName ?? "Seller";

  return (
    <div className={cn("ac-canonical flex min-h-full flex-col bg-background", className)}>
      {embedded ? null : <CommercePageHeader title="Tracking" backHref={backHref} />}

      <div
        className={cn(
          "flex w-full flex-1 flex-col gap-ds-4",
          embedded
            ? "px-0 py-0"
            : "w-full max-w-none px-ds-4 py-ds-4 pb-[calc(84px+env(safe-area-inset-bottom))]",
        )}
      >
        <CanonicalSection title="Order">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title={`Order #${orderNumber}`}
              description={`${itemCount} ${itemCount === 1 ? "item" : "items"} · ${primarySeller}`}
              href={orderHref}
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name="orders" />
                </span>
              }
            />
          </CanonicalCard>
        </CanonicalSection>

        {sellerShipments.map((shipment) =>
          shipment.parcels.map((parcel) => (
            <ParcelTrackingCard key={parcel.id} parcel={parcel} showOperations={false} />
          )),
        )}
      </div>
    </div>
  );
}
