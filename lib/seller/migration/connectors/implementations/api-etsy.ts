import { BaseUniversalConnector, hasLiveApiCredentials } from "@/lib/seller/migration/connectors/base-connector";
import { ConnectorApiError } from "@/lib/seller/migration/connectors/api/http-client";
import {
  fetchEtsyListings,
  getEtsyListingCount,
  resolveEtsyApiKey,
  resolveEtsyShopId,
  verifyEtsyConnection,
} from "@/lib/seller/migration/connectors/api/etsy-client";
import { getConnectorRecord } from "@/lib/seller/migration/connectors/credentials";
import { loadConnectorCredentialsWithRefresh } from "@/lib/seller/marketplace/oauth/token-manager";
import type { ConnectorConnectInput, ConnectorDefinition } from "@/lib/seller/migration/connectors/types";
import type { MigrationConnectorInput } from "@/lib/seller/migration/engine/types";

const etsyMetaCache = new Map<string, { shopId: number; currency: string }>();

async function resolveEtsyMeta(
  sellerId: string,
  apiKey: string,
  accessToken: string,
  storeUrl?: string,
  settings?: Record<string, unknown>,
): Promise<{ shopId: number; currency: string }> {
  const cacheKey = `${sellerId}:etsy`;
  const cached = etsyMetaCache.get(cacheKey);
  if (cached) return cached;

  let shopId = resolveEtsyShopId(storeUrl, settings);
  const verified = await verifyEtsyConnection(apiKey, accessToken);
  if (!shopId) shopId = verified.shopId;

  const meta = { shopId, currency: verified.currency };
  etsyMetaCache.set(cacheKey, meta);
  return meta;
}

export function createEtsyConnector(definition: ConnectorDefinition): BaseUniversalConnector {
  return new BaseUniversalConnector(definition, {
    validateConfiguration: async (input) => {
      const errors = [];
      const keystring = input.apiKey?.trim() || process.env.ETSY_API_KEYSTRING?.trim();
      if (!keystring) {
        errors.push({ field: "apiKey", message: "Etsy API key (keystring) is required." });
      }
      if (!input.accessToken?.trim()) {
        errors.push({ field: "accessToken", message: "Etsy OAuth access token is required." });
      }
      if (errors.length === 0 && keystring && input.accessToken) {
        try {
          const verified = await verifyEtsyConnection(keystring, input.accessToken);
          const shopId = resolveEtsyShopId(input.storeUrl, input.settings) ?? verified.shopId;
          if (!shopId) {
            errors.push({ field: "storeUrl", message: "Etsy shop id could not be resolved." });
          }
        } catch (error) {
          errors.push({
            field: "accessToken",
            message: error instanceof Error ? error.message : "Unable to verify Etsy connection.",
          });
        }
      }
      return { valid: errors.length === 0, errors };
    },
    connect: async (input: ConnectorConnectInput) => {
      const keystring = resolveEtsyApiKey(input.apiKey);
      if (!input.accessToken?.trim()) {
        throw new Error("Etsy OAuth access token is required.");
      }
      const verified = await verifyEtsyConnection(keystring, input.accessToken);
      const shopId = resolveEtsyShopId(input.storeUrl, input.settings) ?? verified.shopId;
      input.settings = {
        ...(input.settings ?? {}),
        shopId,
        currency: verified.currency,
      };
      if (!input.storeUrl?.trim()) {
        input.storeUrl = String(shopId);
      }
      etsyMetaCache.set(`${input.sellerId}:etsy`, {
        shopId,
        currency: verified.currency,
      });
    },
    estimateTotal: async (input) => {
      if (!(await hasLiveApiCredentials(input.sellerId, input.platform))) return 0;
      const credentials = await loadConnectorCredentialsWithRefresh(input.sellerId, input.platform);
      const apiKey = resolveEtsyApiKey(credentials?.apiKey);
      if (!credentials?.accessToken) return 0;
      const record = await getConnectorRecord(input.sellerId, input.platform);
      const meta = await resolveEtsyMeta(
        input.sellerId,
        apiKey,
        credentials.accessToken,
        credentials.storeUrl,
        record?.settings,
      );
      return getEtsyListingCount(apiKey, credentials.accessToken, meta.shopId);
    },
    fetchListings: async (input: MigrationConnectorInput) => {
      const credentials = await loadConnectorCredentialsWithRefresh(input.sellerId, input.platform);
      const apiKey = resolveEtsyApiKey(credentials?.apiKey);
      if (!credentials?.accessToken) {
        throw new ConnectorApiError("Etsy connector is not connected.", 401);
      }
      const record = await getConnectorRecord(input.sellerId, input.platform);
      const meta = await resolveEtsyMeta(
        input.sellerId,
        apiKey,
        credentials.accessToken,
        credentials.storeUrl,
        record?.settings,
      );
      return fetchEtsyListings(
        input,
        apiKey,
        credentials.accessToken,
        meta.shopId,
        meta.currency,
      );
    },
  });
}
