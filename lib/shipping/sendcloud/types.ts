import type { ShippingStatus } from "@/lib/shipping/types";

export type SendcloudHealthResult = {
  configured: boolean;
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs: number;
  message?: string;
  baseUrl?: string;
};

export type SendcloudShippingMethod = {
  id: number;
  name: string;
  carrier: string;
  min_weight: string;
  max_weight: string;
  service_point_input: "required" | "none";
  countries: Array<{
    id: number;
    name: string;
    price: number;
    iso_2: string;
    iso_3: string;
    lead_time_hours: number | null;
  }>;
};

export type SendcloudParcelResponse = {
  id: number;
  tracking_number?: string | null;
  label?: {
    normal_printer?: string[];
    label_printer?: string;
  };
  documents?: Array<{ type: string; link: string }>;
  status?: { id: number; message: string };
  carrier?: { code?: string };
  shipment?: { id: number; name?: string };
};

export type SendcloudTrackingEvent = {
  status?: string;
  message?: string;
  timestamp?: string;
};

export type SendcloudTrackingResult = {
  /**
   * Mapped ROVEXO lifecycle status, or `null` when the carrier message is
   * unrecognized (fail closed — do not advance shipment/order state).
   */
  status: ShippingStatus | null;
  events: Array<{
    status: string;
    statusDetails: string | null;
    location: string | null;
    occurredAt: string;
  }>;
};

export type SendcloudLabelResult = {
  parcelId: number;
  trackingNumber: string | null;
  pdfUrl: string | null;
  carrier: string | null;
  serviceName: string | null;
  /** V3 shipment id when created via /shipments/announce (string UUID or opaque id). */
  shipmentId?: string | null;
  /** True when HTTP 409 / existing provider id was reused. */
  reusedExisting?: boolean;
};

/** Confirmed V3 label identity — never conflated with sendcloud:<v2MethodId>. */
export type SendcloudV3QuoteMetadata = {
  shippingOptionCode?: string;
  contractId?: string;
  v2MethodId?: number;
};

export type SendcloudWebhookPayload = {
  action?: string;
  parcel?: SendcloudParcelResponse;
  /** Official: unix epoch milliseconds (number). Numeric strings accepted at parse time. */
  timestamp?: number | string;
};
