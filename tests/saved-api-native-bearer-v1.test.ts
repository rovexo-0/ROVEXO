import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateMutationOrigin } from "@/lib/api/csrf-guard";
import {
  readBearerAccessToken,
  requestHasSupabaseAuthCookie,
} from "@/lib/auth/verify-bearer-access-token-v1";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const SAVED_URL = "https://www.rovexo.co.uk/api/saved";

const {
  verifyBearerAccessToken,
  createVerifiedBearerUserClient,
  requireApiAuth,
  tryCreateAdminClient,
  createClient,
  listSavedItems,
  saveItem,
  removeSavedItems,
  isProductSaved,
  enforceRateLimitForUser,
} = vi.hoisted(() => ({
  verifyBearerAccessToken: vi.fn(),
  createVerifiedBearerUserClient: vi.fn(),
  requireApiAuth: vi.fn(),
  tryCreateAdminClient: vi.fn(),
  createClient: vi.fn(),
  listSavedItems: vi.fn(),
  saveItem: vi.fn(),
  removeSavedItems: vi.fn(),
  isProductSaved: vi.fn(),
  enforceRateLimitForUser: vi.fn(),
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

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClient(),
}));

vi.mock("@/lib/saved/store", () => ({
  listSavedItems,
  saveItem,
  removeSavedItems,
}));

vi.mock("@/lib/saved/check", () => ({
  isProductSaved,
}));

vi.mock("@/lib/api/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/rate-limit")>();
  return {
    ...actual,
    enforceRateLimitForUser,
  };
});

import { requireSavedApiAuth } from "@/lib/saved/saved-api-auth-v1";
import { GET, POST, DELETE } from "@/app/api/saved/route";

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

function cookieAuth() {
  return {
    supabase: {},
    user: { id: USER_ID, email: "web@rovexo.co.uk" },
    role: "buyer" as const,
  };
}

function nativeUser(id = USER_ID) {
  return { id, email: "native@rovexo.co.uk" };
}

