import { Package } from "lucide-react";
import { cn } from "@/lib/cn";
import { CommercePageHeader } from "@/features/commerce-ui/components/CommercePageHeader";
import { InfoBannerCard } from "@/features/commerce-ui/components/InfoBannerCard";
import { OrderContextCard } from "@/features/commerce-ui/components/OrderContextCard";
import { ParcelTrackingCard } from "@/features/commerce-ui/components/ParcelTrackingCard";
import { NeedHelpCard } from "@/features/commerce-ui/components/NeedHelpCard";
import type { CommerceParcel } from "@/features/commerce-ui/types";

type TrackingViewProps = {
  orderNumber: string;
  itemCount: number;
  sellerName: string;
  parcels: CommerceParcel[];
  orderHref: string;
  backHref?: string;
  className?: string;
};

/**
 * Canonical Tracking UI (UI LOCK).
 *
 * Each parcel is an independent card titled "Parcel X of Y". The buyer clearly
 * sees one order with multiple parcels tracked separately.
 */
export function TrackingView({
  orderNumber,
  itemCount,
  sellerName,
  parcels,
  orderHref,
  backHref = "/orders",
  className,
}: TrackingViewProps) {
  return (
    <div className={cn("flex min-h-full flex-col bg-background", className)}>
      <CommercePageHeader title="Tracking" backHref={backHref} />

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-ds-4 px-ds-4 py-ds-5 pb-[calc(84px+env(safe-area-inset-bottom))]">
        <InfoBannerCard
          tone="info"
          icon={<Package className="h-5 w-5" />}
          title="Your order is on the way!"
          description="Below you can find tracking information for all parcels in this order."
        />

        <OrderContextCard
          orderNumber={orderNumber}
          itemCount={itemCount}
          sellerName={sellerName}
          orderHref={orderHref}
        />

        {parcels.map((parcel) => (
          <ParcelTrackingCard key={`${parcel.index}-${parcel.trackingNumber ?? "pending"}`} parcel={parcel} />
        ))}

        <NeedHelpCard />
      </div>
    </div>
  );
}
