/**
 * Sendcloud V3 catalog / discovery types (canonical SSOT).
 * Quote identity (sendcloud:<methodId>) is separate from V3 label identity.
 */

import type { ParcelTier } from "@/lib/shipping/types";

export const SENDCLOUD_V3_COMPAT_PATH = "/compat/shipping-options" as const;
export const SENDCLOUD_V3_SHIPPING_OPTIONS_PATH = "/shipping-options" as const;
export const SENDCLOUD_V3_SHIPMENTS_ANNOUNCE_PATH = "/shipments/announce" as const;

/** Official TTL window: 5–15 minutes. Canonical owner uses 10 minutes. */
export const SENDCLOUD_V3_CATALOG_CACHE_TTL_MS = 10 * 60 * 1000;

export type SendcloudV3CatalogParcelRequest = {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

export type SendcloudV3ShippingOptionsRequest = {
  fromCountryCode: string;
  toCountryCode: string;
  fromPostalCode: string;
  toPostalCode: string;
  parcelTier: ParcelTier;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  carrierCode?: string;
  calculateQuotes?: boolean;
};

export type SendcloudV3CompatMappingsRequest = {
  shippingMethodIds: number[];
};

/**
 * Confirmed V3 mapping for one V2 method id.
 * shippingOptionCode is null when Sendcloud returns null / missing (NO_V3_COUNTERPART).
 */
export type SendcloudV3MethodMapping = {
  v2MethodId: number;
  shippingOptionCode: string | null;
  contractId: string | null;
  result: "MAPPING_CONFIRMED" | "NO_V3_COUNTERPART";
};

/** Route-aware identity from POST /shipping-options (never invents codes). */
export type SendcloudV3RouteAwareOptionIdentity = {
  shippingOptionCode: string;
  contractId: string | null;
};

/**
 * Compat identity is NOT announce-ready until route-aware availability confirms it.
 * Never silently substitute another carrier/service from availableOptions.
 */
export type SendcloudV3RouteAwareSelectionStatus =
  | "ROUTE_AWARE_SELECTED"
  | "COMPAT_IDENTITY_FOUND_BUT_ROUTE_UNAVAILABLE"
  | "NO_V3_COUNTERPART"
  | "ROUTE_CATALOG_UNAVAILABLE";

export type SendcloudV3RouteAwareSelection = {
  v2MethodId: number;
  /** Compat mapping only — may differ from selected when unavailable for route/parcel. */
  compatShippingOptionCode: string | null;
  shippingOptionCode: string | null;
  contractId: string | null;
  status: SendcloudV3RouteAwareSelectionStatus;
};

export type SendcloudV3AnnounceAddress = {
  name: string;
  company_name?: string;
  address_line_1: string;
  house_number: string;
  address_line_2?: string;
  postal_code: string;
  city: string;
  country_code: string;
  phone_number?: string;
  email?: string;
};

export type SendcloudV3AnnounceShipmentRequest = {
  from_address: SendcloudV3AnnounceAddress;
  to_address: SendcloudV3AnnounceAddress;
  ship_with: {
    type: "shipping_option_code";
    properties: {
      shipping_option_code: string;
      contract_id?: number | string;
    };
  };
  parcels: Array<{
    dimensions: {
      length: string;
      width: string;
      height: string;
      unit: "cm";
    };
    weight: { value: string; unit: "kg" };
  }>;
  order_number?: string;
  external_reference_id?: string;
  reference?: string;
  total_order_price?: { currency: string; value: string };
  label_details?: { mime_type: string; dpi?: number };
};

export type SendcloudV3AnnounceShipmentResult = {
  shipmentId: string | null;
  parcelId: number | null;
  trackingNumber: string | null;
  pdfUrl: string | null;
  carrierCode: string | null;
  serviceName: string | null;
  reusedExisting: boolean;
};
