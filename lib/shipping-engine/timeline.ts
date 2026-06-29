import type { ShipmentStatus } from "@/lib/shipping/carriers";
import { SHIPPING_ENGINE_TRACKING_STAGES } from "@/lib/shipping-engine/registry";
import type { ShippingEngineTimelineEvent, ShippingEngineTrackingStage } from "@/lib/shipping-engine/types";
import type { OrderStatus } from "@/lib/orders/types";

type TimelineInput = {
  orderStatus: OrderStatus;
  shipmentStatus?: ShipmentStatus | null;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
};

function stageProgress(input: TimelineInput): ShippingEngineTrackingStage {
  if (input.orderStatus === "cancelled") return "cancelled";

  if (input.orderStatus === "completed") return "delivery-confirmed";

  if (input.shipmentStatus === "failed") return "returned";

  if (input.orderStatus === "delivered" || input.orderStatus === "issue_open") {
    return input.shipmentStatus === "delivered" || input.deliveredAt ? "delivered" : "out-for-delivery";
  }

  if (input.shipmentStatus === "out_for_delivery") return "out-for-delivery";
  if (input.shipmentStatus === "in_transit") return "in-transit";
  if (input.shipmentStatus === "dispatched" || input.orderStatus === "shipped") return "dispatched";
  if (input.shipmentStatus === "label_created") return "awaiting-dispatch";
  if (input.orderStatus === "awaiting_shipment") return "awaiting-dispatch";

  return "order-created";
}

function timestampForStage(stage: ShippingEngineTrackingStage, input: TimelineInput): string | undefined {
  switch (stage) {
    case "order-created":
      return input.createdAt;
    case "awaiting-dispatch":
      return input.paidAt ?? input.createdAt;
    case "dispatched":
    case "collected":
      return input.shippedAt;
    case "delivered":
    case "delivery-confirmed":
      return input.deliveredAt ?? input.completedAt;
    case "cancelled":
      return input.cancelledAt;
    default:
      return undefined;
  }
}

const STAGE_ORDER: ShippingEngineTrackingStage[] = SHIPPING_ENGINE_TRACKING_STAGES.map((s) => s.id);

export function buildShippingTimeline(input: TimelineInput): ShippingEngineTimelineEvent[] {
  const current = stageProgress(input);
  const currentIndex = STAGE_ORDER.indexOf(current);

  const visibleStages = STAGE_ORDER.filter((stage) => stage !== "returned" && stage !== "cancelled");

  return visibleStages.map((stage) => {
    const index = STAGE_ORDER.indexOf(stage);
    const meta = SHIPPING_ENGINE_TRACKING_STAGES.find((item) => item.id === stage);
    return {
      id: stage,
      label: meta?.label ?? stage,
      timestamp: timestampForStage(stage, input),
      done: index <= currentIndex,
      current: stage === current,
    };
  });
}

export function mapShipmentStatusToStage(status: ShipmentStatus): ShippingEngineTrackingStage {
  const map: Record<ShipmentStatus, ShippingEngineTrackingStage> = {
    pending: "awaiting-dispatch",
    label_created: "awaiting-dispatch",
    dispatched: "dispatched",
    in_transit: "in-transit",
    out_for_delivery: "out-for-delivery",
    delivered: "delivered",
    failed: "returned",
  };
  return map[status];
}
