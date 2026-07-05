import "server-only";

import {
  oauthCallbackUrl,
  readEtsyApiKeystring,
  readOAuthClientId,
  readOAuthClientSecret,
} from "@/lib/seller/marketplace/oauth/env";
import {
  clearOAuthStateCookie,
  createOAuthNonce,
  createOAuthState,
  createPkcePair,
  readOAuthState,
} from "@/lib/seller/marketplace/oauth/state";
import type { OAuthPlatformId, OAuthStatePayload, OAuthTokenResult } from "@/lib/seller/marketplace/oauth/types";
import { connectMarketplaceCredentials } from "@/lib/seller/marketplace/credentials";
import { isOAuthPlatformConfigured } from "@/lib/seller/marketplace/oauth/env";

function sanitizeReturnTo(returnTo: string | null | undefined): string {
  if (!returnTo || !returnTo.startsWith("/")) return "/import";
  if (returnTo.startsWith("//")) return "/import";
  return returnTo;
}

function appendQueryToPath(path: string, params: Record<string, string>): string {
  const url = new URL(path, "https://rovexo.local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

export function buildOAuthAuthorizeResponse(input: {
  platform: OAuthPlatformId;
  sellerId: string;
  returnTo?: string | null;
  shop?: string | null;
}): { redirectUrl: string; setCookie: string } {
  const returnTo = sanitizeReturnTo(input.returnTo);
  const nonce = createOAuthNonce();
  const pkce = createPkcePair();
  const statePayload: OAuthStatePayload = {
    sellerId: input.sellerId,
    platform: input.platform,
    returnTo,
    nonce,
    codeVerifier: pkce.verifier,
    shop: input.shop ?? undefined,
  };
  const { value, cookie } = createOAuthState(statePayload);
  const redirectUri = oauthCallbackUrl(input.platform);
  const clientId = readOAuthClientId(input.platform);

  if (!clientId) {
    return {
      redirectUrl: appendQueryToPath(returnTo, { oauth: "unconfigured" }),
      setCookie: clearOAuthStateCookie(),
    };
  }

  let redirectUrl = returnTo;

  switch (input.platform) {
    case "ebay": {
      const scope = encodeURIComponent("https://api.ebay.com/oauth/api_scope/sell.inventory");
      redirectUrl =
        `https://auth.ebay.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code&scope=${scope}&state=${encodeURIComponent(value)}`;
      break;
    }
    case "etsy": {
      const scope = encodeURIComponent("listings_r shops_r");
      redirectUrl =
        `https://www.etsy.com/oauth/connect?response_type=code` +
        `&client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${scope}` +
        `&state=${encodeURIComponent(value)}` +
        `&code_challenge=${encodeURIComponent(pkce.challenge)}` +
        `&code_challenge_method=S256`;
      break;
    }
    case "shopify": {
      const shop = input.shop?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
      if (!shop) {
        return {
          redirectUrl: appendQueryToPath(returnTo, { oauth: "shop_required" }),
          setCookie: clearOAuthStateCookie(),
        };
      }
      const scope = encodeURIComponent("read_products,read_inventory");
      redirectUrl =
        `https://${shop}/admin/oauth/authorize?client_id=${encodeURIComponent(clientId)}` +
        `&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${encodeURIComponent(value)}`;
      break;
    }
  }

  return { redirectUrl, setCookie: cookie };
}

async function exchangeOAuthCode(
  platform: OAuthPlatformId,
  code: string,
  state: OAuthStatePayload,
): Promise<OAuthTokenResult> {
  const redirectUri = oauthCallbackUrl(platform);
  const clientId = readOAuthClientId(platform);
  const clientSecret = readOAuthClientSecret(platform);
  if (!clientId || !clientSecret) {
    throw new Error("OAuth is not configured for this marketplace.");
  }

  switch (platform) {
    case "ebay": {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      });
      const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      if (!response.ok) throw new Error("eBay authorization failed.");
      const payload = (await response.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      };
      if (!payload.access_token) throw new Error("eBay did not return an access token.");
      return {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        expiresAt: payload.expires_in
          ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
          : undefined,
      };
    }
    case "etsy": {
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        redirect_uri: redirectUri,
        code,
        code_verifier: state.codeVerifier ?? "",
      });
      const response = await fetch("https://api.etsy.com/v3/public/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-api-key": readEtsyApiKeystring() ?? clientId,
        },
        body,
      });
      if (!response.ok) throw new Error("Etsy authorization failed.");
      const payload = (await response.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      };
      if (!payload.access_token) throw new Error("Etsy did not return an access token.");
      return {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        expiresAt: payload.expires_in
          ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
          : undefined,
      };
    }
    case "shopify": {
      const shop = state.shop;
      if (!shop) throw new Error("Shopify shop is required.");
      const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      });
      const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!response.ok) throw new Error("Shopify authorization failed.");
      const payload = (await response.json()) as {
        access_token?: string;
        scope?: string;
      };
      if (!payload.access_token) throw new Error("Shopify did not return an access token.");
      return {
        accessToken: payload.access_token,
        storeUrl: `https://${shop}`,
        scopes: payload.scope,
      };
    }
  }
}

export async function handleOAuthCallback(input: {
  platform: OAuthPlatformId;
  code: string | null;
  stateValue: string | null;
  cookieHeader: string | null;
  error?: string | null;
}): Promise<{ redirectUrl: string; setCookie: string }> {
  const state = readOAuthState(input.cookieHeader, input.stateValue);
  const fallback = sanitizeReturnTo(state?.returnTo);

  if (input.error || !input.code || !state || state.platform !== input.platform) {
    return {
      redirectUrl: appendQueryToPath(fallback, { oauth: "failed" }),
      setCookie: clearOAuthStateCookie(),
    };
  }

  try {
    const tokens = await exchangeOAuthCode(input.platform, input.code, state);
    await connectMarketplaceCredentials({
      sellerId: state.sellerId,
      platform: input.platform,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      storeUrl: tokens.storeUrl,
      apiKey: input.platform === "etsy" ? readEtsyApiKeystring() : undefined,
      expiresAt: tokens.expiresAt,
      scopes: tokens.scopes,
      connectedAt: new Date().toISOString(),
    });
    return {
      redirectUrl: appendQueryToPath(fallback, { connected: "1" }),
      setCookie: clearOAuthStateCookie(),
    };
  } catch {
    return {
      redirectUrl: appendQueryToPath(fallback, { oauth: "failed" }),
      setCookie: clearOAuthStateCookie(),
    };
  }
}

export { isOAuthPlatformConfigured };
