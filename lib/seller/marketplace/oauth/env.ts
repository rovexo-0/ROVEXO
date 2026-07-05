import "server-only";

import { getAppUrl } from "@/lib/supabase/env";
import type { OAuthPlatformId } from "@/lib/seller/marketplace/oauth/types";

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function oauthCallbackUrl(platform: OAuthPlatformId): string {
  return `${getAppUrl()}/api/seller/marketplace/oauth/${platform}/callback`;
}

export function isOAuthPlatformConfigured(platform: OAuthPlatformId): boolean {
  switch (platform) {
    case "ebay":
      return Boolean(read("EBAY_CLIENT_ID") && read("EBAY_CLIENT_SECRET"));
    case "etsy":
      return Boolean(read("ETSY_CLIENT_ID") && read("ETSY_CLIENT_SECRET"));
    case "shopify":
      return Boolean(read("SHOPIFY_CLIENT_ID") && read("SHOPIFY_CLIENT_SECRET"));
    default:
      return false;
  }
}

export function readOAuthClientId(platform: OAuthPlatformId): string | undefined {
  switch (platform) {
    case "ebay":
      return read("EBAY_CLIENT_ID");
    case "etsy":
      return read("ETSY_CLIENT_ID");
    case "shopify":
      return read("SHOPIFY_CLIENT_ID");
    default:
      return undefined;
  }
}

export function readOAuthClientSecret(platform: OAuthPlatformId): string | undefined {
  switch (platform) {
    case "ebay":
      return read("EBAY_CLIENT_SECRET");
    case "etsy":
      return read("ETSY_CLIENT_SECRET");
    case "shopify":
      return read("SHOPIFY_CLIENT_SECRET");
    default:
      return undefined;
  }
}

export function readEtsyApiKeystring(): string | undefined {
  return read("ETSY_API_KEYSTRING") ?? read("ETSY_CLIENT_ID");
}
