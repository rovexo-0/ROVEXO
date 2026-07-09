import "server-only";

import { randomUUID } from "node:crypto";

import type { Parcel2GoClient } from "@/src/services/shipping/parcel2go/client";
import {
  customerDetailsFromAddress,
  mapAddressToParcel2Go,
  mapParcel2GoCreateOrderToShipment,
  mapParcel2GoPayOrderToShipment,
} from "@/src/services/shipping/parcel2go/mapper";
import { parseParcel2GoQuoteId } from "@/src/services/shipping/parcel2go/quote-id";
import type {
  Parcel2GoApiCreateOrderRequest,
  Parcel2GoApiCreateOrderResponse,
  Parcel2GoApiPayOrderResponse,
} from "@/src/services/shipping/parcel2go/types";
import { PARCEL2GO_API_PATHS } from "@/src/services/shipping/parcel2go/types";
import { ShipmentError } from "@/src/services/shipping/errors";
import type { CreateOrderRequest, PayOrderRequest, Shipment } from "@/src/services/shipping/types";

/** Parcel2Go order API expects YYYY-MM-DD. Never use Date parsing — it shifts local timestamps. */
function normalizeParcel2GoCollectionDate(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const datePrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (datePrefix) return datePrefix[1]!;
  return trimmed.slice(0, 10);
}

export async function createParcel2GoOrder(
  client: Parcel2GoClient,
  request: CreateOrderRequest,
): Promise<Shipment> {
  const quote = parseParcel2GoQuoteId(request.quoteId);
  if (!quote) {
    throw new ShipmentError("Invalid Parcel2Go quote id");
  }

  const itemId = randomUUID();
  const parcelId = randomUUID();
  const collectionDate = normalizeParcel2GoCollectionDate(
    quote.collectionDate ?? new Date().toISOString(),
  );

  const payload: Parcel2GoApiCreateOrderRequest = {
    Items: [
      {
        Id: itemId,
        CollectionDate: collectionDate,
        Service: quote.serviceSlug,
        Reference: request.reference,
        CollectionAddress: mapAddressToParcel2Go(request.collectionAddress),
        Parcels: request.parcels.map((parcel) => {
          const declaredValue = request.insuranceValueGbp ?? parcel.valueGbp ?? 0;
          return {
            Id: parcelId,
            Value: declaredValue,
            EstimatedValue: declaredValue,
            Weight: parcel.weightKg,
            Length: parcel.lengthCm,
            Width: parcel.widthCm,
            Height: parcel.heightCm,
            ContentsSummary: request.reference,
            DeliveryAddress: mapAddressToParcel2Go(request.deliveryAddress),
          };
        }),
      },
    ],
    CustomerDetails: customerDetailsFromAddress({
      ...request.deliveryAddress,
      email: request.customerEmail ?? request.deliveryAddress.email,
    }),
  };

  try {
    const response = await client.post<Parcel2GoApiCreateOrderResponse>(
      PARCEL2GO_API_PATHS.orders,
      payload,
      request.idempotencyKey
        ? { headers: { "Idempotency-Key": request.idempotencyKey } }
        : undefined,
    );

    if (!response.OrderId) {
      throw new ShipmentError("Parcel2Go order response missing OrderId");
    }

    return mapParcel2GoCreateOrderToShipment(response, request.reference);
  } catch (error) {
    if (error instanceof ShipmentError) throw error;
    const message = error instanceof Error ? error.message : "Parcel2Go order creation failed";
    throw new ShipmentError(message, { cause: error });
  }
}

export async function payParcel2GoOrder(
  client: Parcel2GoClient,
  request: PayOrderRequest,
  existingShipment?: Shipment,
): Promise<Shipment> {
  if (request.paymentMethod !== "prepay") {
    throw new ShipmentError(`Parcel2Go payment method '${request.paymentMethod}' is not supported yet`);
  }

  try {
    const response = await client.post<Parcel2GoApiPayOrderResponse>(
      PARCEL2GO_API_PATHS.payWithPrepay(
        request.shipmentId,
        request.paymentHash ?? existingShipment?.paymentHash ?? undefined,
      ),
      undefined,
      { retryable: false },
    );

    const baseShipment =
      existingShipment ??
      ({
        id: request.shipmentId,
        provider: "parcel2go",
        providerOrderId: request.shipmentId,
        status: "pending_payment",
        trackingNumber: null,
        carrier: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } satisfies Shipment);

    return mapParcel2GoPayOrderToShipment(baseShipment, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Parcel2Go payment failed";
    throw new ShipmentError(message, { cause: error });
  }
}

export async function cancelParcel2GoShipment(
  client: Parcel2GoClient,
  shipmentId: string,
  reason?: string,
): Promise<void> {
  void client;
  void shipmentId;
  void reason;
  throw new ShipmentError(
    "Parcel2Go cancellation is not exposed on the public API. Contact Parcel2Go support to cancel paid shipments.",
  );
}
