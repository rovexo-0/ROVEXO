"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CanonicalButton,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalSection,
} from "@/src/components/canonical";
import { PublishedCheckmark } from "@/features/sell/components/PublishedCheckmark";
import { OrderReviewCard } from "@/features/orders/components/OrderReviewCard";
import { IssueResolutionLink } from "@/features/orders/components/IssueResolutionLink";
import { DeliveryStatusCard } from "@/features/orders/components/DeliveryStatusCard";
import { BuyerCancelOrderCard } from "@/features/orders/components/BuyerCancelOrderCard";
import { RefundStatusCard } from "@/features/orders/components/RefundStatusCard";
import { OrderActionsCard } from "@/features/orders/components/OrderActionsCard";
import { SellerOrderFulfillment } from "@/features/orders/components/SellerOrderFulfillment";
import { OrderProductCard } from "@/features/orders/components/OrderProductCard";
import { OrderSummaryTotals } from "@/features/commerce-ui/components/OrderSummaryTotals";
import { SellerOrderSummaryTotals } from "@/features/orders/components/SellerOrderSummaryTotals";
import { mapOrderToCommerceTotals } from "@/lib/commerce/mappers";
import type { SellerShipmentView } from "@/lib/commerce/view-types";
import { EscrowReleaseCard } from "@/features/commerce/components/EscrowReleaseCard";
import { ResolutionStatusCard } from "@/features/commerce/components/ResolutionStatusCard";
import {
  canConfirmDelivery,
  getDeliveryStages,
  isOrderClosed,
} from "@/lib/orders/delivery";
import { resolveOrderViewRole } from "@/lib/orders/role";
import { isPersistedSellerCancellationReason } from "@/lib/orders/cancellation";
import { formatCurrency } from "@/lib/wallet/utils";
import type { OrderEscrowState } from "@/lib/commerce-engine/read-model";
import type { OrderResolutionSummary } from "@/lib/resolution-engine/types";
import type { Order } from "@/lib/orders/types";
import {
  extractActiveOrderDisplayCarriers,
  resolveOrderDisplayCarrier,
  resolveOrderDisplayTracking,
} from "@/lib/orders/resolve-order-display-carrier-v1";
import type { ShipmentParcel } from "@/lib/shipping/types";

type OrderDetailViewProps = {
  initialOrder: Order;
  userId: string;
  escrowState?: OrderEscrowState;
  resolutionSummary?: OrderResolutionSummary;
  sellerShipment?: SellerShipmentView;
  /** Current active shipping label carrier when already loaded (Hub). */
  activeLabelCarrier?: string | null;
  /** Current active shipment parcel carrier when already loaded. */
  activeParcelCarrier?: string | null;
  buyerCanCancel?: boolean;
  buyerCancelReason?: string;
  onOrderUpdated?: (order: Order) => void;
  /** Close Order Details when already inside Conversation Hub. */
  onOpenMessages?: () => void;
};

