import "server-only";

/**
 * Detect which Supabase Auth OAuth providers are actually enabled.
 * Fail closed: unavailable / network error → hide button (never show broken OAuth).
 */

import { getAppUrl, tryGetSupabaseAnonKey, tryGetSupabaseUrl } from "@/lib/supabase/env";
import {
  type OauthProviderAvailability,
  resolvePublicOauthProviders,
  type OauthRc1PublicProvider,
} from "@/lib/auth/oauth-rc1-public-providers-v1";

const CACHE_TTL_MS = 60_000;

type CacheEntry = {
  at: number;
  availability: OauthProviderAvailability;
};

let cache: CacheEntry | null = null;

function envForceEnabled(provider: "google" | "apple" | "facebook"): boolean | null {
  const key =
    provider === "google"
      ? "OAUTH_GOOGLE_ENABLED"
      : provider === "apple"
        ? "OAUTH_APPLE_ENABLED"
        : "OAUTH_FACEBOOK_ENABLED";
  const raw = process.env[key]?.trim().toLowerCase();
  if (raw === "1" || raw === "true" || raw === "yes") return true;
  if (raw === "0" || raw === "false" || raw === "no") return false;
  return null;
}

async function probeProvider(provider: "google" | "apple" | "facebook"): Promise<boolean> {
  const forced = envForceEnabled(provider);
  if (forced === false) return false;
  // Facebook stays off on public RC1 even if env forces — publicForbidden.
  if (provider === "facebook") return false;
  if (forced === true) return true;

  const url = tryGetSupabaseUrl();
  const anon = tryGetSupabaseAnonKey();
  if (!url || !anon) return false;

  const redirectTo = encodeURIComponent(`${getAppUrl()}/auth/callback`);
  const endpoint = `${url}/auth/v1/authorize?provider=${provider}&redirect_to=${redirectTo}`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      redirect: "manual",
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      },
      signal: AbortSignal.timeout(4_000),
    });

    const location = response.headers.get("location") ?? "";
    const body = response.status >= 400 ? await response.text().catch(() => "") : "";
    const disabled =
      /provider is not enabled|validation_failed|Unsupported provider/i.test(body) ||
      /provider is not enabled|validation_failed|Unsupported provider/i.test(location);

    if (disabled) return false;

    // Enabled providers redirect (302/303) to the IdP.
    if (response.status >= 300 && response.status < 400 && location) {
      return true;
    }

    // Some stacks return 200 with a URL body — treat as unavailable (fail closed).
    return false;
  } catch {
    return false;
  }
}

export async function loadOauthProviderAvailability(): Promise<OauthProviderAvailability> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) {
    return cache.availability;
  }

  const [google, apple] = await Promise.all([probeProvider("google"), probeProvider("apple")]);
  const availability: OauthProviderAvailability = {
    google,
    apple,
    facebook: false,
  };
  cache = { at: now, availability };
  return availability;
}

export async function loadPublicOauthProviders(): Promise<OauthRc1PublicProvider[]> {
  const availability = await loadOauthProviderAvailability();
  return resolvePublicOauthProviders(availability);
}

/** Test helper — clear in-memory cache. */
export function clearOauthProviderAvailabilityCache(): void {
  cache = null;
}
