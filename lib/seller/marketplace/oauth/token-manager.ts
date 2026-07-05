import "server-only";

import {
  decryptCredentials,
  updateConnectorCredentials,
  type StoredConnectorCredentials,
} from "@/lib/seller/migration/connectors/credentials";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  readEtsyApiKeystring,
  readOAuthClientId,
  readOAuthClientSecret,
} from "@/lib/seller/marketplace/oauth/env";
import type { OAuthPlatformId, OAuthTokenResult } from "@/lib/seller/marketplace/oauth/types";
import { logMarketplaceEvent } from "@/lib/seller/marketplace/logger";
import { updateMarketplaceConnectorRecord } from "@/lib/seller/marketplace/repository";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

export class OAuthTokenRefreshError extends Error {
  readonly code: "expired" | "revoked" | "network" | "misconfigured" | "unknown";

  constructor(message: string, code: OAuthTokenRefreshError["code"]) {
    super(message);
    this.name = "OAuthTokenRefreshError";
    this.code = code;
  }
}

export function isTokenExpired(
  credentials: StoredConnectorCredentials,
  bufferMs = TOKEN_EXPIRY_BUFFER_MS,
): boolean {
  if (!credentials.expiresAt) return false;
  const expiresAt = Date.parse(credentials.expiresAt);
  if (Number.isNaN(expiresAt)) return false;
  return Date.now() + bufferMs >= expiresAt;
}

export function resolveTokenHealth(
  credentials: StoredConnectorCredentials | null,
): "valid" | "expiring_soon" | "expired" | "none" {
  if (!credentials?.accessToken) return "none";
  if (!credentials.expiresAt) return "valid";
  const expiresAt = Date.parse(credentials.expiresAt);
  if (Number.isNaN(expiresAt)) return "valid";
  const msUntilExpiry = expiresAt - Date.now();
  if (msUntilExpiry <= 0) return "expired";
  if (msUntilExpiry <= TOKEN_EXPIRY_BUFFER_MS) return "expiring_soon";
  return "valid";
}

async function loadRawConnectorCredentials(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<StoredConnectorCredentials | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("store_migration_connectors")
    .select("credentials_encrypted, connection_status")
    .eq("seller_id", sellerId)
    .eq("platform", platform)
    .maybeSingle();

  if (!data || data.connection_status !== "connected") return null;
  return decryptCredentials(data.credentials_encrypted);
}

async function exchangeRefreshToken(
  platform: OAuthPlatformId,
  refreshToken: string,
): Promise<OAuthTokenResult> {
  const clientId = readOAuthClientId(platform);
  const clientSecret = readOAuthClientSecret(platform);
  if (!clientId || !clientSecret) {
    throw new OAuthTokenRefreshError("OAuth is not configured for this marketplace.", "misconfigured");
  }

  switch (platform) {
    case "ebay": {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        scope: "https://api.ebay.com/oauth/api_scope/sell.inventory",
      });
      let response: Response;
      try {
        response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        });
      } catch {
        throw new OAuthTokenRefreshError("Unable to reach eBay.", "network");
      }
      if (response.status === 401 || response.status === 403) {
        throw new OAuthTokenRefreshError("eBay refresh token was revoked.", "revoked");
      }
      if (!response.ok) {
        throw new OAuthTokenRefreshError("eBay token refresh failed.", "unknown");
      }
      const payload = (await response.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      };
      if (!payload.access_token) {
        throw new OAuthTokenRefreshError("eBay did not return an access token.", "unknown");
      }
      return {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token ?? refreshToken,
        expiresAt: payload.expires_in
          ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
          : undefined,
      };
    }
    case "etsy": {
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        refresh_token: refreshToken,
      });
      let response: Response;
      try {
        response = await fetch("https://api.etsy.com/v3/public/oauth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "x-api-key": readEtsyApiKeystring() ?? clientId,
          },
          body,
        });
      } catch {
        throw new OAuthTokenRefreshError("Unable to reach Etsy.", "network");
      }
      if (response.status === 401 || response.status === 403) {
        throw new OAuthTokenRefreshError("Etsy refresh token was revoked.", "revoked");
      }
      if (!response.ok) {
        throw new OAuthTokenRefreshError("Etsy token refresh failed.", "unknown");
      }
      const payload = (await response.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      };
      if (!payload.access_token) {
        throw new OAuthTokenRefreshError("Etsy did not return an access token.", "unknown");
      }
      return {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token ?? refreshToken,
        expiresAt: payload.expires_in
          ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
          : undefined,
      };
    }
    case "shopify":
      throw new OAuthTokenRefreshError("Shopify tokens do not support refresh in this integration.", "unknown");
  }
}

export async function refreshOAuthTokens(
  sellerId: string,
  platform: OAuthPlatformId,
): Promise<StoredConnectorCredentials> {
  const existing = await loadRawConnectorCredentials(sellerId, platform);
  if (!existing?.accessToken) {
    throw new OAuthTokenRefreshError("Connector is not connected.", "unknown");
  }
  if (platform === "shopify") {
    return existing;
  }
  if (!existing.refreshToken) {
    throw new OAuthTokenRefreshError("Refresh token is missing. Reconnect this marketplace.", "expired");
  }

  try {
    const tokens = await exchangeRefreshToken(platform, existing.refreshToken);
    const merged = await updateConnectorCredentials(sellerId, platform, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? existing.refreshToken,
      expiresAt: tokens.expiresAt,
      tokenRefreshedAt: new Date().toISOString(),
    });

    await updateMarketplaceConnectorRecord(sellerId, platform, {
      healthStatus: "healthy",
      syncStatus: "connected",
      lastHealthCheckAt: new Date().toISOString(),
      lastError: null,
    });

    logMarketplaceEvent("info", "OAuth token refreshed", { sellerId, platform });
    return merged;
  } catch (error) {
    const refreshError =
      error instanceof OAuthTokenRefreshError
        ? error
        : new OAuthTokenRefreshError(
            error instanceof Error ? error.message : "Token refresh failed.",
            "unknown",
          );

    await updateMarketplaceConnectorRecord(sellerId, platform, {
      healthStatus: refreshError.code === "revoked" ? "authentication_expired" : "warning",
      syncStatus: "retry_available",
      lastError: refreshError.message,
    });

    throw refreshError;
  }
}

export async function loadConnectorCredentialsWithRefresh(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<StoredConnectorCredentials | null> {
  const credentials = await loadRawConnectorCredentials(sellerId, platform);
  if (!credentials) return null;

  if (platform !== "ebay" && platform !== "etsy") {
    return credentials;
  }

  if (!isTokenExpired(credentials)) {
    return credentials;
  }

  try {
    return await refreshOAuthTokens(sellerId, platform);
  } catch {
    return credentials;
  }
}
