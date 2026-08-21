import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { encodeMiddlewareVerifiedUser } from "@/lib/auth/middleware-verified-user-v1";
import { validateMutationOrigin } from "@/lib/api/csrf-guard";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const STAMP_SECRET = "test-internal-stamp-secret";

const {
  verifyBearerAccessToken,
  requireApiAuth,
  getUserRole,
  tryCreateAdminClient,
  createClient,
  headersFn,
} = vi.hoisted(() => ({
  verifyBearerAccessToken: vi.fn(),
  requireApiAuth: vi.fn(),
  getUserRole: vi.fn(),
  tryCreateAdminClient: vi.fn(),
  createClient: vi.fn(),
  headersFn: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: () => headersFn(),
  cookies: async () => ({ getAll: () => [] }),
}));

vi.mock("@/lib/auth/verify-bearer-access-token-v1", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/verify-bearer-access-token-v1")>();
  return {
    ...actual,
    verifyBearerAccessToken,
  };
});

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    requireApiAuth,
    getUserRole,
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  tryCreateAdminClient: () => tryCreateAdminClient(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClient(),
}));

import {
  requireCookieOrBearerListingRole,
  requireSavedApiAuth,
} from "@/lib/saved/saved-api-auth-v1";

function profileClient(role: string | null, status = "active") {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { account_status: status, role },
          }),
        }),
      }),
    }),
  };
}

function forgeUnsignedStamp(id: string, email = "spoof@evil.test"): string {
  const json = JSON.stringify({ id, email, emailConfirmedAt: null });
  return Buffer.from(json).toString("base64url");
}

function nativeUser(id = USER_ID) {
  return { id, email: "native@rovexo.co.uk" };
}

