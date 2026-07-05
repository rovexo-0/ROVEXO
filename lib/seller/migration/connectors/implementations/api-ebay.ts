import { BaseUniversalConnector, hasLiveApiCredentials } from "@/lib/seller/migration/connectors/base-connector";
import { ConnectorApiError } from "@/lib/seller/migration/connectors/api/http-client";
import {
  fetchEbayInventoryItems,
  getEbayInventoryCount,
  verifyEbayConnection,
} from "@/lib/seller/migration/connectors/api/ebay-client";
import { getConnectorRecord } from "@/lib/seller/migration/connectors/credentials";
import { loadConnectorCredentialsWithRefresh } from "@/lib/seller/marketplace/oauth/token-manager";
import type { ConnectorConnectInput, ConnectorDefinition } from "@/lib/seller/migration/connectors/types";
import type { MigrationConnectorInput } from "@/lib/seller/migration/engine/types";

const ebayMetaCache = new Map<string, { marketplaceId: string; currency: string }>();

async function resolveEbayMeta(
  sellerId: string,
  accessToken: string,
  settings?: Record<string, unknown>,
): Promise<{ marketplaceId: string; currency: string }> {
  const cacheKey = `${sellerId}:ebay`;
  const cached = ebayMetaCache.get(cacheKey);
  if (cached) return cached;

  const verified = await verifyEbayConnection(accessToken, settings);
  const meta = { marketplaceId: verified.marketplaceId, currency: "GBP" };
  ebayMetaCache.set(cacheKey, meta);
  return meta;
}

export function createEbayConnector(definition: ConnectorDefinition): BaseUniversalConnector {
  return new BaseUniversalConnector(definition, {
    validateConfiguration: async (input) => {
      const errors = [];
      if (!input.accessToken?.trim()) {
        errors.push({ field: "accessToken", message: "eBay OAuth access token is required." });
      }
      if (errors.length === 0 && input.accessToken) {
        try {
          await verifyEbayConnection(input.accessToken, input.settings);
        } catch (error) {
          errors.push({
            field: "accessToken",
            message: error instanceof Error ? error.message : "Unable to verify eBay connection.",
          });
        }
      }
      return { valid: errors.length === 0, errors };
    },
    connect: async (input: ConnectorConnectInput) => {
      if (!input.accessToken?.trim()) {
        throw new Error("eBay OAuth access token is required.");
      }
      const verified = await verifyEbayConnection(input.accessToken, input.settings);
      input.settings = {
        ...(input.settings ?? {}),
        marketplaceId: verified.marketplaceId,
      };
      ebayMetaCache.set(`${input.sellerId}:ebay`, {
        marketplaceId: verified.marketplaceId,
        currency: "GBP",
      });
    },
    estimateTotal: async (input) => {
      if (!(await hasLiveApiCredentials(input.sellerId, input.platform))) return 0;
      const credentials = await loadConnectorCredentialsWithRefresh(input.sellerId, input.platform);
      if (!credentials?.accessToken) return 0;
      const record = await getConnectorRecord(input.sellerId, input.platform);
      return getEbayInventoryCount(credentials.accessToken, record?.settings);
    },
    fetchListings: async (input: MigrationConnectorInput) => {
      const credentials = await loadConnectorCredentialsWithRefresh(input.sellerId, input.platform);
      if (!credentials?.accessToken) {
        throw new ConnectorApiError("eBay connector is not connected.", 401);
      }
      const record = await getConnectorRecord(input.sellerId, input.platform);
      const meta = await resolveEbayMeta(
        input.sellerId,
        credentials.accessToken,
        record?.settings,
      );
      return fetchEbayInventoryItems(
        input,
        credentials.accessToken,
        record?.settings,
        meta.currency,
      );
    },
  });
}
