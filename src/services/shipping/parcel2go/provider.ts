import "server-only";

import { authenticateParcel2Go } from "@/src/services/shipping/parcel2go/auth";
import { checkParcel2GoAuthHealth } from "@/src/services/shipping/parcel2go/auth-health";
import { Parcel2GoClient, PARCEL2GO_PROVIDER_VERSION } from "@/src/services/shipping/parcel2go/client";
import { getParcel2GoLabels } from "@/src/services/shipping/parcel2go/labels";
import {
  cancelParcel2GoShipment,
  createParcel2GoOrder,
  payParcel2GoOrder,
} from "@/src/services/shipping/parcel2go/orders";
import { getParcel2GoQuotes } from "@/src/services/shipping/parcel2go/quotes";
import { getParcel2GoTracking } from "@/src/services/shipping/parcel2go/tracking";
import {
  validateCancelShipmentRequest,
  validateCreateOrderRequest,
  validateGetLabelsRequest,
  validateGetQuotesRequest,
  validateGetTrackingRequest,
  validatePayOrderRequest,
} from "@/src/services/shipping/parcel2go/validators";
import { isParcel2GoConfigured } from "@/src/services/shipping/env";
import type { ShippingProvider } from "@/src/services/shipping/provider";
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
  ShippingQuote,
  TrackingStatus,
} from "@/src/services/shipping/types";

export class Parcel2GoProvider implements ShippingProvider {
  readonly id = "parcel2go" as const;
  readonly name = "Parcel2Go";
  readonly version = PARCEL2GO_PROVIDER_VERSION;

  private createClient(correlationId?: string): Parcel2GoClient {
    return new Parcel2GoClient({ correlationId });
  }

  isConfigured(): boolean {
    return isParcel2GoConfigured();
  }

  async authenticate(): Promise<void> {
    await authenticateParcel2Go();
  }

  async getQuotes(request: GetQuotesRequest): Promise<ShippingQuote[]> {
    validateGetQuotesRequest(request);
    const client = this.createClient();
    return getParcel2GoQuotes(client, request);
  }

  async createOrder(request: CreateOrderRequest): Promise<Shipment> {
    validateCreateOrderRequest(request);
    const client = this.createClient();
    return createParcel2GoOrder(client, request);
  }

  async payOrder(request: PayOrderRequest): Promise<Shipment> {
    validatePayOrderRequest(request);
    const client = this.createClient();
    return payParcel2GoOrder(client, request);
  }

  async getLabels(request: GetLabelsRequest): Promise<Label[]> {
    validateGetLabelsRequest(request);
    const client = this.createClient();
    const shipment: Shipment = {
      id: request.shipmentId,
      provider: "parcel2go",
      providerOrderId: request.shipmentId,
      orderLineId: null,
      orderLineIdHmac: request.orderLineIdHmac ?? null,
      status: "paid",
      trackingNumber: null,
      carrier: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return getParcel2GoLabels(client, request, shipment);
  }

  async getTracking(request: GetTrackingRequest): Promise<TrackingStatus> {
    validateGetTrackingRequest(request);
    const client = this.createClient();
    return getParcel2GoTracking(client, request);
  }

  async cancelShipment(request: CancelShipmentRequest): Promise<void> {
    validateCancelShipmentRequest(request);
    const client = this.createClient();
    await cancelParcel2GoShipment(client, request.shipmentId, request.reason);
  }

  async healthCheck(): Promise<ShippingHealthResult> {
    return checkParcel2GoAuthHealth();
  }
}

export const parcel2GoProvider = new Parcel2GoProvider();
