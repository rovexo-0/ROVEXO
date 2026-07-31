import { describe, expect, it } from "vitest";
import {
  OAUTH_RC1_PUBLIC_PROVIDERS_V1,
  resolvePublicOauthProviders,
} from "@/lib/auth/oauth-rc1-public-providers-v1";
import { AUTH_ERROR_MESSAGES } from "@/lib/auth/redirects";
import { mapAuthErrorMessage } from "@/lib/auth/errors";

describe("OAuth RC1 — public Google + Apple gating", () => {
  it("exposes only google and apple as public providers", () => {
    expect(OAUTH_RC1_PUBLIC_PROVIDERS_V1.publicProviders).toEqual(["google", "apple"]);
    expect(OAUTH_RC1_PUBLIC_PROVIDERS_V1.publicForbidden).toContain("facebook");
    expect(OAUTH_RC1_PUBLIC_PROVIDERS_V1.failClosed).toBe(true);
  });

  it("resolves providers fail-closed from availability", () => {
    expect(
      resolvePublicOauthProviders({ google: false, apple: false, facebook: true }),
    ).toEqual([]);
    expect(
      resolvePublicOauthProviders({ google: true, apple: false, facebook: false }),
    ).toEqual(["google"]);
    expect(
      resolvePublicOauthProviders({ google: true, apple: true, facebook: true }),
    ).toEqual(["google", "apple"]);
  });

  it("maps OAuth error codes for Login / Register", () => {
    expect(AUTH_ERROR_MESSAGES.oauth_provider_unavailable).toMatch(/unavailable/i);
    expect(AUTH_ERROR_MESSAGES.oauth_cancelled).toMatch(/cancelled/i);
    expect(AUTH_ERROR_MESSAGES.oauth_account_exists).toMatch(/already exists/i);
    expect(AUTH_ERROR_MESSAGES.oauth_network).toMatch(/network/i);
    expect(mapAuthErrorMessage("provider is not enabled")).toMatch(/unavailable/i);
    expect(mapAuthErrorMessage("identity_already_exists")).toMatch(/already exists/i);
  });
});
