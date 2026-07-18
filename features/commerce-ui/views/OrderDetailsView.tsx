import { cn } from "@/lib/cn";
import { AccountIcon } from "@/components/account/AccountIcons";
import { CommercePageHeader } from "@/features/commerce-ui/components/CommercePageHeader";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { formatGBP } from "@/features/commerce-ui/lib/format";
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
  sellerShipments: CommerceSellerShipment[];
  parcelCount?: number;
  shipmentReady?: boolean;
  trackingHref?: string;
  backHref?: string;
  showSuccessBanner?: boolean;
  embedded?: boolean;
  className?: string;
  messagesHref?: string;
  reviewHref?: string;
  supportHref?: string;
};

/**
 * Order Details — Absolute Final.
 * Photo · title · status · tracking · payment · delivery · messages · review · support.
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
  embedded = false,
  className,
  messagesHref,
  reviewHref = "/account/reviews",
  supportHref = "/help",
}: OrderDetailsViewProps) {
  const primary = items[0];
  const shipment = sellerShipments[0];
  const trackHref = trackingHref ?? shipment?.trackingHref;
  const paid = meta.paymentStatus === "paid";
  const ready = shipment?.shipmentReady ?? shipmentReady ?? false;

  return (
    <div className={cn("ac-canonical flex min-h-full flex-col bg-background", className)}>
      {embedded ? null : <CommercePageHeader title="Order" backHref={backHref} />}

      <div
        className={cn(
          "flex w-full flex-1 flex-col gap-ds-4",
          embedded ? "px-0 py-0" : "px-ds-4 py-ds-4 pb-[calc(84px+env(safe-area-inset-bottom))]",
        )}
      >
        <CanonicalSection title="Product">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title={primary?.title ?? `Order #${meta.orderNumber}`}
              description={`#${meta.orderNumber} · ${meta.placedAt}`}
              value={formatGBP(totals.total)}
              showChevron={false}
              icon={
                primary ? (
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg" aria-hidden>
                    <SafeImage
                      src={primary.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </span>
                ) : (
                  <span className="ac-canonical__menu-icon" aria-hidden>
                    <AccountIcon name="orders" />
                  </span>
                )
              }
            />
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Status">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title="Order status"
              value={ready ? "In progress" : "Confirmed"}
              showChevron={false}
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name="orders" />
                </span>
              }
            />
            <CanonicalMenuRow
              title="Payment status"
              value={paid ? "Paid" : "Pending"}
              showChevron={false}
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name="payment" />
                </span>
              }
            />
            <CanonicalMenuRow
              title="Delivery status"
              value={ready ? "Shipped" : "Preparing"}
              showChevron={false}
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name="shipping" />
                </span>
              }
            />
            {trackHref ? (
              <CanonicalMenuRow
                title="Tracking"
                description={
                  shipment
                    ? `${shipment.parcelCount || parcelCount || shipment.parcels.length || 1} parcel(s)`
                    : undefined
                }
                href={trackHref}
                icon={
                  <span className="ac-canonical__menu-icon" aria-hidden>
                    <AccountIcon name="shipping" />
                  </span>
                }
              />
            ) : null}
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Actions">
          <CanonicalCard variant="list">
            {messagesHref ? (
              <CanonicalMenuRow
                title="Messages"
                href={messagesHref}
                icon={
                  <span className="ac-canonical__menu-icon" aria-hidden>
                    <AccountIcon name="messages" />
                  </span>
                }
              />
            ) : null}
            <CanonicalMenuRow
              title="Review"
              href={reviewHref}
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name="reviews" />
                </span>
              }
            />
            <CanonicalMenuRow
              title="Support"
              href={supportHref}
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name="help" />
                </span>
              }
            />
          </CanonicalCard>
        </CanonicalSection>
      </div>
    </div>
  );
}
