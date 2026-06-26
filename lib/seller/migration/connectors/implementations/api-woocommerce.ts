import { BaseUniversalConnector, hasLiveApiCredentials } from "@/lib/seller/migration/connectors/base-connector";
import { ConnectorApiError } from "@/lib/seller/migration/connectors/api/http-client";
import {
  fetchWooProducts,
  getWooProductCount,
  verifyWooCommerceConnection,
} from "@/lib/seller/migration/connectors/api/woocommerce-client";
import { loadConnectorCredentials } from "@/lib/seller/migration/connectors/credentials";
import type { ConnectorConnectInput, ConnectorDefinition } from "@/lib/seller/migration/connectors/types";
import type { MigrationConnectorInput } from "@/lib/seller/migration/engine/types";

const wooCurrencyCache = new Map<string, string>();

async function resolveWooCurrency(
  sellerId: string,
  storeUrl: string,
  apiKey: string,
  apiSecret: string,
): Promise<string> {
  const cacheKey = `${sellerId}:woocommerce`;
  const cached = wooCurrencyCache.get(cacheKey);
  if (cached) return cached;

  const shop = await verifyWooCommerceConnection(storeUrl, apiKey, apiSecret);
  wooCurrencyCache.set(cacheKey, shop.currency);
  return shop.currency;
}

export function createWooCommerceConnector(definition: ConnectorDefinition): BaseUniversalConnector {
  return new BaseUniversalConnector(definition, {
    validateConfiguration: async (input) => {
      const errors = [];
      if (!input.storeUrl?.trim()) {
        errors.push({ field: "storeUrl", message: "WooCommerce store URL is required." });
      }
      if (!input.apiKey?.trim() || !input.apiSecret?.trim()) {
        errors.push({
          field: "apiKey",
          message: "WooCommerce REST API consumer key and secret are required.",
        });
      }
      if (errors.length === 0 && input.storeUrl && input.apiKey && input.apiSecret) {
        try {
          const shop = await verifyWooCommerceConnection(
            input.storeUrl,
            input.apiKey,
            input.apiSecret,
          );
          wooCurrencyCache.set(`${input.sellerId}:woocommerce`, shop.currency);
        } catch (error) {
          errors.push({
            field: "apiKey",
            message:
              error instanceof Error ? error.message : "Unable to verify WooCommerce connection.",
          });
        }
      }
      return { valid: errors.length === 0, errors };
    },
    connect: async (input: ConnectorConnectInput) => {
      if (!input.storeUrl?.trim() || !input.apiKey?.trim() || !input.apiSecret?.trim()) {
        throw new Error("WooCommerce store URL and API credentials are required.");
      }
      const shop = await verifyWooCommerceConnection(
        input.storeUrl,
        input.apiKey,
        input.apiSecret,
      );
      wooCurrencyCache.set(`${input.sellerId}:woocommerce`, shop.currency);
    },
    estimateTotal: async (input) => {
      if (!(await hasLiveApiCredentials(input.sellerId, input.platform))) {
        return 0;
      }
      const credentials = await loadConnectorCredentials(input.sellerId, input.platform);
      if (!credentials?.apiKey || !credentials.apiSecret || !credentials.storeUrl) return 0;
      return getWooProductCount(credentials.storeUrl, credentials.apiKey, credentials.apiSecret);
    },
    fetchListings: async (input: MigrationConnectorInput) => {
      const credentials = await loadConnectorCredentials(input.sellerId, input.platform);
      if (!credentials?.apiKey || !credentials.apiSecret || !credentials.storeUrl) {
        throw new ConnectorApiError("WooCommerce connector is not connected.", 401);
      }

      const currency = await resolveWooCurrency(
        input.sellerId,
        credentials.storeUrl,
        credentials.apiKey,
        credentials.apiSecret,
      );

      return fetchWooProducts(
        input,
        credentials.storeUrl,
        credentials.apiKey,
        credentials.apiSecret,
        currency,
      );
    },
  });
}
