/**
 * Canonical Sendcloud V3 catalog / discovery (ONE implementation).
 * Generic for checkout quotes — no Super Admin / order-id coupling.
 */

import "server-only";

import { parcelSpecFromTier } from "@/lib/shipping/pricing/sendcloud-mappers";
import {
  buildSendcloudV3CatalogCacheKey,
  buildSendcloudV3CompatCacheKey,
  withSendcloudV3CatalogCache,
} from "@/lib/shipping/sendcloud/v3-catalog-cache-v1";
import {
  isConfirmedSendcloudV3ShippingOptionCode,
  parseSendcloudV3CompatMappings,
  extractSendcloudV3RouteAwareOptionIdentities,
  selectRouteAwareV3OptionForCompatMapping,
  applyRouteAwareSelectionsToQuoteMetadata,
} from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import {
  SENDCLOUD_V3_COMPAT_PATH,
  SENDCLOUD_V3_SHIPPING_OPTIONS_PATH,
  type SendcloudV3MethodMapping,
  type SendcloudV3RouteAwareOptionIdentity,
  type SendcloudV3RouteAwareSelection,
  type SendcloudV3ShippingOptionsRequest,
} from "@/lib/shipping/sendcloud/v3-catalog-types-v1";
import type { SendcloudV3QuoteMetadata } from "@/lib/shipping/sendcloud/types";
import type { ParcelTier } from "@/lib/shipping/types";

/** Lazy import avoids client ↔ catalog circular dependency. */
async function v3Request<T>(
  path: string,
  init: { method: string; body: string },
): Promise<T> {
  const { sendcloudV3Request } = await import("@/lib/shipping/sendcloud/client");
  return sendcloudV3Request<T>(path, init);
}

import { normalizeSendcloudPostalCode } from "@/lib/shipping/pricing/sendcloud-mappers";

function normalizePostal(postcode: string): string {
  return normalizeSendcloudPostalCode(postcode);
}

/** Build official V3 shipping-options request body (read-only discovery). */
export function buildSendcloudV3ShippingOptionsRequestBody(
  input: SendcloudV3ShippingOptionsRequest,
): Record<string, unknown> {
  const spec = parcelSpecFromTier(input.parcelTier, input.weightKg);
  const lengthCm = input.lengthCm ?? spec.lengthCm;
  const widthCm = input.widthCm ?? spec.widthCm;
  const heightCm = input.heightCm ?? spec.heightCm;
  const weightKg = input.weightKg ?? spec.weightKg;

  return {
    from_country_code: input.fromCountryCode.toUpperCase(),
    to_country_code: input.toCountryCode.toUpperCase(),
    from_postal_code: normalizePostal(input.fromPostalCode),
    to_postal_code: normalizePostal(input.toPostalCode),
    ...(input.carrierCode ? { carrier_code: input.carrierCode } : {}),
    calculate_quotes: input.calculateQuotes ?? true,
    parcels: [
      {
        weight: { value: String(weightKg), unit: "kg" },
        dimensions: {
          length: String(lengthCm),
          width: String(widthCm),
          height: String(heightCm),
          unit: "cm",
        },
      },
    ],
  };
}

/**
 * POST /shipping-options — cached catalog fetch.
 * Does not invent shipping_option_code. Callers parse/match explicitly.
 */
