import "server-only";

import { apiFetchWithRetry, ConnectorApiError } from "@/lib/seller/migration/connectors/api/http-client";
import type { MigrationConnectorInput, MigrationRawListing } from "@/lib/seller/migration/engine/types";

const DEFAULT_EBAY_API_BASE = "https://api.ebay.com";

export function resolveEbayApiBase(settings?: Record<string, unknown>): string {
  const sandbox = settings?.sandbox === true || settings?.environment === "sandbox";
  if (sandbox) return "https://api.sandbox.ebay.com";
  return (process.env.EBAY_API_BASE_URL ?? DEFAULT_EBAY_API_BASE).replace(/\/$/, "");
}

function ebayHeaders(accessToken: string, marketplaceId = "EBAY_GB"): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "Content-Language": "en-GB",
    "Content-Type": "application/json",
    "X-EBAY-C-MARKETPLACE-ID": marketplaceId,
  };
}

export async function verifyEbayConnection(
  accessToken: string,
  settings?: Record<string, unknown>,
): Promise<{ name: string; marketplaceId: string }> {
  const base = resolveEbayApiBase(settings);
  const marketplaceId = String(settings?.marketplaceId ?? "EBAY_GB");
  const response = await apiFetchWithRetry(`${base}/commerce/identity/v1/user/`, {
    headers: ebayHeaders(accessToken, marketplaceId),
  });

  if (response.status === 401 || response.status === 403) {
    throw new ConnectorApiError("eBay authentication failed. Check your OAuth access token.", response.status);
  }
  if (!response.ok) {
    throw new ConnectorApiError(`eBay API responded with ${response.status}.`, response.status);
  }

  const payload = (await response.json()) as { username?: string; userId?: string };
  return {
    name: payload.username ?? payload.userId ?? "eBay Seller",
    marketplaceId,
  };
}

export async function getEbayInventoryCount(
  accessToken: string,
  settings?: Record<string, unknown>,
): Promise<number> {
  const base = resolveEbayApiBase(settings);
  const marketplaceId = String(settings?.marketplaceId ?? "EBAY_GB");
  const response = await apiFetchWithRetry(
    `${base}/sell/inventory/v1/inventory_item?limit=1&offset=0`,
    { headers: ebayHeaders(accessToken, marketplaceId) },
  );

  if (!response.ok) {
    throw new ConnectorApiError(`eBay inventory API responded with ${response.status}.`, response.status);
  }

  const payload = (await response.json()) as { total?: number };
  return payload.total ?? 0;
}

type EbayInventoryItem = {
  sku?: string;
  condition?: string;
  product?: {
    title?: string;
    description?: string;
    brand?: string;
    imageUrls?: string[];
    aspects?: Record<string, string[]>;
    mpn?: string;
    ean?: string[];
    isbn?: string[];
    upc?: string[];
  };
  availability?: {
    shipToLocationAvailability?: { quantity?: number };
  };
};

type EbayOffer = {
  sku?: string;
  pricingSummary?: { price?: { value?: string; currency?: string } };
  listingDescription?: string;
  categoryId?: string;
  status?: string;
};

function mapEbayCondition(condition?: string): string {
  const normalized = (condition ?? "").toUpperCase();
  if (normalized.includes("NEW")) return "new";
  if (normalized.includes("REFURB")) return "refurbished";
  if (normalized.includes("PART")) return "for_parts";
  if (normalized.includes("GOOD")) return "good";
  return "used";
}

function mapEbayInventoryItem(
  item: EbayInventoryItem,
  offer: EbayOffer | undefined,
  input: MigrationConnectorInput,
  currency: string,
): MigrationRawListing {
  const aspects = item.product?.aspects ?? {};
  const aspectFlat = Object.fromEntries(
    Object.entries(aspects).map(([key, values]) => [key.toLowerCase(), values.join(", ")]),
  );

  const price = Number.parseFloat(offer?.pricingSummary?.price?.value ?? "0") || 0;
  const mpn = item.product?.mpn;

  return {
    externalId: item.sku ?? offer?.sku ?? item.product?.title ?? "ebay-item",
    title: item.product?.title ?? item.sku ?? "eBay listing",
    description: item.product?.description ?? offer?.listingDescription ?? item.product?.title ?? "",
    brand: item.product?.brand ?? aspectFlat.brand,
    price,
    currency: offer?.pricingSummary?.price?.currency ?? currency,
    sku: item.sku,
    ean: item.product?.ean?.[0],
    upc: item.product?.upc?.[0],
    quantity: item.availability?.shipToLocationAvailability?.quantity ?? 1,
    sourceCategory: offer?.categoryId,
    condition: mapEbayCondition(item.condition),
    imageUrls: item.product?.imageUrls ?? [],
    attributes: {
      source: "ebay",
      method: input.importMethod,
      status: offer?.status ?? "active",
      ...(mpn ? { mpn } : {}),
      aspects: JSON.stringify(aspectFlat),
    },
  };
}

async function fetchEbayOffers(
  accessToken: string,
  settings: Record<string, unknown> | undefined,
  offset: number,
  limit: number,
): Promise<EbayOffer[]> {
  const base = resolveEbayApiBase(settings);
  const marketplaceId = String(settings?.marketplaceId ?? "EBAY_GB");
  const url = new URL(`${base}/sell/inventory/v1/offer`);
  url.searchParams.set("limit", String(Math.min(limit, 100)));
  url.searchParams.set("offset", String(offset));

  const response = await apiFetchWithRetry(url.toString(), {
    headers: ebayHeaders(accessToken, marketplaceId),
  });

  if (!response.ok) return [];
  const payload = (await response.json()) as { offers?: EbayOffer[] };
  return payload.offers ?? [];
}

export async function fetchEbayInventoryItems(
  input: MigrationConnectorInput,
  accessToken: string,
  settings?: Record<string, unknown>,
  currency = "GBP",
): Promise<MigrationRawListing[]> {
  const base = resolveEbayApiBase(settings);
  const marketplaceId = String(settings?.marketplaceId ?? "EBAY_GB");
  const url = new URL(`${base}/sell/inventory/v1/inventory_item`);
  url.searchParams.set("limit", String(Math.min(input.limit, 100)));
  url.searchParams.set("offset", String(input.offset));

  const response = await apiFetchWithRetry(url.toString(), {
    headers: ebayHeaders(accessToken, marketplaceId),
  });

  if (!response.ok) {
    throw new ConnectorApiError(`eBay inventory API responded with ${response.status}.`, response.status);
  }

  const payload = (await response.json()) as { inventoryItems?: EbayInventoryItem[] };
  const offers = await fetchEbayOffers(accessToken, settings, input.offset, input.limit);
  const offersBySku = new Map(offers.map((offer) => [offer.sku, offer]));

  return (payload.inventoryItems ?? []).map((item) =>
    mapEbayInventoryItem(item, offersBySku.get(item.sku ?? ""), input, currency),
  );
}
