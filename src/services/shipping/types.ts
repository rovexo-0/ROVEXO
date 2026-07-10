/** ROVEXO internal shipping DTOs — never expose provider JSON to callers. */

export type ShippingAddress = {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
  phone?: string;
  email?: string;
};

export type ParcelDimensions = {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  valueGbp?: number;
};

export type ShippingRate = {
  id: string;
  providerRateId: string;
  carrier: string;
  serviceName: string;
  serviceCode?: string;
  amount: number;
  currency: string;
  vatAmount?: number | null;
  priceExVat?: number | null;
  estimatedDays: number | null;
  estimatedDeliveryAt?: string | null;
  expiresAt: string | null;
};

export type ShippingQuote = {
  id: string;
  provider: string;
  rates: ShippingRate[];
  createdAt: string;
  expiresAt: string | null;
};

export type Shipment = {
  id: string;
  provider: string;
  providerOrderId: string;
  providerReference?: string | null;
  orderLineId?: string | null;
  orderLineIdHmac?: string | null;
  /** Sendcloud order reference required for some payment endpoints. */
  paymentHash?: string | null;
  status: ShipmentStatus;
  trackingNumber: string | null;
  carrier: string | null;
  shippingPrice?: number | null;
  insurancePrice?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ShipmentStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "label_ready"
  | "dispatched"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "returned"
  | "cancelled"
  | "failed";

export type Label = {
  id: string;
  shipmentId: string;
  format: "pdf" | "png" | "zpl";
  url: string | null;
  dataBase64: string | null;
  trackingNumber: string | null;
  trackingUrl?: string | null;
  carrier: string | null;
};

export type TrackingEvent = {
  id: string;
  status: string;
  description: string;
  location: string | null;
  occurredAt: string;
};

export type TrackingStatus = {
  shipmentId: string;
  trackingNumber: string;
  carrier: string | null;
  status: ShipmentStatus;
  events: TrackingEvent[];
  estimatedDeliveryAt?: string | null;
  lastUpdatedAt: string;
};

export type GetQuotesRequest = {
  collectionAddress: ShippingAddress;
  deliveryAddress: ShippingAddress;
  parcels: ParcelDimensions[];
};

export type CreateOrderRequest = {
  quoteId: string;
  rateId: string;
  reference: string;
  collectionAddress: ShippingAddress;
  deliveryAddress: ShippingAddress;
  parcels: ParcelDimensions[];
  insuranceValueGbp?: number;
  customerEmail?: string;
  /** Idempotency key so the same order cannot create two Sendcloud shipments. */
  idempotencyKey?: string;
};

export type PayOrderRequest = {
  shipmentId: string;
  paymentMethod: "prepay" | "card" | "on_account";
  paymentHash?: string;
};

export type GetLabelsRequest = {
  shipmentId: string;
  orderLineIdHmac?: string;
};

export type GetTrackingRequest = {
  shipmentId: string;
  trackingNumber?: string;
};

export type CancelShipmentRequest = {
  shipmentId: string;
  reason?: string;
};

export type ShippingHealthStatus = "healthy" | "degraded" | "unhealthy";

export type ShippingHealthCheck = {
  id: string;
  label: string;
  pass: boolean;
  message?: string;
  durationMs?: number;
};

export type SendcloudEnvironment = "production" | "sandbox" | "unknown";

export type ShippingHealthResult = {
  provider: string;
  version: string;
  configured: boolean;
  credentialsLoaded: boolean;
  status: ShippingHealthStatus;
  oauthOk: boolean;
  tokenObtained: boolean;
  tokenValid: boolean;
  tokenExpiresAt: string | null;
  apiReachable: boolean;
  environment: SendcloudEnvironment;
  authUrl: string | null;
  apiUrl: string | null;
  latencyMs: number;
  checks: ShippingHealthCheck[];
  message?: string;
};

export type ShippingProviderId = "sendcloud" | "royal-mail" | "inpost" | "dpd" | "ups";