export async function fetchSendcloudV3ShippingOptionsCatalog(
  input: SendcloudV3ShippingOptionsRequest,
): Promise<unknown> {
  const spec = parcelSpecFromTier(input.parcelTier, input.weightKg);
  const key = buildSendcloudV3CatalogCacheKey({
    fromCountry: input.fromCountryCode,
    toCountry: input.toCountryCode,
    fromPostal: input.fromPostalCode,
    toPostal: input.toPostalCode,
    parcelTier: input.parcelTier,
    weightKg: input.weightKg ?? spec.weightKg,
    lengthCm: input.lengthCm ?? spec.lengthCm,
    widthCm: input.widthCm ?? spec.widthCm,
    heightCm: input.heightCm ?? spec.heightCm,
    carrierCode: input.carrierCode,
  });

  return withSendcloudV3CatalogCache(key, async () => {
    const body = buildSendcloudV3ShippingOptionsRequestBody(input);
    return v3Request<unknown>(SENDCLOUD_V3_SHIPPING_OPTIONS_PATH, {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
}

/**
 * POST /compat/shipping-options — translate V2 method ids → V3 codes.
 * Returns null codes when Sendcloud has no counterpart (never guesses).
 */
export async function fetchSendcloudV3CompatMappingsForMethodIds(
  shippingMethodIds: number[],
): Promise<Map<number, SendcloudV3MethodMapping>> {
  const ids = [
    ...new Set(
      shippingMethodIds.filter((id) => Number.isFinite(id) && id > 0).map((id) => Math.trunc(id)),
    ),
  ];
  if (ids.length === 0) return new Map();

  const key = buildSendcloudV3CompatCacheKey(ids);
  return withSendcloudV3CatalogCache(key, async () => {
    const raw = await v3Request<unknown>(SENDCLOUD_V3_COMPAT_PATH, {
      method: "POST",
      body: JSON.stringify({ shipping_method_ids: ids }),
    });
    return parseSendcloudV3CompatMappings(raw, ids);
  });
}

/**
 * Enrich V2 methods with confirmed V3 metadata only.
 * Never derives shippingOptionCode from method.id.
 * Never selects closest/partial Royal Mail substitutes.
 * Compat identity alone is NOT route-aware — callers MUST gate via
 * gateSendcloudV3MetadataByRouteAvailability before attaching codes for quotes.
 */
export async function resolveSendcloudV3MetadataForMethods(
  methodIds: number[],
): Promise<Map<number, SendcloudV3QuoteMetadata>> {
  const mappings = await fetchSendcloudV3CompatMappingsForMethodIds(methodIds);
  const out = new Map<number, SendcloudV3QuoteMetadata>();

  for (const methodId of methodIds) {
    const mapping = mappings.get(methodId);
    const code = mapping?.shippingOptionCode ?? null;
    const meta: SendcloudV3QuoteMetadata = { v2MethodId: methodId };
    if (isConfirmedSendcloudV3ShippingOptionCode(code, methodId)) {
      meta.shippingOptionCode = code;
      if (mapping?.contractId) {
        meta.contractId = mapping.contractId;
      }
    }
    out.set(methodId, meta);
  }

  return out;
}

/**
 * P7.4 — Gate compat V3 codes against POST /shipping-options for this from/to/parcel.
 * Exact match only. Never substitutes another carrier/service.
 * On catalog failure: strip all V3 codes (fail closed — no blind announce-ready identity).
 */
export async function gateSendcloudV3MetadataByRouteAvailability(
  metadata: Map<number, SendcloudV3QuoteMetadata>,
  route: SendcloudV3ShippingOptionsRequest,
): Promise<{
  metadata: Map<number, SendcloudV3QuoteMetadata>;
  selections: Map<number, SendcloudV3RouteAwareSelection>;
}> {
  const selections = new Map<number, SendcloudV3RouteAwareSelection>();

  let available: SendcloudV3RouteAwareOptionIdentity[] = [];
  let catalogUnavailable = false;
  try {
    const raw = await fetchSendcloudV3ShippingOptionsCatalog({
      ...route,
      calculateQuotes: route.calculateQuotes ?? true,
    });
    available = extractSendcloudV3RouteAwareOptionIdentities(raw);
  } catch (error) {
    catalogUnavailable = true;
    available = [];
    console.warn("[shipping/sendcloud] V3 route-aware catalog gate failed; stripping V3 codes", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  for (const [methodId, meta] of metadata) {
    const selection = selectRouteAwareV3OptionForCompatMapping({
      v2MethodId: methodId,
      compatShippingOptionCode: meta.shippingOptionCode ?? null,
      availableOptions: available,
      catalogUnavailable,
    });
    selections.set(methodId, selection);
  }

  return {
    metadata: applyRouteAwareSelectionsToQuoteMetadata(metadata, selections),
    selections,
  };
}

/**
 * Recover confirmed V3 metadata for one selected V2 method.
 * Uses the same compat + route-aware exact-match path as live quotes.
 * Never invents codes. Never substitutes another method/carrier.
 */
export async function discoverConfirmedV3MetadataForV2Method(input: {
  v2MethodId: number;
  route: SendcloudV3ShippingOptionsRequest;
}): Promise<SendcloudV3QuoteMetadata | null> {
  const methodId = Math.trunc(input.v2MethodId);
  if (!Number.isFinite(methodId) || methodId <= 0) return null;

  const compatMeta = await resolveSendcloudV3MetadataForMethods([methodId]);
  const gated = await gateSendcloudV3MetadataByRouteAvailability(compatMeta, input.route);
  const meta = gated.metadata.get(methodId);
  if (!isConfirmedSendcloudV3ShippingOptionCode(meta?.shippingOptionCode, methodId)) {
    return null;
  }
  return meta ?? null;
}

/** Convenience for resolveLiveDeliveryPrice / quote paths sharing catalog cache. */
export async function prefetchSendcloudV3CatalogForQuoteRoute(input: {
  fromCountryCode: string;
  toCountryCode: string;
  fromPostalCode: string;
  toPostalCode: string;
  parcelTier: ParcelTier;
  weightKg?: number;
  carrierCode?: string;
}): Promise<void> {
  try {
    await fetchSendcloudV3ShippingOptionsCatalog({
      ...input,
      calculateQuotes: false,
    });
  } catch {
    // Catalog prefetch is best-effort; V2 pricing remains authoritative.
  }
}