function bearerRequest(token?: string, extra: HeadersInit = {}) {
  const headers: Record<string, string> = {
    host: "www.rovexo.co.uk",
    origin: "https://www.rovexo.co.uk",
    ...Object.fromEntries(new Headers(extra).entries()),
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request("https://www.rovexo.co.uk/api/listings/upload", {
    method: "POST",
    headers,
  });
}

function cookieRequest() {
  return new Request("https://www.rovexo.co.uk/api/listings/upload", {
    method: "POST",
    headers: {
      host: "www.rovexo.co.uk",
      origin: "https://www.rovexo.co.uk",
      cookie: "sb-pklotmwxtnnepaitedic-auth-token.0=cookie-session",
    },
  });
}

describe("native bearer auth boundary", () => {
  beforeEach(() => {
    vi.stubEnv("INTERNAL_REQUEST_STAMP_SECRET", STAMP_SECRET);
    verifyBearerAccessToken.mockReset();
    requireApiAuth.mockReset();
    getUserRole.mockReset();
    tryCreateAdminClient.mockReset();
    createClient.mockReset();
    headersFn.mockReset();
    headersFn.mockResolvedValue(new Headers());
    tryCreateAdminClient.mockReturnValue(profileClient("buyer"));
    createClient.mockResolvedValue(profileClient("buyer"));
    getUserRole.mockResolvedValue(null);
  });

  it("A. valid web cookie uses requireApiAuth and does not call getUser(jwt)", async () => {
    requireApiAuth.mockResolvedValue({
      supabase: {},
      user: nativeUser(),
      role: "buyer",
    });
    const auth = await requireSavedApiAuth(cookieRequest());
    expect(verifyBearerAccessToken).not.toHaveBeenCalled();
    expect(requireApiAuth).toHaveBeenCalledOnce();
    expect(auth).not.toBeInstanceOf(NextResponse);
    if (auth instanceof NextResponse) return;
    expect(auth.user.id).toBe(USER_ID);
  });

  it("B. valid Native Bearer JWT authenticates without cookies", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const auth = await requireSavedApiAuth(bearerRequest("valid-native-jwt"));
    expect(requireApiAuth).not.toHaveBeenCalled();
    expect(verifyBearerAccessToken).toHaveBeenCalledWith("valid-native-jwt");
    expect(auth).not.toBeInstanceOf(NextResponse);
    if (auth instanceof NextResponse) return;
    expect(auth.user.id).toBe(USER_ID);
    expect(auth.role).toBe("buyer");
  });

  it("C. expired Bearer JWT fails closed with 401", async () => {
    verifyBearerAccessToken.mockResolvedValue(null);
    const auth = await requireSavedApiAuth(bearerRequest("expired-native-jwt"));
    expect(auth).toBeInstanceOf(NextResponse);
    expect((auth as NextResponse).status).toBe(401);
    expect(requireApiAuth).not.toHaveBeenCalled();
  });

  it("D. invalid Bearer JWT fails closed with 401", async () => {
    verifyBearerAccessToken.mockResolvedValue(null);
    const auth = await requireSavedApiAuth(bearerRequest("not-a-jwt"));
    expect((auth as NextResponse).status).toBe(401);
  });

  it("E. missing Bearer uses existing cookie behavior", async () => {
    requireApiAuth.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    const auth = await requireSavedApiAuth(
      new Request("https://www.rovexo.co.uk/api/saved", { method: "GET" }),
    );
    expect(verifyBearerAccessToken).not.toHaveBeenCalled();
    expect(requireApiAuth).toHaveBeenCalledOnce();
    expect((auth as NextResponse).status).toBe(401);
  });

  it("F. spoofed x-rovexo-verified-user without cookie or Bearer is 401", async () => {
    requireApiAuth.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    headersFn.mockResolvedValue(
      new Headers({
        "x-rovexo-verified-user": forgeUnsignedStamp(USER_B),
      }),
    );
    const auth = await requireSavedApiAuth(
      new Request("https://www.rovexo.co.uk/api/saved", {
        method: "GET",
        headers: { "x-rovexo-verified-user": forgeUnsignedStamp(USER_B) },
      }),
    );
    expect(verifyBearerAccessToken).not.toHaveBeenCalled();
    expect(auth).toBeInstanceOf(NextResponse);
    expect((auth as NextResponse).status).toBe(401);
    if (auth instanceof NextResponse) {
      const body = await auth.json();
      expect(body.error).toBe("Unauthorized");
    }
  });

  it("G. valid Bearer User A ignores spoofed User B trust header", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser(USER_ID));
    headersFn.mockResolvedValue(
      new Headers({
        "x-rovexo-verified-user": await encodeMiddlewareVerifiedUser({
          id: USER_B,
          email: "user-b@rovexo.co.uk",
        }),
      }),
    );
    const auth = await requireSavedApiAuth(
      bearerRequest("valid-native-jwt", {
        "x-rovexo-verified-user": forgeUnsignedStamp(USER_B),
      }),
    );
    expect(verifyBearerAccessToken).toHaveBeenCalledWith("valid-native-jwt");
    expect(auth).not.toBeInstanceOf(NextResponse);
    if (auth instanceof NextResponse) return;
    expect(auth.user.id).toBe(USER_ID);
    expect(auth.user.id).not.toBe(USER_B);
  });

  it("H. authenticated Native user without listing role is 403 not 401", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    tryCreateAdminClient.mockReturnValue(profileClient(null));
    getUserRole.mockResolvedValue(null);
    const auth = await requireCookieOrBearerListingRole(bearerRequest("valid-native-jwt"));
    expect(auth).toBeInstanceOf(NextResponse);
    expect((auth as NextResponse).status).toBe(403);
  });

  it("I. GET /api/saved valid Bearer authenticates without listing-role gate", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const auth = await requireSavedApiAuth(
      new Request("https://www.rovexo.co.uk/api/saved", {
        method: "GET",
        headers: { authorization: "Bearer valid-native-jwt" },
      }),
    );
    expect(auth).not.toBeInstanceOf(NextResponse);
    if (auth instanceof NextResponse) return;
    expect(auth.user.id).toBe(USER_ID);
  });

  it("J. POST /api/listings/upload valid Bearer passes auth and listing role", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const auth = await requireCookieOrBearerListingRole(bearerRequest("valid-native-jwt"));
    expect(auth).not.toBeInstanceOf(NextResponse);
    if (auth instanceof NextResponse) return;
    expect(auth.role).toBe("buyer");
    expect(auth.user.id).toBe(USER_ID);
  });

  it("K. POST /api/listings valid Bearer passes auth and listing role", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const auth = await requireCookieOrBearerListingRole(
      new Request("https://www.rovexo.co.uk/api/listings", {
        method: "POST",
        headers: {
          authorization: "Bearer valid-native-jwt",
          origin: "https://www.rovexo.co.uk",
          host: "www.rovexo.co.uk",
        },
      }),
    );
    expect(auth).not.toBeInstanceOf(NextResponse);
    if (auth instanceof NextResponse) return;
    expect(auth.role).toBe("buyer");
  });

  it("L. CSRF violation stays 403 and is not mapped to Unauthorized", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.rovexo.co.uk");
    const blocked = validateMutationOrigin(
      new Request("https://www.rovexo.co.uk/api/listings/upload", {
        method: "POST",
        headers: { origin: "https://evil.example", host: "www.rovexo.co.uk" },
      }),
    );
    expect(blocked?.status).toBe(403);
    const body = await blocked?.json();
    expect(body.error).toBe("Unable to complete this action.");
    expect(body.error).not.toBe("Unauthorized");
    const bearerSkipped = validateMutationOrigin(
      new Request("https://www.rovexo.co.uk/api/listings/upload", {
        method: "POST",
        headers: {
          authorization: "Bearer valid-native-jwt",
          origin: "https://evil.example",
        },
      }),
    );
    expect(bearerSkipped).toBeNull();
    vi.unstubAllEnvs();
  });

  it("M. client cannot forge internal verification state", async () => {
    requireApiAuth.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    headersFn.mockResolvedValue(
      new Headers({
        "x-rovexo-verified-user": forgeUnsignedStamp(USER_ID),
      }),
    );
    const saved = await requireSavedApiAuth(
      new Request("https://www.rovexo.co.uk/api/saved", { method: "GET" }),
    );
    const upload = await requireCookieOrBearerListingRole(
      new Request("https://www.rovexo.co.uk/api/listings/upload", { method: "POST" }),
    );
    expect((saved as NextResponse).status).toBe(401);
    expect((upload as NextResponse).status).toBe(401);
  });

  it("uses a server HMAC Bearer stamp when Authorization was stripped and no cookie exists", async () => {
    headersFn.mockResolvedValue(
      new Headers({
        "x-rovexo-verified-user": await encodeMiddlewareVerifiedUser({
          id: USER_ID,
          email: "native@rovexo.co.uk",
          email_confirmed_at: "2026-01-01T00:00:00Z",
        }),
      }),
    );
    const auth = await requireSavedApiAuth(
      new Request("https://www.rovexo.co.uk/api/saved", { method: "GET" }),
    );
    expect(verifyBearerAccessToken).not.toHaveBeenCalled();
    expect(requireApiAuth).not.toHaveBeenCalled();
    expect(auth).not.toBeInstanceOf(NextResponse);
    if (auth instanceof NextResponse) return;
    expect(auth.user.id).toBe(USER_ID);
  });

  it("does not use middleware stamp to skip CSRF on cookie requests", async () => {
    requireApiAuth.mockResolvedValue({
      supabase: {},
      user: nativeUser(),
      role: "buyer",
    });
    headersFn.mockResolvedValue(
      new Headers({
        "x-rovexo-verified-user": await encodeMiddlewareVerifiedUser({
          id: USER_ID,
          email: "native@rovexo.co.uk",
        }),
      }),
    );
    await requireSavedApiAuth(cookieRequest());
    expect(requireApiAuth).toHaveBeenCalledOnce();
  });
});
