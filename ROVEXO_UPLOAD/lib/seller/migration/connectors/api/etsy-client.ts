import "server-only";

import { apiFetchWithRetry, ConnectorApiError } from "@/lib/seller/migration/connectors/api/http-client";
import type { MigrationConnectorInput, MigrationRawListing } from "@/lib/seller/migration/engine/types";

const DEFAULT_ETSY_API_BASE = "https://openapi.etsy.com";

export function resolveEtsyApiBase(): string {
  return (process.env.ETSY_API_BASE_URL ?? DEFAULT_ETSY_API_BASE).replace(/\/$/, "");
}

export function resolveEtsyApiKey(apiKey?: string): string {
  const resolved = apiKey?.trim() || process.env.ETSY_API_KEYSTRING?.trim();
  if (!resolved) {
    throw new ConnectorApiError(
      "Etsy API key is required. Provide apiKey when connecting or set ETSY_API_KEYSTRING.",
      401,
    );
  }
  return resolved;
}

function etsyHeaders(apiKey: string, accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "x-api-key": apiKey,
    Accept: "application/json",
  };
}

export async function verifyEtsyConnection(
  apiKey: string,
  accessToken: string,
): Promise<{ userId: number; shopId: number; name: string; currency: string }> {
  const keystring = resolveEtsyApiKey(apiKey);
  const base = resolveEtsyApiBase();
  const meResponse = await apiFetchWithRetry(`${base}/v3/application/users/me`, {
    headers: etsyHeaders(keystring, accessToken),
  });

  if (meResponse.status === 401 || meResponse.status === 403) {
    throw new ConnectorApiError(
      "Etsy authentication failed. Check API key and OAuth access token.",
      meResponse.status,
    );
  }
  if (!meResponse.ok) {
    throw new ConnectorApiError(`Etsy API responded with ${meResponse.status}.`, meResponse.status);
  }

  const me = (await meResponse.json()) as { user_id?: number; login_name?: string };
  const userId = me.user_id;
  if (!userId) {
    throw new ConnectorApiError("Unable to resolve Etsy user id.", 400);
  }

  const shopsResponse = await apiFetchWithRetry(
    `${base}/v3/application/users/${userId}/shops`,
    { headers: etsyHeaders(keystring, accessToken) },
  );

  if (!shopsResponse.ok) {
    throw new ConnectorApiError(`Etsy shops API responded with ${shopsResponse.status}.`, shopsResponse.status);
  }

  const shopsPayload = (await shopsResponse.json()) as {
    results?: Array<{ shop_id?: number; shop_name?: string; currency_code?: string }>;
  };
  const shop = shopsPayload.results?.[0];
  if (!shop?.shop_id) {
    throw new ConnectorApiError("No Etsy shop found for this account.", 404);
  }

  return {
    userId,
    shopId: shop.shop_id,
    name: shop.shop_name ?? me.login_name ?? "Etsy Shop",
    currency: shop.currency_code ?? "GBP",
  };
}

export async function getEtsyListingCount(
  apiKey: string,
  accessToken: string,
  shopId: number,
): Promise<number> {
  const keystring = resolveEtsyApiKey(apiKey);
  const base = resolveEtsyApiBase();
  const response = await apiFetchWithRetry(
    `${base}/v3/application/shops/${shopId}/listings/active?limit=1&offset=0`,
    { headers: etsyHeaders(keystring, accessToken) },
  );

  if (!response.ok) {
    throw new ConnectorApiError(`Etsy listings API responded with ${response.status}.`, response.status);
  }

  const payload = (await response.json()) as { count?: number };
  return payload.count ?? 0;
}

type EtsyListing = {
  listing_id?: number;
  title?: string;
  description?: string;
  price?: { amount?: number; divisor?: number; currency_code?: string };
  quantity?: number;
  sku?: string[];
  tags?: string[];
  taxonomy_id?: number;
  state?: string;
  url?: string;
};

type EtsyListingImage = {
  url_fullxfull?: string;
  url_570xN?: string;
};

function mapEtsyListing(
  listing: EtsyListing,
  images: string[],
  input: MigrationConnectorInput,
  currency: string,
): MigrationRawListing {
  const divisor = listing.price?.divisor && listing.price.divisor > 0 ? listing.price.divisor : 100;
  const price = listing.price?.amount ? listing.price.amount / divisor : 0;

  return {
    externalId: String(listing.listing_id ?? listing.sku?.[0] ?? listing.title),
    title: listing.title ?? "Etsy listing",
    description: listing.description ?? listing.title ?? "",
    price,
    currency: listing.price?.currency_code ?? currency,
    sku: listing.sku?.[0],
    quantity: listing.quantity ?? 1,
    sourceCategory: listing.taxonomy_id ? String(listing.taxonomy_id) : listing.tags?.join(", "),
    condition: "used",
    imageUrls: images,
    attributes: {
      source: "etsy",
      method: input.importMethod,
      status: listing.state ?? "active",
      tags: listing.tags?.join(", ") ?? "",
      ...(listing.taxonomy_id != null ? { taxonomyId: listing.taxonomy_id } : {}),
      listingUrl: listing.url ?? "",
    },
  };
}

async function fetchEtsyListingImages(
  apiKey: string,
  accessToken: string,
  shopId: number,
  listingId: number,
): Promise<string[]> {
  const keystring = resolveEtsyApiKey(apiKey);
  const base = resolveEtsyApiBase();
  const response = await apiFetchWithRetry(
    `${base}/v3/application/shops/${shopId}/listings/${listingId}/images`,
    { headers: etsyHeaders(keystring, accessToken) },
  );

  if (!response.ok) return [];
  const payload = (await response.json()) as { results?: EtsyListingImage[] };
  return (payload.results ?? [])
    .map((image) => image.url_fullxfull ?? image.url_570xN)
    .filter((url): url is string => Boolean(url));
}

export async function fetchEtsyListings(
  input: MigrationConnectorInput,
  apiKey: string,
  accessToken: string,
  shopId: number,
  currency = "GBP",
): Promise<MigrationRawListing[]> {
  const keystring = resolveEtsyApiKey(apiKey);
  const base = resolveEtsyApiBase();
  const url = new URL(`${base}/v3/application/shops/${shopId}/listings/active`);
  url.searchParams.set("limit", String(Math.min(input.limit, 100)));
  url.searchParams.set("offset", String(input.offset));

  const response = await apiFetchWithRetry(url.toString(), {
    headers: etsyHeaders(keystring, accessToken),
  });

  if (!response.ok) {
    throw new ConnectorApiError(`Etsy listings API responded with ${response.status}.`, response.status);
  }

  const payload = (await response.json()) as { results?: EtsyListing[] };
  const listings = payload.results ?? [];

  return Promise.all(
    listings.map(async (listing) => {
      const images = listing.listing_id
        ? await fetchEtsyListingImages(keystring, accessToken, shopId, listing.listing_id)
        : [];
      return mapEtsyListing(listing, images, input, currency);
    }),
  );
}

export function resolveEtsyShopId(
  storeUrl: string | undefined,
  settings?: Record<string, unknown>,
): number | null {
  const fromSettings = settings?.shopId ?? settings?.etsyShopId;
  if (typeof fromSettings === "number") return fromSettings;
  if (typeof fromSettings === "string" && fromSettings.trim()) {
    const parsed = Number.parseInt(fromSettings, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (storeUrl?.trim()) {
    const parsed = Number.parseInt(storeUrl.trim(), 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}