function cookieRequest(method: string, body?: unknown) {
  return new Request(SAVED_URL, {
    method,
    headers: {
      host: "www.rovexo.co.uk",
      origin: "https://www.rovexo.co.uk",
      cookie: "sb-pklotmwxtnnepaitedic-auth-token.0=cookie-session",
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function bearerRequest(method: string, token: string, body?: unknown, extra: HeadersInit = {}) {
  return new Request(SAVED_URL, {
    method,
    headers: {
      host: "www.rovexo.co.uk",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...Object.fromEntries(new Headers(extra).entries()),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("verifyBearerAccessToken helpers", () => {
  it("reads Native Authorization Bearer tokens and ignores missing/invalid prefixes", () => {
    expect(
      readBearerAccessToken(
        new Request(SAVED_URL, {
          headers: { authorization: "Bearer native-access-token" },
        }),
      ),
    ).toBe("native-access-token");
    expect(readBearerAccessToken(new Request(SAVED_URL))).toBeNull();
    expect(
      readBearerAccessToken(
        new Request(SAVED_URL, { headers: { authorization: "Basic abc" } }),
      ),
    ).toBeNull();
  });

  it("detects Supabase auth cookies without treating Native as cookie-auth", () => {
    expect(
      requestHasSupabaseAuthCookie(
        new Request(SAVED_URL, {
          headers: { cookie: "sb-pklotmwxtnnepaitedic-auth-token.0=abc" },
        }),
      ),
    ).toBe(true);
    expect(requestHasSupabaseAuthCookie(new Request(SAVED_URL))).toBe(false);
  });

  it("verifies Bearer via supabase.auth.getUser(accessToken) and never decodes JWT locally", () => {
    const verify = readFileSync(
      join(process.cwd(), "lib/auth/verify-bearer-access-token-v1.ts"),
      "utf8",
    );
    expect(verify).toContain("supabase.auth.getUser(accessToken)");
    expect(verify).not.toContain("jwt.decode");
    expect(verify).not.toContain("JSON.parse(atob");
    const saved = readFileSync(join(process.cwd(), "app/api/saved/route.ts"), "utf8");
    expect(saved).toContain("requireSavedApiAuth");
    expect(saved).toContain("requireSavedApiAuth(request)");
    expect(saved).not.toContain("requireApiAuth(");
  });
});

describe("Saved CSRF cookie vs Bearer", () => {
  it("cookie POST/DELETE without valid Origin stay protected", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.rovexo.co.uk");

    const post = await validateMutationOrigin(
      new Request(SAVED_URL, {
        method: "POST",
        headers: { host: "www.rovexo.co.uk" },
      }),
    );
    expect(post?.status).toBe(403);

    const del = await validateMutationOrigin(
      new Request(SAVED_URL, {
        method: "DELETE",
        headers: { host: "www.rovexo.co.uk", origin: "https://evil.example" },
      }),
    );
    expect(del?.status).toBe(403);
    vi.unstubAllEnvs();
  });

  it("verified Bearer POST/DELETE do not require browser Origin CSRF", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.rovexo.co.uk");
    verifyBearerAccessToken.mockResolvedValue(nativeUser());

    expect(
      await validateMutationOrigin(
        bearerRequest("POST", "valid-native-jwt", { productSlug: "item" }),
      ),
    ).toBeNull();
    expect(
      await validateMutationOrigin(bearerRequest("DELETE", "valid-native-jwt", { productSlugs: ["item"] })),
    ).toBeNull();
    vi.unstubAllEnvs();
  });

  it("unverified Bearer POST does not skip Origin CSRF", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.rovexo.co.uk");
    verifyBearerAccessToken.mockResolvedValue(null);

    const blocked = await validateMutationOrigin(bearerRequest("POST", "x", { productSlug: "item" }));
    expect(blocked?.status).toBe(403);
    vi.unstubAllEnvs();
  });
});

describe("requireSavedApiAuth cookie vs Bearer", () => {
  beforeEach(() => {
    verifyBearerAccessToken.mockReset();
    createVerifiedBearerUserClient.mockReset();
    requireApiAuth.mockReset();
    tryCreateAdminClient.mockReset();
    createClient.mockReset();
    createVerifiedBearerUserClient.mockReturnValue(profileClient("buyer"));
    tryCreateAdminClient.mockReturnValue(profileClient("buyer"));
    createClient.mockResolvedValue(profileClient("buyer"));
  });

  it("valid web cookie uses requireApiAuth and does not call getUser(jwt)", async () => {
    requireApiAuth.mockResolvedValue(cookieAuth());
    const auth = await requireSavedApiAuth(cookieRequest("GET"));
    expect(verifyBearerAccessToken).not.toHaveBeenCalled();
    expect(requireApiAuth).toHaveBeenCalledOnce();
    expect(auth).not.toBeInstanceOf(NextResponse);
    if (auth instanceof NextResponse) return;
    expect(auth.user.id).toBe(USER_ID);
  });

  it("valid Native Bearer authenticates without cookies", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const auth = await requireSavedApiAuth(bearerRequest("GET", "valid-native-jwt"));
    expect(requireApiAuth).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
    expect(verifyBearerAccessToken).toHaveBeenCalledWith("valid-native-jwt");
    expect(auth).not.toBeInstanceOf(NextResponse);
    if (auth instanceof NextResponse) return;
    expect(auth.user.id).toBe(USER_ID);
  });

  it("missing authentication is 401", async () => {
    requireApiAuth.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    const auth = await requireSavedApiAuth(new Request(SAVED_URL, { method: "GET" }));
    expect(verifyBearerAccessToken).not.toHaveBeenCalled();
    expect((auth as NextResponse).status).toBe(401);
  });

  it("invalid Bearer is 401", async () => {
    verifyBearerAccessToken.mockResolvedValue(null);
    const auth = await requireSavedApiAuth(bearerRequest("GET", "expired-native-jwt"));
    expect(auth).toBeInstanceOf(NextResponse);
    expect((auth as NextResponse).status).toBe(401);
    expect(requireApiAuth).not.toHaveBeenCalled();
  });
});

describe("/api/saved cookie and Bearer handlers", () => {
  beforeEach(() => {
    verifyBearerAccessToken.mockReset();
    createVerifiedBearerUserClient.mockReset();
    requireApiAuth.mockReset();
    tryCreateAdminClient.mockReset();
    createClient.mockReset();
    listSavedItems.mockReset();
    saveItem.mockReset();
    removeSavedItems.mockReset();
    isProductSaved.mockReset();
    enforceRateLimitForUser.mockReset();
    createVerifiedBearerUserClient.mockReturnValue(profileClient("buyer"));
    tryCreateAdminClient.mockReturnValue(profileClient("buyer"));
    createClient.mockResolvedValue(profileClient("buyer"));
    enforceRateLimitForUser.mockResolvedValue(null);
    listSavedItems.mockResolvedValue([{ productSlug: "owned-item" }]);
    saveItem.mockResolvedValue(true);
    removeSavedItems.mockResolvedValue([]);
    isProductSaved.mockResolvedValue(true);
  });

  it("COOKIE GET saved = 200", async () => {
    requireApiAuth.mockResolvedValue(cookieAuth());
    const response = await GET(cookieRequest("GET"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [{ productSlug: "owned-item" }] });
    expect(listSavedItems).toHaveBeenCalledWith(USER_ID);
    expect(listSavedItems).not.toHaveBeenCalledWith(USER_B);
  });

  it("COOKIE POST saved = success", async () => {
    requireApiAuth.mockResolvedValue(cookieAuth());
    const response = await POST(cookieRequest("POST", { productSlug: "owned-item" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ saved: true });
    expect(saveItem).toHaveBeenCalledWith(USER_ID, "owned-item");
  });

  it("POST does not report saved when the write did not persist", async () => {
    requireApiAuth.mockResolvedValue(cookieAuth());
    saveItem.mockResolvedValue(false);
    const response = await POST(cookieRequest("POST", { productSlug: "owned-item" }));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Unable to save item." });
  });

  it("COOKIE DELETE saved = success", async () => {
    requireApiAuth.mockResolvedValue(cookieAuth());
    const response = await DELETE(cookieRequest("DELETE", { productSlugs: ["owned-item"] }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [] });
    expect(removeSavedItems).toHaveBeenCalledWith(USER_ID, ["owned-item"]);
  });

  it("BEARER GET saved = 200", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const response = await GET(bearerRequest("GET", "valid-native-jwt"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [{ productSlug: "owned-item" }] });
    expect(listSavedItems).toHaveBeenCalledWith(USER_ID);
    expect(requireApiAuth).not.toHaveBeenCalled();
  });

  it("BEARER POST saved = success without Origin", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const response = await POST(bearerRequest("POST", "valid-native-jwt", { productSlug: "owned-item" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ saved: true });
    expect(saveItem).toHaveBeenCalledWith(USER_ID, "owned-item");
    expect(requireApiAuth).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("BEARER DELETE saved = success without Origin", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const response = await DELETE(
      bearerRequest("DELETE", "valid-native-jwt", { productSlugs: ["owned-item"] }),
    );
    expect(response.status).toBe(200);
    expect(removeSavedItems).toHaveBeenCalledWith(USER_ID, ["owned-item"]);
    expect(requireApiAuth).not.toHaveBeenCalled();
  });

  it("missing auth = 401", async () => {
    requireApiAuth.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    const response = await GET(new Request(SAVED_URL, { method: "GET" }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(listSavedItems).not.toHaveBeenCalled();
  });

  it("invalid Bearer = 401", async () => {
    verifyBearerAccessToken.mockResolvedValue(null);
    const response = await POST(bearerRequest("POST", "expired-native-jwt", { productSlug: "owned-item" }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(saveItem).not.toHaveBeenCalled();
  });

  it("authenticated user may only mutate their own saved relationships", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser(USER_ID));
    await POST(
      bearerRequest("POST", "valid-native-jwt", {
        productSlug: "owned-item",
        userId: USER_B,
      }),
    );
    expect(saveItem).toHaveBeenCalledTimes(1);
    expect(saveItem).toHaveBeenCalledWith(USER_ID, "owned-item");
    expect(saveItem.mock.calls[0][0]).not.toBe(USER_B);
  });
});
