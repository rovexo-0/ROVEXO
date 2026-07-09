import type {
  CommerceLineItem,
  CommerceOrderMeta,
  CommerceParcel,
  CommerceSellerGroup,
  CommerceSellerShipment,
  CommerceTotals,
  ParcelOperation,
} from "@/features/commerce-ui/types";
import { buildCanonicalShipmentTimeline } from "@/features/commerce-ui/lib/shipment-timeline";
import { mapShippingStatusToParcelStatus } from "@/features/commerce-ui/lib/status";
import type { ShippingRecord, ShipmentParcel, ShippingStatus } from "@/lib/shipping/types";
import type { Order, OrderTotals } from "@/lib/orders/types";
import type {
  CommerceOrderModel,
  CommerceParcelModel,
  CommerceShipmentModel,
  ShipmentStatus,
} from "@/lib/commerce/types";

type ShippingLabelRow = {
  id: string;
  parcel_number?: number | null;
  total_parcels?: number | null;
  tracking_number: string | null;
  carrier: string;
  label_status: string;
  tracking_url?: string | null;
  shipping_service?: string | null;
  estimated_delivery_at?: string | null;
  weight_kg?: number | null;
  length_cm?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  created_at: string;
  updated_at: string;
};

type ShippingRecordRow = {
  tracking_url?: string | null;
  estimated_delivery_at?: string | null;
};

function formatCommerceTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDeliveryDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function mapRecordStatusToShipmentStatus(
  status: ShippingStatus,
  hasLabels: boolean,
  orderPaid: boolean,
  operation?: ParcelOperation | null,
): ShipmentStatus {
  if (operation === "claim") return "claim_open";
  if (operation === "damaged") return "damaged";
  if (operation === "lost") return "lost";
  if (operation === "return") return "returned";

  if (!orderPaid) return "order_confirmed";
  if (!hasLabels && status === "preparing") return "preparing_shipment";
  if (hasLabels && status === "preparing") return "labels_created";

  switch (status) {
    case "collected":
      return "collected";
    case "in_transit":
      return "in_transit";
    case "out_for_delivery":
      return "out_for_delivery";
    case "delivered":
      return "delivered";
    case "returned":
      return "returned";
    case "cancelled":
      return "cancelled";
    case "lost":
      return "lost";
    case "failed":
      return "damaged";
    default:
      return hasLabels ? "labels_created" : "preparing_shipment";
  }
}

function mapParcelProductItems(order: Order, productItemIds: string[]): CommerceLineItem[] {
  const lineItems = mapOrderToLineItems(order);
  if (productItemIds.length === 0) return lineItems;
  return lineItems.filter((item) => productItemIds.includes(item.id));
}

function resolveParcelShipmentStatus(
  parcel: ShipmentParcel,
  order: Order,
): ShipmentStatus {
  const hasLabel = Boolean(parcel.label?.status === "ready" || parcel.trackingNumber);
  return mapRecordStatusToShipmentStatus(
    parcel.status,
    hasLabel,
    Boolean(order.paidAt),
    parcel.operation,
  );
}

export function buildSellerShipments(
  order: Order,
  parcels: CommerceParcel[],
  trackingHref: string,
): CommerceSellerShipment[] {
  if (parcels.length === 0) {
    return [
      {
        sellerId: order.seller.id,
        sellerName: order.seller.name,
        parcelCount: 0,
        shipmentReady: false,
        parcels: [],
        trackingHref,
      },
    ];
  }

  return [
    {
      sellerId: order.seller.id,
      sellerName: order.seller.name,
      parcelCount: parcels.length,
      shipmentReady: isShipmentReady(parcels),
      parcels,
      trackingHref,
    },
  ];
}

function buildTimeline(
  record: ShippingRecord,
  parcelStatus: ShipmentStatus,
): CommerceParcelModel["timeline"] {
  const events = record.trackingEvents;
  if (events.length === 0) {
    return [
      {
        id: `${record.id}-preparing`,
        title: "Preparing Shipment",
        occurredAt: record.createdAt,
        current: parcelStatus === "preparing_shipment" || parcelStatus === "labels_created",
        done: parcelStatus !== "preparing_shipment",
      },
    ];
  }

  const latestId = events[events.length - 1]?.id;
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    occurredAt: event.occurredAt,
    current: event.id === latestId,
    done: true,
  }));
}

