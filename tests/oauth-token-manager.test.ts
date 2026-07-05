import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  isTokenExpired,
  OAuthTokenRefreshError,
  refreshOAuthTokens,
  resolveTokenHealth,
} from "@/lib/seller/marketplace/oauth/token-manager";

describe("OAuth token manager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-04T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("detects expired and expiring tokens", () => {
    expect(
      isTokenExpired({
        accessToken: "token",
        expiresAt: "2026-07-04T12:04:00.000Z",
      }),
    ).toBe(true);

    expect(
      isTokenExpired({
        accessToken: "token",
        expiresAt: "2026-07-04T12:10:00.000Z",
      }),
    ).toBe(false);

    expect(resolveTokenHealth({ accessToken: "token", expiresAt: "2026-07-04T12:04:30.000Z" })).toBe(
      "expiring_soon",
    );
    expect(resolveTokenHealth({ accessToken: "token" })).toBe("valid");
    expect(resolveTokenHealth(null)).toBe("none");
  });

  it("refreshes eBay tokens and persists rotated credentials", async () => {
    process.env.EBAY_CLIENT_ID = "ebay-client";
    process.env.EBAY_CLIENT_SECRET = "ebay-secret";

    const credentialsModule = await import("@/lib/seller/migration/connectors/credentials");
    const updateSpy = vi.spyOn(credentialsModule, "updateConnectorCredentials").mockResolvedValue({
      accessToken: "new-access",
      refreshToken: "new-refresh",
      expiresAt: "2026-07-04T13:00:00.000Z",
    });
    vi.spyOn(credentialsModule, "decryptCredentials").mockReturnValue({
      accessToken: "old-access",
      refreshToken: "old-refresh",
      expiresAt: "2026-07-04T12:00:00.000Z",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: "new-access",
          refresh_token: "new-refresh",
          expires_in: 3600,
        }),
      }),
    );

    const adminModule = await import("@/lib/supabase/admin");
    vi.spyOn(adminModule, "createAdminClient").mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  credentials_encrypted: "blob",
                  connection_status: "connected",
                },
              }),
            }),
          }),
        }),
      }),
    } as never);

    const repositoryModule = await import("@/lib/seller/marketplace/repository");
    vi.spyOn(repositoryModule, "updateMarketplaceConnectorRecord").mockResolvedValue(undefined);

    const result = await refreshOAuthTokens("seller-1", "ebay");

    expect(result.accessToken).toBe("new-access");
    expect(updateSpy).toHaveBeenCalledWith(
      "seller-1",
      "ebay",
      expect.objectContaining({
        accessToken: "new-access",
        refreshToken: "new-refresh",
      }),
    );
  });

  it("maps revoked refresh tokens to OAuthTokenRefreshError", async () => {
    process.env.ETSY_CLIENT_ID = "etsy-client";
    process.env.ETSY_CLIENT_SECRET = "etsy-secret";

    const credentialsModule = await import("@/lib/seller/migration/connectors/credentials");
    vi.spyOn(credentialsModule, "decryptCredentials").mockReturnValue({
      accessToken: "old-access",
      refreshToken: "old-refresh",
      expiresAt: "2026-07-04T11:00:00.000Z",
    });
    vi.spyOn(credentialsModule, "updateConnectorCredentials");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      }),
    );

    const adminModule = await import("@/lib/supabase/admin");
    vi.spyOn(adminModule, "createAdminClient").mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  credentials_encrypted: "blob",
                  connection_status: "connected",
                },
              }),
            }),
          }),
        }),
      }),
    } as never);

    const repositoryModule = await import("@/lib/seller/marketplace/repository");
    vi.spyOn(repositoryModule, "updateMarketplaceConnectorRecord").mockResolvedValue(undefined);

    await expect(refreshOAuthTokens("seller-1", "etsy")).rejects.toBeInstanceOf(OAuthTokenRefreshError);
  });
});
