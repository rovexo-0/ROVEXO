import { BaseUniversalConnector, hasLiveApiCredentials } from "@/lib/seller/migration/connectors/base-connector";
import { ConnectorApiError } from "@/lib/seller/migration/connectors/api/http-client";
import {
  fetchShopifyProducts,
  getShopifyProductCount,
  verifyShopifyConnection,
} from "@/lib/seller/migration/connectors/api/shopify-client";
import { loadConnectorCredentials } from "@/lib/seller/migration/connectors/credentials";
import type { ConnectorConnectInput, ConnectorDefinition } from "@/lib/seller/migration/connectors/types";
import type { MigrationConnectorInput } from "@/lib/seller/migration/engine/types";

const shopCurrencyCache = new Map<string, string>();

async function resolveShopCurrency(
  sellerId: string,
  storeUrl: string,
  accessToken: string,
): Promise<string> {
  const cacheKey = `${sellerId}:shopify`;
  const cached = shopCurrencyCache.get(cacheKey);
  if (cached) return cached;

  const shop = await verifyShopifyConnection(storeUrl, accessToken);
  shopCurrencyCache.set(cacheKey, shop.currency);
  return shop.currency;
}

export function createShopifyConnector(definition: ConnectorDefinition): BaseUniversalConnector {
  return new BaseUniversalConnector(definition, {
    validateConfiguration: async (input) => {
      const errors = [];
      if (!input.storeUrl?.trim()) {
        errors.push({ field: "storeUrl", message: "Shopify store URL is required." });
      }
      if (!input.accessToken?.trim()) {
        errors.push({ field: "accessToken", message: "Shopify Admin API access token is required." });
      }
      if (errors.length === 0 && input.storeUrl && input.accessToken) {
        try {
          const shop = await verifyShopifyConnection(input.storeUrl, input.accessToken);
          shopCurrencyCache.set(`${input.sellerId}:shopify`, shop.currency);
        } catch (error) {
          errors.push({
            field: "accessToken",
            message: error instanceof Error ? error.message : "Unable to verify Shopify connection.",
          });
        }
      }
      return { valid: errors.length === 0, errors };
    },
    connect: async (input: ConnectorConnectInput) => {
      if (!input.storeUrl?.trim() || !input.accessToken?.trim()) {
        throw new Error("Shopify store URL and access token are required.");
      }
      const shop = await verifyShopifyConnection(input.storeUrl, input.accessToken);
      shopCurrencyCache.set(`${input.sellerId}:shopify`, shop.currency);
    },
    estimateTotal: async (input) => {
      if (!(await hasLiveApiCredentials(input.sellerId, input.platform))) {
        return 0;
      }
      const credentials = await loadConnectorCredentials(input.sellerId, input.platform);
      if (!credentials?.accessToken || !credentials.storeUrl) return 0;
      return getShopifyProductCount(credentials.storeUrl, credentials.accessToken);
    },
    fetchListings: async (input: MigrationConnectorInput) => {
      const credentials = await loadConnectorCredentials(input.sellerId, input.platform);
      if (!credentials?.accessToken || !credentials.storeUrl) {
        throw new ConnectorApiError("Shopify connector is not connected.", 401);
      }

      const currency = await resolveShopCurrency(
        input.sellerId,
        credentials.storeUrl,
        credentials.accessToken,
      );

      return fetchShopifyProducts(
        input,
        credentials.storeUrl,
        credentials.accessToken,
        currency,
      );
    },
  });
}