function mapLabelRowsToParcels(
  record: ShippingRecord,
  labels: ShippingLabelRow[],
  recordRow: ShippingRecordRow | null,
  order: Order,
): CommerceParcelModel[] {
  const orderPaid = Boolean(order.paidAt);
  const hasLabels = labels.length > 0 || Boolean(record.label?.trackingNumber || record.trackingNumber);

  if (labels.length > 0) {
    const totalParcels = Math.max(
      ...labels.map((label) => label.total_parcels ?? labels.length),
      labels.length,
    );

    return labels.map((label, index) => {
      const parcelNumber = label.parcel_number ?? index + 1;
      const shipmentStatus = mapRecordStatusToShipmentStatus(record.status, true, orderPaid);

      return {
        parcelNumber,
        totalParcels,
        carrier: label.carrier || String(record.carrier ?? order.deliveryCarrier),
        trackingNumber: label.tracking_number ?? record.trackingNumber,
        trackingUrl: label.tracking_url ?? recordRow?.tracking_url ?? null,
        labelId: label.id,
        status: shipmentStatus,
        estimatedDelivery: formatDeliveryDate(
          label.estimated_delivery_at ?? recordRow?.estimated_delivery_at,
        ),
        createdAt: label.created_at,
        updatedAt: label.updated_at,
        weightKg: label.weight_kg ?? null,
        dimensions:
          label.length_cm || label.width_cm || label.height_cm
            ? {
                lengthCm: label.length_cm ?? null,
                widthCm: label.width_cm ?? null,
                heightCm: label.height_cm ?? null,
              }
            : null,
        shippingService: label.shipping_service ?? null,
        timeline: buildTimeline(record, shipmentStatus),
      };
    });
  }

  const trackingNumber = record.trackingNumber ?? record.label?.trackingNumber ?? order.trackingNumber ?? null;
  if (!trackingNumber && record.status === "preparing" && !orderPaid) {
    return [];
  }

  const shipmentStatus = mapRecordStatusToShipmentStatus(record.status, hasLabels, orderPaid);
  const carrier = String(record.carrier ?? record.label?.carrier ?? order.deliveryCarrier);

  return [
    {
      parcelNumber: 1,
      totalParcels: 1,
      carrier,
      trackingNumber,
      trackingUrl: recordRow?.tracking_url ?? null,
      labelId: record.label ? record.id : null,
      status: shipmentStatus,
      estimatedDelivery: formatDeliveryDate(recordRow?.estimated_delivery_at),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      weightKg: null,
      dimensions: null,
      shippingService: null,
      timeline: buildTimeline(record, shipmentStatus),
    },
  ];
}

export function mapOrderToCommerceTotals(totals: OrderTotals): CommerceTotals {
  return {
    products: totals.itemPrice,
    shipping: totals.deliveryPending ? 0 : totals.delivery,
    platformFee: totals.platformFee,
    total: totals.total,
  };
}

export function mapOrderToLineItems(order: Order): CommerceLineItem[] {
  return [
    {
      id: order.product.id,
      title: order.product.title,
      quantity: 1,
      price: order.product.price,
      imageUrl: order.product.imageUrl,
    },
  ];
}

export function mapOrderToSellerGroup(order: Order): CommerceSellerGroup {
  return {
    sellerId: order.seller.id,
    sellerName: order.seller.name,
    items: mapOrderToLineItems(order),
  };
}

export function mapOrderToMeta(order: Order): CommerceOrderMeta {
  return {
    orderNumber: order.orderNumber,
    placedAt: formatCommerceTimestamp(order.paidAt ?? order.createdAt),
    itemCount: 1,
    paymentStatus:
      order.status === "awaiting_payment"
        ? "pending"
        : order.status === "cancelled"
          ? "refunded"
          : "paid",
    invoiceHref: `/api/orders/${order.id}/receipt`,
  };
}

