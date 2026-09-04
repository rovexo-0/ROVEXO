"use client";

import { CanonicalMenuRow } from "@/src/components/canonical";
import { ChatLineIcon, TruckLineIcon } from "@/components/icons/RvxLineIcons";
import { getMessageHref, getOrderHubTrackHref, getTrackingUrl } from "@/lib/orders/status";
import type { Order, OrderViewRole } from "@/lib/orders/types";
import type { DeliveryCarrier } from "@/lib/products/types";
import "@/styles/rovexo/order-detail-action-cards-v1.css";

type OrderActionsCardProps = {
  order: Order;
  view: OrderViewRole;
  onTrack?: () => void;
  /** When Order Details is already open over the Conversation Hub, close the sheet. */
  onOpenMessages?: () => void;
  /** Current active shipment carrier — never invent a default. */
  displayCarrier?: string;
  /** Current active shipment tracking — never historical parcel identity. */
  displayTrackingNumber?: string;
};

/**
 * Order Details action cards (IMAGE 2).
 * Primary: compact Open Messages Hub card. Optional track rows when applicable.
 */
export function OrderActionsCard({
  order,
  view,
  onTrack,
  onOpenMessages,
  displayCarrier,
  displayTrackingNumber,
}: OrderActionsCardProps) {
  const trackingNumber = (displayTrackingNumber ?? order.trackingNumber ?? "").trim();
  const carrier = (displayCarrier ?? order.deliveryCarrier ?? "").trim();
  const canTrack =
    Boolean(trackingNumber) &&
    (order.status === "shipped" || order.status === "delivered" || order.status === "completed");

  const messagesHref = getMessageHref(order.id, view, order.conversationId);

  return (
    <>
      <div
        className="order-detail-action-card order-detail-action-card--messages"
        data-order-detail-action="messages"
      >
        <CanonicalMenuRow
          title="Open Messages Hub"
          description="Continue the conversation with the seller."
          icon={<ChatLineIcon />}
          href={onOpenMessages ? undefined : messagesHref}
          onClick={
            onOpenMessages
              ? () => {
                  onOpenMessages();
                }
              : undefined
          }
        />
      </div>

      {canTrack && trackingNumber ? (
        <div
          className="order-detail-action-card order-detail-action-card--track"
          data-order-detail-action="track-hub"
        >
          <CanonicalMenuRow
            title="Track in Messages Hub"
            icon={<TruckLineIcon />}
            href={getOrderHubTrackHref(order.id, order.conversationId)}
            onClick={() => {
              onTrack?.();
            }}
          />
        </div>
      ) : null}

      {canTrack && trackingNumber ? (
        <div
          className="order-detail-action-card order-detail-action-card--track"
          data-order-detail-action="track-carrier"
        >
          <CanonicalMenuRow
            title="Carrier tracking (external)"
            icon={<TruckLineIcon />}
            onClick={() => {
              window.open(
                carrier
                  ? getTrackingUrl(carrier as DeliveryCarrier, trackingNumber)
                  : `https://www.google.com/search?q=${encodeURIComponent(trackingNumber)}`,
                "_blank",
                "noopener,noreferrer",
              );
              onTrack?.();
            }}
          />
        </div>
      ) : null}
    </>
  );
}
