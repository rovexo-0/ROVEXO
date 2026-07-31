/**
 * ROVEXO OAuth RC1 — Public Google + Apple (Owner Production Implementation)
 *
 * Email auth unchanged. Facebook remains disabled on public surfaces.
 * Buttons render only when the provider is confirmed available (fail closed).
 *
 * Account linking (no duplicate accounts):
 * Supabase Auth owns identity merge when Automatic Linking is enabled for the
 * same verified email. App never creates a second user for an existing email —
 * callback maps identity conflicts to `oauth_account_exists` and prompts email login.
 */

export const OAUTH_RC1_PUBLIC_PROVIDERS_V1 = {
  id: "oauth-rc1-public-providers-v1",
  version: "1.0.0",
  status: "OWNER_AUTHORIZED_RC1",
  /** Public Login / Register may show these when availability probe PASSes. */
  publicProviders: ["google", "apple"] as const,
  /** Never show on public Login / Register in RC1. */
  publicForbidden: ["facebook"] as const,
  failClosed: true,
  equation: "EMAIL + GOOGLE_WHEN_ENABLED + APPLE_WHEN_ENABLED + FACEBOOK_HIDDEN",
} as const;

export type OauthRc1PublicProvider = (typeof OAUTH_RC1_PUBLIC_PROVIDERS_V1.publicProviders)[number];

export type OauthProviderAvailability = {
  google: boolean;
  apple: boolean;
  facebook: boolean;
};

export function resolvePublicOauthProviders(
  availability: OauthProviderAvailability,
): OauthRc1PublicProvider[] {
  const enabled: OauthRc1PublicProvider[] = [];
  if (availability.google) enabled.push("google");
  if (availability.apple) enabled.push("apple");
  return enabled;
}