export function mapShipmentModel(
  order: Order,
  record: ShippingRecord | null,
  labels: ShippingLabelRow[] = [],
  recordRow: ShippingRecordRow | null = null,
): CommerceShipmentModel | null {
  if (!record) {
    const trackingNumber = order.trackingNumber ?? null;
    if (!trackingNumber) return null;

    return {
      id: `order-shipment-${order.id}`,
      orderId: order.id,
      sellerId: order.seller.id,
      status: order.status === "delivered" ? "delivered" : "in_transit",
      parcels: [
        {
          parcelNumber: 1,
          totalParcels: 1,
          carrier: String(order.deliveryCarrier),
          trackingNumber,
          trackingUrl: null,
          labelId: null,
          status: order.status === "delivered" ? "delivered" : "in_transit",
          estimatedDelivery: null,
          createdAt: order.shippedAt ?? order.paidAt ?? order.createdAt,
          updatedAt: order.deliveredAt ?? order.shippedAt ?? order.createdAt,
          weightKg: null,
          dimensions: null,
          shippingService: null,
          timeline: [],
        },
      ],
      createdAt: order.paidAt ?? order.createdAt,
      updatedAt: order.deliveredAt ?? order.shippedAt ?? order.createdAt,
    };
  }

  const parcels = mapLabelRowsToParcels(record, labels, recordRow, order);
  const hasLabels = parcels.some((parcel) => parcel.trackingNumber);
  const status = mapRecordStatusToShipmentStatus(record.status, hasLabels, Boolean(order.paidAt));

  return {
    id: record.id,
    orderId: order.id,
    sellerId: order.seller.id,
    status,
    parcels,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function mapOrderToCommerceModel(
  order: Order,
  record: ShippingRecord | null,
  labels: ShippingLabelRow[] = [],
  recordRow: ShippingRecordRow | null = null,
): CommerceOrderModel {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    sellers: [
      {
        sellerId: order.seller.id,
        sellerName: order.seller.name,
        shipment: mapShipmentModel(order, record, labels, recordRow),
      },
    ],
  };
}

export function mapParcelModelToUi(
  parcel: CommerceParcelModel,
  items: CommerceLineItem[] = [],
  parcelId = "legacy",
  operation: ParcelOperation | null = null,
): CommerceParcel {
  return {
    id: parcelId,
    index: parcel.parcelNumber,
    totalParcels: parcel.totalParcels,
    status: mapShippingStatusToParcelStatus(parcel.status),
    carrier: parcel.carrier,
    trackingNumber: parcel.trackingNumber,
    estimatedDelivery: parcel.estimatedDelivery,
    trackingUrl: parcel.trackingUrl,
    items,
    operation,
    timeline: parcel.timeline.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      occurredAt: event.occurredAt,
      current: event.current,
      done: event.done,
    })),
  };
}

export function mapShipmentParcelsToUi(
  order: Order,
  record: ShippingRecord | null,
  parcels: ShipmentParcel[],
): CommerceParcel[] {
  return parcels.map((parcel) => {
    const shipmentStatus = resolveParcelShipmentStatus(parcel, order);
    const items = mapParcelProductItems(order, parcel.productItemIds);

    return {
      id: parcel.id,
      index: parcel.parcelNumber,
      totalParcels: parcel.totalParcels,
      status: mapShippingStatusToParcelStatus(shipmentStatus),
      carrier: parcel.carrier ?? String(order.deliveryCarrier),
      trackingNumber: parcel.trackingNumber,
      estimatedDelivery: formatDeliveryDate(parcel.estimatedDeliveryAt),
      trackingUrl: parcel.trackingUrl,
      items,
      operation: parcel.operation,
      timeline: buildCanonicalShipmentTimeline({
        currentStatus: shipmentStatus,
        parcelId: parcel.id,
        fallbackOccurredAt: parcel.updatedAt ?? record?.updatedAt ?? order.paidAt ?? order.createdAt,
      }),
    };
  });
}

export function getUiParcelsFromOrder(
  order: Order,
  record: ShippingRecord | null,
  labels: ShippingLabelRow[] = [],
  recordRow: ShippingRecordRow | null = null,
): CommerceParcel[] {
  if (record?.parcels?.length) {
    return mapShipmentParcelsToUi(order, record, record.parcels);
  }

  const shipment = mapShipmentModel(order, record, labels, recordRow);
  if (!shipment) return [];
  const items = mapOrderToLineItems(order);
  return shipment.parcels.map((parcel) =>
    mapParcelModelToUi(parcel, items, `${order.id}-parcel-${parcel.parcelNumber}`),
  );
}

export function mapProductToCheckoutSellerGroup(input: {
  sellerId: string;
  sellerName: string;
  productId: string;
  title: string;
  price: number;
  imageUrl: string | null;
  quantity?: number;
}) {
  return {
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    items: [
      {
        id: input.productId,
        title: input.title,
        quantity: input.quantity ?? 1,
        price: input.price,
        imageUrl: input.imageUrl,
      },
    ],
  };
}

export function isShipmentReady(parcels: CommerceParcel[]): boolean {
  return parcels.some((parcel) => Boolean(parcel.trackingNumber));
}
