import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const API_URL = "https://www.rovexo.co.uk/api/wallet/withdraw";

const {
  verifyBearerAccessToken,
  createVerifiedBearerUserClient,
  requireApiAuth,
  tryCreateAdminClient,
} = vi.hoisted(() => ({
  verifyBearerAccessToken: vi.fn(),
  createVerifiedBearerUserClient: vi.fn(),
  requireApiAuth: vi.fn(),
  tryCreateAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth/verify-bearer-access-token-v1", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/verify-bearer-access-token-v1")>();
  return {
    ...actual,
    verifyBearerAccessToken,
    createVerifiedBearerUserClient,
  };
});

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    requireApiAuth,
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  tryCreateAdminClient: () => tryCreateAdminClient(),
}));

import { validateMutationOrigin } from "@/lib/api/csrf-guard";
import { requireCookieOrBearerApiAuth } from "@/lib/auth/require-cookie-or-bearer-api-auth-v1";
import { readBearerAccessToken } from "@/lib/auth/verify-bearer-access-token-v1";

function read(relative: string) {
  return readFileSync(join(process.cwd(), relative), "utf8");
}

function cookieMutation(extra: HeadersInit = {}) {
  return new Request(API_URL, {
    method: "POST",
    headers: {
      host: "www.rovexo.co.uk",
      cookie: "sb-pklotmwxtnnepaitedic-auth-token.0=cookie-session",
      "content-type": "application/json",
      ...Object.fromEntries(new Headers(extra).entries()),
    },
    body: JSON.stringify({ amount: 10 }),
  });
}

function profileClient() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { account_status: "active", role: "buyer" },
          }),
        }),
      }),
    }),
  };
}

function cookieAuth() {
  return {
    supabase: { kind: "cookie-user-client" },
    user: { id: USER_ID, email: "web@rovexo.co.uk" },
    role: "buyer" as const,
  };
}

describe("Auth CSRF + Bearer source contract", () => {
  it("CSRF exemption requires verified Bearer, not header presence", () => {
    const csrf = read("lib/api/csrf-guard.ts");
    expect(csrf).toContain("await verifyBearerAccessToken(token)");
    expect(csrf).toContain("if (bearerUser?.id)");
    expect(csrf).not.toContain("/^Bearer\\s+\\S+/i.test(authorization)");
  });

  it("keeps one verifier and one cookie+Bearer combiner", () => {
    const verify = read("lib/auth/verify-bearer-access-token-v1.ts");
    const helper = read("lib/auth/require-cookie-or-bearer-api-auth-v1.ts");
    expect(verify).toContain("supabase.auth.getUser(accessToken)");
    expect(verify).toContain("createVerifiedBearerUserClient");
    expect(verify).toContain("Authorization: `Bearer ${accessToken}`");
    expect(verify).not.toContain("jwt.decode");
    expect(verify).not.toContain("getSupabaseServiceRoleKey");
    expect(helper).toContain("verifyBearerAccessToken");
    expect(helper).toContain("createVerifiedBearerUserClient");
    expect(helper).toContain("requireApiAuth(request)");
    expect(helper).not.toContain("tryCreateAdminClient");
    expect(helper).not.toContain("createAdminClient");
    expect(helper).not.toContain("searchParams.get(");
    expect(helper).not.toContain("body.userId");
    expect(helper).not.toContain("body.user_id");
  });
});

describe("CSRF cookie vs verified Bearer", () => {
  beforeEach(() => {
    verifyBearerAccessToken.mockReset();
    verifyBearerAccessToken.mockResolvedValue(null);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.rovexo.co.uk");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("1. cookie mutation + no Authorization stays Origin-protected", async () => {
    const blocked = await validateMutationOrigin(cookieMutation());
    expect(blocked?.status).toBe(403);
    expect(verifyBearerAccessToken).not.toHaveBeenCalled();
  });

  it("2. cookie mutation + valid Origin is allowed", async () => {
    expect(
      await validateMutationOrigin(
        cookieMutation({ origin: "https://www.rovexo.co.uk" }),
      ),
    ).toBeNull();
  });

  it("3. cookie mutation + invalid Origin is rejected", async () => {
    const blocked = await validateMutationOrigin(
      cookieMutation({ origin: "https://evil.example" }),
    );
    expect(blocked?.status).toBe(403);
  });

  it("4. cookie mutation + Authorization Bearer invalid is not exempt", async () => {
    verifyBearerAccessToken.mockResolvedValue(null);
    const blocked = await validateMutationOrigin(
      cookieMutation({ authorization: "Bearer invalid" }),
    );
    expect(blocked?.status).toBe(403);
    expect(verifyBearerAccessToken).toHaveBeenCalledWith("invalid");
  });

  it("5. cookie mutation + Authorization Bearer x is not exempt", async () => {
    verifyBearerAccessToken.mockResolvedValue(null);
    const blocked = await validateMutationOrigin(
      cookieMutation({ authorization: "Bearer x" }),
    );
    expect(blocked?.status).toBe(403);
    expect(verifyBearerAccessToken).toHaveBeenCalledWith("x");
  });

  it("6. cookie mutation + malformed Bearer is not exempt", async () => {
    const blocked = await validateMutationOrigin(
      cookieMutation({ authorization: "Bearer" }),
    );
    expect(blocked?.status).toBe(403);
    expect(verifyBearerAccessToken).not.toHaveBeenCalled();
    expect(
      readBearerAccessToken(cookieMutation({ authorization: "Basic abc" })),
    ).toBeNull();
    const basic = await validateMutationOrigin(
      cookieMutation({ authorization: "Basic abc" }),
    );
    expect(basic?.status).toBe(403);
  });

  it("7. verified Bearer receives the native CSRF exemption", async () => {
    verifyBearerAccessToken.mockResolvedValue({ id: USER_ID, email: "native@rovexo.co.uk" });
    expect(
      await validateMutationOrigin(
        new Request(API_URL, {
          method: "POST",
          headers: {
            host: "www.rovexo.co.uk",
            authorization: "Bearer valid-native-jwt",
            "content-type": "application/json",
          },
          body: JSON.stringify({ amount: 10 }),
        }),
      ),
    ).toBeNull();
    expect(verifyBearerAccessToken).toHaveBeenCalledWith("valid-native-jwt");
  });
});

