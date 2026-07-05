import type { MigrationPlatformId } from "@/lib/seller/migration/types";

export type OAuthPlatformId = Extract<MigrationPlatformId, "ebay" | "etsy" | "shopify">;

export const OAUTH_PLATFORM_IDS: readonly OAuthPlatformId[] = ["ebay", "etsy", "shopify"] as const;

export type OAuthStatePayload = {
  sellerId: string;
  platform: OAuthPlatformId;
  returnTo: string;
  nonce: string;
  codeVerifier?: string;
  shop?: string;
};

export type OAuthTokenResult = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scopes?: string;
  storeUrl?: string;
};

export function isOAuthPlatform(platform: string): platform is OAuthPlatformId {
  return (OAUTH_PLATFORM_IDS as readonly string[]).includes(platform);
}
