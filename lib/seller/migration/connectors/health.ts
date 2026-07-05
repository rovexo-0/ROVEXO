import "server-only";

import { verifyEbayConnection } from "@/lib/seller/migration/connectors/api/ebay-client";
import {
  resolveEtsyApiKey,
  verifyEtsyConnection,
} from "@/lib/seller/migration/connectors/api/etsy-client";
import {
  getConnectorRecord,
} from "@/lib/seller/migration/connectors/credentials";
import { loadConnectorCredentialsWithRefresh } from "@/lib/seller/marketplace/oauth/token-manager";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

/**
 * Live API ping for connected marketplace connectors (Tier 2A: eBay, Etsy).
 */
export async function verifyConnectorApiHealth(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<void> {
  const credentials = await loadConnectorCredentialsWithRefresh(sellerId, platform);
  if (!credentials) {
    throw new Error("Connector is not connected.");
  }

  const record = await getConnectorRecord(sellerId, platform);

  if (platform === "ebay") {
    if (!credentials.accessToken) {
      throw new Error("eBay access token is missing.");
    }
    await verifyEbayConnection(credentials.accessToken, record?.settings);
    return;
  }

  if (platform === "etsy") {
    if (!credentials.accessToken) {
      throw new Error("Etsy access token is missing.");
    }
    const apiKey = resolveEtsyApiKey(credentials.apiKey);
    await verifyEtsyConnection(apiKey, credentials.accessToken);
  }
}