describe("cookie-or-Bearer identity and privilege", () => {
  beforeEach(() => {
    verifyBearerAccessToken.mockReset();
    createVerifiedBearerUserClient.mockReset();
    requireApiAuth.mockReset();
    tryCreateAdminClient.mockReset();
    createVerifiedBearerUserClient.mockReturnValue(profileClient());
    tryCreateAdminClient.mockImplementation(() => {
      throw new Error("generic AuthContext must not use service-role");
    });
  });

  it("8. invalid Bearer fails closed without cookie fallback", async () => {
    verifyBearerAccessToken.mockResolvedValue(null);
    const auth = await requireCookieOrBearerApiAuth(
      cookieMutation({ authorization: "Bearer expired-native-jwt" }),
    );
    expect(auth).toBeInstanceOf(NextResponse);
    expect((auth as NextResponse).status).toBe(401);
    expect(requireApiAuth).not.toHaveBeenCalled();
    expect(createVerifiedBearerUserClient).not.toHaveBeenCalled();
  });

  it("9. Bearer AuthContext uses the user-scoped client, not service-role", async () => {
    verifyBearerAccessToken.mockResolvedValue({ id: USER_ID, email: "native@rovexo.co.uk" });
    const auth = await requireCookieOrBearerApiAuth(
      new Request(API_URL, {
        method: "GET",
        headers: { authorization: "Bearer valid-native-jwt" },
      }),
    );
    expect(auth).not.toBeInstanceOf(NextResponse);
    expect(tryCreateAdminClient).not.toHaveBeenCalled();
    expect(createVerifiedBearerUserClient).toHaveBeenCalledWith("valid-native-jwt");
    expect(requireApiAuth).not.toHaveBeenCalled();
  });

  it("10. cookie AuthContext still goes through requireApiAuth", async () => {
    requireApiAuth.mockResolvedValue(cookieAuth());
    const auth = await requireCookieOrBearerApiAuth(cookieMutation());
    expect(verifyBearerAccessToken).not.toHaveBeenCalled();
    expect(requireApiAuth).toHaveBeenCalledOnce();
    expect(auth).toEqual(cookieAuth());
    expect(createVerifiedBearerUserClient).not.toHaveBeenCalled();
  });

  it("11. valid cookie + valid Bearer keeps Bearer precedence", async () => {
    verifyBearerAccessToken.mockResolvedValue({ id: USER_B, email: "native@rovexo.co.uk" });
    const auth = await requireCookieOrBearerApiAuth(
      cookieMutation({ authorization: "Bearer valid-native-jwt" }),
    );
    expect(requireApiAuth).not.toHaveBeenCalled();
    expect(auth).not.toBeInstanceOf(NextResponse);
    if (auth instanceof NextResponse) return;
    expect(auth.user.id).toBe(USER_B);
    expect(auth.user.id).not.toBe(USER_ID);
  });

  it("12. authenticated identity is never taken from body or query", async () => {
    verifyBearerAccessToken.mockResolvedValue({ id: USER_ID, email: "native@rovexo.co.uk" });
    const auth = await requireCookieOrBearerApiAuth(
      new Request(`${API_URL}?userId=${USER_B}`, {
        method: "POST",
        headers: {
          host: "www.rovexo.co.uk",
          authorization: "Bearer valid-native-jwt",
          "content-type": "application/json",
        },
        body: JSON.stringify({ userId: USER_B, user_id: USER_B }),
      }),
    );
    expect(auth).not.toBeInstanceOf(NextResponse);
    if (auth instanceof NextResponse) return;
    expect(auth.user.id).toBe(USER_ID);
    expect(verifyBearerAccessToken).toHaveBeenCalledWith("valid-native-jwt");
  });
});
