import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";

vi.mock("@/lib/auth/session", () => ({
  requireApiAuth: vi.fn(),
}));

type TokenRow = {
  user_id: string;
  token: string;
  provider: string;
  platform: string;
};

const store = vi.hoisted(() => ({
  rows: [] as TokenRow[],
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      if (table !== "push_device_tokens") {
        throw new Error(`unexpected table ${table}`);
      }
      return {
        delete() {
          const filters: Record<string, string> = {};
          const apply = async () => {
            for (let i = store.rows.length - 1; i >= 0; i -= 1) {
              const row = store.rows[i];
              if (filters.token && row.token !== filters.token) continue;
              if (filters.user_id && row.user_id !== filters.user_id) continue;
              if (filters.token || filters.user_id) store.rows.splice(i, 1);
            }
            return { error: null };
          };
          const chain = {
            eq(column: string, value: string) {
              filters[column] = value;
              return chain;
            },
            then(resolve: (value: { error: null }) => unknown, reject: (reason: unknown) => unknown) {
              return apply().then(resolve, reject);
            },
          };
          return chain;
        },
        async insert(row: TokenRow) {
          store.rows.push({ ...row });
          return { error: null };
        },
      };
    },
  }),
}));

const requireAuth = vi.mocked(requireApiAuth);
const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const TOKEN_A = "fcm-token-device-a-aaaaaaaaaaaaaaaa";
const TOKEN_B = "fcm-token-device-b-bbbbbbbbbbbbbbbb";

function authFor(userId: string) {
  return { user: { id: userId }, supabase: {}, role: "buyer" as const };
}

async function postRegister(body: unknown, headers?: HeadersInit) {
  const { POST } = await import("@/app/api/push/register/route");
  return POST(
    new Request("http://localhost:3000/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
  );
}

async function deleteRegister(body: unknown, headers?: HeadersInit) {
  const { DELETE } = await import("@/app/api/push/register/route");
  return DELETE(
    new Request("http://localhost:3000/api/push/register", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST/DELETE /api/push/register", () => {
  beforeEach(() => {
    store.rows.length = 0;
    requireAuth.mockReset();
  });

  it("returns 401 when unauthenticated on POST", async () => {
    requireAuth.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    const response = await postRegister({
      token: TOKEN_A,
      platform: "android",
      provider: "fcm",
    });
    expect(response.status).toBe(401);
    expect(store.rows).toHaveLength(0);
  });

  it("returns 400 for invalid body", async () => {
    requireAuth.mockResolvedValue(authFor(USER_A) as never);
    const response = await postRegister({ token: TOKEN_A });
    expect(response.status).toBe(400);
    expect(store.rows).toHaveLength(0);
  });

  it("returns 400 when token is missing", async () => {
    requireAuth.mockResolvedValue(authFor(USER_A) as never);
    const response = await postRegister({ platform: "android", provider: "fcm" });
    expect(response.status).toBe(400);
  });

  it("returns 400 for the wrong provider", async () => {
    requireAuth.mockResolvedValue(authFor(USER_A) as never);
    const response = await postRegister({
      token: TOKEN_A,
      platform: "android",
      provider: "vapid",
    });
    expect(response.status).toBe(400);
  });

  it("returns 400 for the wrong platform", async () => {
    requireAuth.mockResolvedValue(authFor(USER_A) as never);
    const response = await postRegister({
      token: TOKEN_A,
      platform: "web",
      provider: "fcm",
    });
    expect(response.status).toBe(400);
  });

  it("registers an authenticated Android FCM token", async () => {
    requireAuth.mockResolvedValue(authFor(USER_A) as never);
    const response = await postRegister({
      token: TOKEN_A,
      platform: "android",
      provider: "fcm",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(store.rows).toEqual([
      { user_id: USER_A, token: TOKEN_A, provider: "fcm", platform: "android" },
    ]);
    expect(requireAuth).toHaveBeenCalledWith(expect.any(Request));
  });

  it("is idempotent for the same user and token", async () => {
    requireAuth.mockResolvedValue(authFor(USER_A) as never);
    const body = { token: TOKEN_A, platform: "android", provider: "fcm" };
    expect((await postRegister(body)).status).toBe(200);
    expect((await postRegister(body)).status).toBe(200);
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]?.user_id).toBe(USER_A);
  });

  it("reassigns a token from another user", async () => {
    store.rows.push({ user_id: USER_B, token: TOKEN_A, provider: "fcm", platform: "android" });
    requireAuth.mockResolvedValue(authFor(USER_A) as never);
    const response = await postRegister({
      token: TOKEN_A,
      platform: "android",
      provider: "fcm",
    });
    expect(response.status).toBe(200);
    expect(store.rows).toEqual([
      { user_id: USER_A, token: TOKEN_A, provider: "fcm", platform: "android" },
    ]);
  });

  it("rejects a client-supplied userId", async () => {
    requireAuth.mockResolvedValue(authFor(USER_A) as never);
    const response = await postRegister({
      token: TOKEN_A,
      platform: "android",
      provider: "fcm",
      userId: USER_B,
    });
    expect(response.status).toBe(400);
    expect(store.rows).toHaveLength(0);
  });

  it("does not expose the raw token in the response", async () => {
    requireAuth.mockResolvedValue(authFor(USER_A) as never);
    const response = await postRegister({
      token: TOKEN_A,
      platform: "android",
      provider: "fcm",
    });
    const json = await response.json();
    expect(JSON.stringify(json)).not.toContain(TOKEN_A);
  });

  it("returns 401 when unauthenticated on DELETE", async () => {
    requireAuth.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    const response = await deleteRegister({ token: TOKEN_A });
    expect(response.status).toBe(401);
  });

  it("deletes only the authenticated user's token", async () => {
    store.rows.push(
      { user_id: USER_A, token: TOKEN_A, provider: "fcm", platform: "android" },
      { user_id: USER_B, token: TOKEN_B, provider: "fcm", platform: "android" },
    );
    requireAuth.mockResolvedValue(authFor(USER_A) as never);
    const response = await deleteRegister({ token: TOKEN_A });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(store.rows).toEqual([
      { user_id: USER_B, token: TOKEN_B, provider: "fcm", platform: "android" },
    ]);
  });

  it("does not delete another user's token", async () => {
    store.rows.push({ user_id: USER_B, token: TOKEN_B, provider: "fcm", platform: "android" });
    requireAuth.mockResolvedValue(authFor(USER_A) as never);
    const response = await deleteRegister({ token: TOKEN_B });
    expect(response.status).toBe(200);
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]?.user_id).toBe(USER_B);
  });

  it("treats repeated DELETE as success", async () => {
    requireAuth.mockResolvedValue(authFor(USER_A) as never);
    expect((await deleteRegister({ token: TOKEN_A })).status).toBe(200);
    const second = await deleteRegister({ token: TOKEN_A });
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toEqual({ success: true });
  });
});
