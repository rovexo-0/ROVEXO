import { validateUkShippingAddress } from "@/lib/shipping/addresses";
import { buildDraftLabel } from "@/lib/shipping/labels/draft";
import { detectParcelTier, parcelTierLabel } from "@/lib/shipping/parcels";
import { buildTrackingTimeline } from "@/lib/shipping/tracking";
import {
  attachShippingTracking,
  ensureShippingRecord,
  getShippingRecord,
  updateShippingRecordStatus,
} from "@/lib/shipping/store";
import type {
  LegacyParcelSize,
  ParcelDetectionInput,
  ParcelTier,
  ShippingAddress,
  ShippingRecord,
  ShippingStatus,
} from "@/lib/shipping/types";
import type { UkCarrier } from "@/lib/shipping/carriers";

/** Canonical ROVEXO Shipping Engine v1.0 — single entry point for all shipping operations. */
export const ShippingService = {
  detectParcelTier,
  parcelTierLabel,
  validateAddress: validateUkShippingAddress,
  buildTrackingTimeline,

  async getRecord(orderId: string): Promise<ShippingRecord | null> {
    return getShippingRecord(orderId);
  },

  async ensureRecord(input: {
    orderId: string;
    legacyParcelSize?: LegacyParcelSize | null;
    categorySlug?: string | null;
    manualTier?: ParcelTier | null;
  }): Promise<ShippingRecord | null> {
    return ensureShippingRecord(input);
  },

  async detectAndEnsureRecord(orderId: string, input: ParcelDetectionInput): Promise<ShippingRecord | null> {
    const detection = detectParcelTier(input);
    return ensureShippingRecord({
      orderId,
      legacyParcelSize: input.legacyParcelSize ?? null,
      categorySlug: input.categorySlug ?? null,
      manualTier: detection.source === "manual" ? detection.appliedTier : input.manualTier ?? null,
    });
  },

  buildDraftLabel,

  async addTracking(input: {
    orderId: string;
    carrier: UkCarrier;
    trackingNumber: string;
    dispatchDays?: number;
  }) {
    return attachShippingTracking(input);
  },

  async updateStatus(input: {
    orderId: string;
    status: ShippingStatus;
    title?: string;
    description?: string;
  }) {
    return updateShippingRecordStatus(input);
  },
} as const;

export type { ShippingRecord, ShippingStatus, ParcelTier, ShippingAddress };
