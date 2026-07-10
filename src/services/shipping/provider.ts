import type {
  CancelShipmentRequest,
  CreateOrderRequest,
  GetLabelsRequest,
  GetQuotesRequest,
  GetTrackingRequest,
  Label,
  PayOrderRequest,
  Shipment,
  ShippingHealthResult,
  ShippingProviderId,
  ShippingQuote,
  TrackingStatus,
} from "@/src/services/shipping/types";

/** Pluggable shipping provider contract for Sendcloud and future carriers. */
export interface ShippingProvider {
  readonly id: ShippingProviderId;
  readonly name: string;
  readonly version: string;

  isConfigured(): boolean;
  authenticate(): Promise<void>;
  getQuotes(request: GetQuotesRequest): Promise<ShippingQuote[]>;
  createOrder(request: CreateOrderRequest): Promise<Shipment>;
  payOrder(request: PayOrderRequest): Promise<Shipment>;
  getLabels(request: GetLabelsRequest): Promise<Label[]>;
  getTracking(request: GetTrackingRequest): Promise<TrackingStatus>;
  cancelShipment(request: CancelShipmentRequest): Promise<void>;
  healthCheck(): Promise<ShippingHealthResult>;
}
