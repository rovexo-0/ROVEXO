import "server-only";

import { isShippoConfigured } from "@/lib/shipping/env";
import {
  createShippoAddress,
  createShippoParcel,
  createShippoShipment,
  checkShippoApiHealth,
  getShippoTrack,
  purchaseShippoLabel,
  registerShippoTrack,
} from "@/lib/shipping/pricing/shippo-client";
import {
  mapShippoRateToQuote,
  parcelSpecFromTier,
  toShippoAddress,
} from "@/lib/shipping/pricing/shippo-mappers";
import { ShippoError, toShippoError } from "@/lib/shipping/shippo/errors";
import { mapShippoTrackingStatus } from "@/lib/shipping/shippo/status-mapper";
import type {
  ShippoAddressValidationResult,
  ShippoHealthResult,
  ShippoLabelResult,
  ShippoParcelResult,
  ShippoShipmentResult,
  ShippoTrackingResult,
} from "@/lib/shipping/shippo/types";
import type { ShippingAddress, ShippingQuote, ParcelTier } from "@/lib/shipping/types";

function assertConfigured(): void {
  if (!isShippoConfigured()) {
    throw new ShippoError(
      "not_configured",
      "SHIPPO_API_KEY is not configured. Set it in .env.local or Vercel environment variables.",
    );
  }
}

/** Production Shippo carrier service — server-side only. */
export const ShippoService = {
  isConfigured(): boolean {
    return isShippoConfigured();
  },

  async checkHealth(): Promise<ShippoHealthResult> {
    if (!isShippoConfigured()) {
      return {
        configured: false,
        status: "degraded",
        latencyMs: 0,
        message: "SHIPPO_API_KEY is not configured",
      };
    }

    try {
      return await checkShippoApiHealth();
    } catch (error) {
      const shippoError = toShippoError(error);
      return {
        configured: true,
        status: "unhealthy",
        latencyMs: 0,
        message: shippoError.message,
      };
    }
  },

  async validateAddress(address: ShippingAddress): Promise<ShippoAddressValidationResult> {
    assertConfigured();

    try {
      const payload = toShippoAddress(address);
      const created = await createShippoAddress(payload);
      const messages =
        created.validation_results?.messages
          ?.map((item) => item.text)
          .filter((text): text is string => Boolean(text)) ?? [];
      const valid = created.validation_results?.is_valid ?? true;

      return {
        valid,
        normalized: {
          ...address,
          validated: valid,
          postcode: created.zip ?? address.postcode,
          city: created.city ?? address.city,
          line1: created.street1 ?? address.line1,
          line2: created.street2 ?? address.line2,
        },
        messages,
        shippoAddressId: created.object_id,
      };
    } catch (error) {
      throw toShippoError(error, "invalid_address");
    }
  },

  async createParcel(tier: ParcelTier, weightKg?: number): Promise<ShippoParcelResult> {
    assertConfigured();

    try {
      const parcel = parcelSpecFromTier(tier, weightKg);
      const created = await createShippoParcel(parcel);
      return { objectId: created.object_id, parcel };
    } catch (error) {
      throw toShippoError(error);
    }
  },

  async createShipment(input: {
    parcelTier: ParcelTier;
    weightKg?: number;
    collectionAddress: ShippingAddress;
    deliveryAddress: ShippingAddress;
  }): Promise<ShippoShipmentResult> {
    assertConfigured();

    try {
      const shipment = await createShippoShipment({
        addressFrom: toShippoAddress(input.collectionAddress),
        addressTo: toShippoAddress(input.deliveryAddress),
        parcel: parcelSpecFromTier(input.parcelTier, input.weightKg),
      });

      return {
        objectId: shipment.object_id,
        shipment,
        rates: shipment.rates ?? [],
      };
    } catch (error) {
      throw toShippoError(error);
    }
  },

  async getQuotes(input: {
    parcelTier: ParcelTier;
    weightKg?: number;
    collectionAddress: ShippingAddress;
    deliveryAddress: ShippingAddress;
  }): Promise<{ available: boolean; quotes: ShippingQuote[]; shipmentId: string | null }> {
    const result = await this.createShipment(input);
    const quotes = result.rates
      .map(mapShippoRateToQuote)
      .filter((quote): quote is ShippingQuote => quote != null);

    return {
      available: quotes.length > 0,
      quotes,
      shipmentId: result.objectId,
    };
  },

  async generateLabel(rateObjectId: string): Promise<ShippoLabelResult> {
    assertConfigured();

    try {
      const transaction = await purchaseShippoLabel(rateObjectId);
      if (transaction.status !== "SUCCESS") {
        throw new ShippoError(
          "label_failed",
          transaction.messages?.[0]?.text ?? `Label purchase failed (${transaction.status})`,
          { details: transaction },
        );
      }

      return {
        transaction,
        trackingNumber: transaction.tracking_number?.trim() || null,
        pdfUrl: transaction.label_url ?? null,
        carrier: transaction.tracking_url_provider ?? null,
      };
    } catch (error) {
      throw toShippoError(error, "label_failed");
    }
  },

  async getTracking(carrier: string, trackingNumber: string): Promise<ShippoTrackingResult> {
    assertConfigured();

    try {
      const track = await registerShippoTrack({ carrier, trackingNumber });
      return mapTrackResult(track);
    } catch (error) {
      throw toShippoError(error, "tracking_not_found");
    }
  },

  async refreshTracking(trackObjectId: string): Promise<ShippoTrackingResult> {
    assertConfigured();

    try {
      const track = await getShippoTrack(trackObjectId);
      return mapTrackResult(track);
    } catch (error) {
      throw toShippoError(error, "tracking_not_found");
    }
  },
};

function mapTrackResult(track: Awaited<ReturnType<typeof getShippoTrack>>): ShippoTrackingResult {
  const events = (track.tracking_history ?? []).map((item) => ({
    status: item.status ?? "UNKNOWN",
    statusDetails: item.status_details ?? null,
    location: item.location ?? null,
    occurredAt: item.status_date ?? new Date().toISOString(),
  }));

  return {
    track,
    status: mapShippoTrackingStatus(track.tracking_status?.status),
    events,
  };
}
