import type { ShippingAddress, ShippingStatus } from "@/lib/shipping/types";
import type {
  ShippoAddressPayload,
  ShippoParcelPayload,
  ShippoRate,
  ShippoShipment,
  ShippoTrack,
  ShippoTransaction,
} from "@/lib/shipping/pricing/shippo-client";

export type ShippoHealthResult = {
  configured: boolean;
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs: number;
  message: string;
};

export type ShippoAddressValidationResult = {
  valid: boolean;
  normalized: ShippingAddress;
  messages: string[];
  shippoAddressId?: string;
};

export type ShippoParcelResult = {
  objectId: string;
  parcel: ShippoParcelPayload;
};

export type ShippoShipmentResult = {
  objectId: string;
  shipment: ShippoShipment;
  rates: ShippoRate[];
};

export type ShippoLabelResult = {
  transaction: ShippoTransaction;
  trackingNumber: string | null;
  pdfUrl: string | null;
  carrier: string | null;
};

export type ShippoTrackingResult = {
  track: ShippoTrack;
  status: ShippingStatus;
  events: Array<{
    status: string;
    statusDetails: string | null;
    location: string | null;
    occurredAt: string;
  }>;
};

export type ShippoWebhookEvent = {
  event: string;
  test?: boolean;
  data?: Record<string, unknown>;
};

export type ShippoAddressCreateInput = ShippoAddressPayload;