export function OrderDetailView({
  initialOrder,
  userId,
  escrowState,
  resolutionSummary,
  sellerShipment,
  activeLabelCarrier = null,
  activeParcelCarrier = null,
  buyerCanCancel = false,
  buyerCancelReason,
  onOrderUpdated,
  onOpenMessages,
}: OrderDetailViewProps) {
  const [order, setOrder] = useState(initialOrder);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchedParcels, setFetchedParcels] = useState<ShipmentParcel[] | null>(null);
  const [fetchedRecordCarrier, setFetchedRecordCarrier] = useState<string | null>(null);
  const [fetchedRecordTracking, setFetchedRecordTracking] = useState<string | null>(null);
  const view = resolveOrderViewRole(order, userId);

  const shipmentParcels = sellerShipment?.parcels ?? fetchedParcels;
  const extracted = useMemo(
    () => extractActiveOrderDisplayCarriers(shipmentParcels),
    [shipmentParcels],
  );
  const shippingRecordCarrier =
    sellerShipment?.record?.carrier ?? fetchedRecordCarrier;
  const shippingRecordTracking =
    sellerShipment?.record?.trackingNumber ?? fetchedRecordTracking;

  useEffect(() => {
    // Always hydrate current shipment parcels unless already provided.
    // Hub activeLabelCarrier must NOT skip this — recovered multi-carrier
    // display requires selectCurrentOrderParcels over a possibly stale label GET.
    if (sellerShipment || fetchedParcels) {
      return;
    }
    let cancelled = false;
    void fetch(`/api/orders/${order.id}/shipment`)
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (
          payload: {
            shipment?: {
              parcels?: ShipmentParcel[];
              record?: { carrier?: string | null; trackingNumber?: string | null } | null;
            };
          } | null,
        ) => {
          if (cancelled) return;
          setFetchedParcels(payload?.shipment?.parcels ?? []);
          setFetchedRecordCarrier(payload?.shipment?.record?.carrier ?? null);
          setFetchedRecordTracking(payload?.shipment?.record?.trackingNumber ?? null);
        },
      )
      .catch(() => {
        if (!cancelled) {
          setFetchedParcels([]);
          setFetchedRecordCarrier(null);
          setFetchedRecordTracking(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetchedParcels, order.id, sellerShipment]);

  // Current shipment extract wins over Hub label props (active label → parcel → record → order).
  const displayCarrier = resolveOrderDisplayCarrier({
    orderCarrier: order.deliveryCarrier,
    shippingRecordCarrier,
    activeLabelCarrier: extracted.activeLabelCarrier || activeLabelCarrier,
    activeParcelCarrier: extracted.activeParcelCarrier || activeParcelCarrier,
  });
  const displayTracking = resolveOrderDisplayTracking({
    orderTracking: order.trackingNumber,
    shippingRecordTracking,
    activeParcelTracking: extracted.activeTrackingNumber,
  });

  const updateOrder = useCallback(
    (next: Order) => {
      setOrder(next);
      onOrderUpdated?.(next);
    },
    [onOrderUpdated],
  );

  const handleBuyerAction = useCallback(async (action: "confirm_ok" | "report_issue") => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("Unable to update order.");
      }

      const payload = (await response.json()) as { order: Order };
      updateOrder(payload.order);
    } finally {
      setIsSubmitting(false);
    }
  }, [order.id, updateOrder]);

  if (!view) return null;

  const stages = getDeliveryStages(order);
  const sellerCancelled = isPersistedSellerCancellationReason(order.cancellationReason);
  const showBuyerConfirm = view === "buyer" && canConfirmDelivery(order.status, order.disputesDisabled);
  const showCompleted = view === "buyer" && order.status === "completed";

  if (showCompleted) {
    return (
      <div className="flex w-full flex-col gap-ds-4">
        <section
          className="flex w-full flex-col items-center gap-ds-4 py-ds-6 text-center"
          aria-labelledby="order-complete-heading"
        >
          <PublishedCheckmark />
          <CanonicalInfoBlock variant="success">
            <p id="order-complete-heading" className="font-medium text-text-primary">
              Thank you
            </p>
            <p className="mt-ds-1 text-sm">
              Funds release 24h after delivery unless claimed.
            </p>
            {order.disputesDisabled ? (
              <p className="mt-ds-1 text-xs text-text-muted">Disputes disabled.</p>
            ) : null}
          </CanonicalInfoBlock>
        </section>
        <OrderActionsCard
          order={order}
          view={view}
          onOpenMessages={onOpenMessages}
          displayCarrier={displayCarrier}
          displayTrackingNumber={displayTracking}
        />
        <OrderReviewCard orderId={order.id} sellerName={order.seller.name} />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-ds-4">
      {view === "seller" && sellerShipment ? (
        <SellerOrderFulfillment
          order={order}
          userId={userId}
          shipment={sellerShipment}
          onOrderUpdated={updateOrder}
        />
      ) : (
        <OrderProductCard order={order} userId={userId} />
      )}

      {stages.length > 0 && view === "buyer" ? (
        <DeliveryStatusCard stages={stages} carrier={displayCarrier} />
      ) : null}

      {view === "buyer" && order.status === "cancelled" && sellerCancelled ? (
        <CanonicalInfoBlock variant="description">
          <p className="font-medium text-text-primary">Cancelled by seller</p>
          <p className="mt-ds-1">Reason: {order.cancellationReason}</p>
          <p className="mt-ds-1">Refunded to Wallet</p>
          <p className="mt-ds-1">{formatCurrency(order.refundedAmount ?? order.totals.total)}</p>
        </CanonicalInfoBlock>
      ) : null}

      {order.status === "awaiting_payment" ? (
        <CanonicalInfoBlock variant="description">
          <p>Awaiting payment.</p>
        </CanonicalInfoBlock>
      ) : null}

      {view === "seller" ? (
        <SellerOrderSummaryTotals totals={order.totals} title="Summary" />
      ) : (
        <OrderSummaryTotals totals={mapOrderToCommerceTotals(order.totals)} title="Summary" />
      )}

      {escrowState && view ? <EscrowReleaseCard escrow={escrowState} view={view} /> : null}

      {resolutionSummary && view ? (
        <ResolutionStatusCard resolution={resolutionSummary} view={view} />
      ) : null}

      <div className="order-detail-action-stack" data-order-detail-actions="v1.0">
        <OrderActionsCard
          order={order}
          view={view}
          onOpenMessages={onOpenMessages}
          displayCarrier={displayCarrier}
          displayTrackingNumber={displayTracking}
        />
        {view === "buyer" ? (
          <BuyerCancelOrderCard
            order={order}
            canCancel={buyerCanCancel}
            disabledReason={buyerCancelReason}
            onCancelled={updateOrder}
          />
        ) : null}
      </div>

      {view === "buyer" ? <RefundStatusCard order={order} /> : null}

      {showBuyerConfirm ? (
        <CanonicalSection title="Delivery">
          <CanonicalCard variant="medium" className="flex w-full flex-col gap-ds-2">
            <CanonicalButton
              fullWidth
              loading={isSubmitting}
              onClick={() => void handleBuyerAction("confirm_ok")}
            >
              Confirm OK
            </CanonicalButton>
            <CanonicalButton
              variant="outline"
              fullWidth
              disabled={isSubmitting || isOrderClosed(order)}
              onClick={() => void handleBuyerAction("report_issue")}
            >
              Report issue
            </CanonicalButton>
          </CanonicalCard>
        </CanonicalSection>
      ) : null}

      {order.status === "issue_open" ? (
        <CanonicalSection title="Issue">
          <CanonicalInfoBlock variant="warning">
            <p>
              {view === "buyer"
                ? "Under review. Track in Resolution Centre."
                : "Buyer reported an issue. Respond in Resolution Centre."}
            </p>
          </CanonicalInfoBlock>
          <IssueResolutionLink orderId={order.id} className="mt-ds-2" />
        </CanonicalSection>
      ) : null}
    </div>
  );
}
