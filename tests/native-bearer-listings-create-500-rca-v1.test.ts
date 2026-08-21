import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";

const { createClient, tryCreateAdminClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
  tryCreateAdminClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClient(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  tryCreateAdminClient: () => tryCreateAdminClient(),
}));

import {
  getProfileCompletionStatus,
  resolveProfileCompletionRedirect,
} from "@/lib/account/profile-completion.server";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function sessionRequiredMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type CountRow = { count: number };

function scopedCountClient(counts: Record<string, number>, seen: Array<{ table: string; userKey: string; userId: string }>) {
  return {
    from(table: string) {
      const filters: Record<string, string> = {};
      const chain: {
        select: () => unknown;
        eq: (column: string, value: string) => unknown;
        in: () => unknown;
        then: Promise<CountRow>["then"];
      } = {
        select: () => chain,
        eq: (column: string, value: string) => {
          filters[column] = value;
          return chain;
        },
        in: () => chain,
        then: (onFulfilled, onRejected) => {
          const userKey =
            table === "orders" ? "buyer_id" : table === "products" ? "seller_id" : "user_id";
          seen.push({ table, userKey, userId: filters[userKey] ?? "" });
          return Promise.resolve({ count: counts[table] ?? 0 }).then(onFulfilled, onRejected);
        },
      };
      return chain;
    },
  };
}

function cookieClient(userId: string | null, counts: Record<string, number>, seen: Array<{ table: string; userKey: string; userId: string }>) {
  return {
    auth: {
      getUser: async () => ({
        data: { user: userId ? { id: userId } : null },
      }),
    },
    ...scopedCountClient(counts, seen),
  };
}

describe("Native Bearer POST /api/listings 500 RCA — profile completion", () => {
  beforeEach(() => {
    createClient.mockReset();
    tryCreateAdminClient.mockReset();
  });

  it("listings POST authenticates, then profile-completes, then createSellerListing", () => {
    const route = readSource("app/api/listings/route.ts");
    const post = route.slice(route.indexOf("export async function POST"));
    const authIdx = post.indexOf("requireCookieOrBearerListingRole");
    const gateIdx = post.indexOf("resolveProfileCompletionRedirect");
    const createIdx = post.indexOf("await createSellerListing");
    expect(authIdx).toBeGreaterThanOrEqual(0);
    expect(gateIdx).toBeGreaterThan(authIdx);
    expect(createIdx).toBeGreaterThan(gateIdx);
  });

  it("cookie-absent without mutation client still fails closed (no fake success)", async () => {
    const seen: Array<{ table: string; userKey: string; userId: string }> = [];
    createClient.mockResolvedValue(cookieClient(null, {}, seen));
    tryCreateAdminClient.mockReturnValue(null);

    await expect(getProfileCompletionStatus(USER_ID)).rejects.toThrow(
      "Profile completion requires an authenticated session for this user.",
    );
    expect(seen).toHaveLength(0);
  });

  it("cookie-absent Native Bearer with mutation client queries only the verified userId", async () => {
    const sessionSeen: Array<{ table: string; userKey: string; userId: string }> = [];
    const mutationSeen: Array<{ table: string; userKey: string; userId: string }> = [];
    createClient.mockResolvedValue(cookieClient(null, {}, sessionSeen));
    tryCreateAdminClient.mockReturnValue(
      scopedCountClient(
        {
          shipping_addresses: 1,
          payment_methods: 1,
          withdraw_methods: 1,
          orders: 0,
          products: 1,
        },
        mutationSeen,
      ),
    );

    const status = await getProfileCompletionStatus(USER_ID);
    expect(status.hasBankAccount).toBe(true);
    expect(status.hasPublishedListing).toBe(true);
    expect(sessionSeen).toHaveLength(0);
    expect(mutationSeen.length).toBeGreaterThan(0);
    expect(mutationSeen.every((row) => row.userId === USER_ID)).toBe(true);
  });

  it("publish gate does not throw ServerUnavailable for Native Bearer with an existing listing", async () => {
    createClient.mockResolvedValue(cookieClient(null, {}, []));
    tryCreateAdminClient.mockReturnValue(
      scopedCountClient(
        {
          shipping_addresses: 1,
          payment_methods: 1,
          withdraw_methods: 1,
          orders: 0,
          products: 1,
        },
        [],
      ),
    );

    await expect(resolveProfileCompletionRedirect(USER_ID, "publish", "/sell")).resolves.toBeNull();
  });

  it("cookie session mismatch still fails closed", async () => {
    createClient.mockResolvedValue(cookieClient(OTHER_ID, {}, []));
    tryCreateAdminClient.mockReturnValue(scopedCountClient({}, []));

    await expect(getProfileCompletionStatus(USER_ID)).rejects.toThrow(
      "Profile completion requires an authenticated session for this user.",
    );
    expect(tryCreateAdminClient).not.toHaveBeenCalled();
  });

  it("matching cookie session uses the cookie client, not admin", async () => {
    const sessionSeen: Array<{ table: string; userKey: string; userId: string }> = [];
    createClient.mockResolvedValue(
      cookieClient(
        USER_ID,
        {
          shipping_addresses: 1,
          payment_methods: 1,
          withdraw_methods: 1,
          orders: 0,
          products: 0,
        },
        sessionSeen,
      ),
    );
    tryCreateAdminClient.mockReturnValue(scopedCountClient({}, []));

    const status = await getProfileCompletionStatus(USER_ID);
    expect(status.hasBankAccount).toBe(true);
    expect(tryCreateAdminClient).not.toHaveBeenCalled();
    expect(sessionSeen.every((row) => row.userId === USER_ID)).toBe(true);
  });

  it("F. first-publish without bank returns the existing 428 redirect, not a session 500", async () => {
    createClient.mockResolvedValue(cookieClient(null, {}, []));
    tryCreateAdminClient.mockReturnValue(
      scopedCountClient(
        {
          shipping_addresses: 0,
          payment_methods: 0,
          withdraw_methods: 0,
          orders: 0,
          products: 0,
        },
        [],
      ),
    );

    await expect(resolveProfileCompletionRedirect(USER_ID, "publish", "/sell")).resolves.toBe(
      "/wallet/bank-accounts?returnTo=%2Fsell",
    );
  });

  it("does not swallow the session-required error into a fake success", async () => {
    createClient.mockResolvedValue(cookieClient(null, {}, []));
    tryCreateAdminClient.mockReturnValue(null);

    try {
      await getProfileCompletionStatus(USER_ID);
      throw new Error("expected throw");
    } catch (error) {
      expect(sessionRequiredMessage(error)).toBe(
        "Profile completion requires an authenticated session for this user.",
      );
    }
  });
});

describe("Native Bearer createSellerListing post-insert load", () => {
  it("getSellerListingById uses listingMutationClient when cookie user is absent", () => {
    const repo = readSource("lib/listings/repository.ts");
    const start = repo.indexOf("export async function getSellerListingById");
    const end = repo.indexOf("\nexport async function createSellerListing", start);
    const slice = repo.slice(start, end > start ? end : undefined);
    expect(slice).toContain("listingMutationClient()");
    expect(slice).toContain("user?.id === ownerId");
    expect(slice).toContain('.eq("seller_id", ownerId)');
  });

  it("createSellerListing still throws when the listing cannot be loaded", () => {
    const repo = readSource("lib/listings/repository.ts");
    const start = repo.indexOf("export async function createSellerListing");
    const end = repo.indexOf("\nexport async function updateSellerListing", start);
    const slice = repo.slice(start, end > start ? end : undefined);
    expect(slice).toContain("getSellerListingById(input.sellerId, product.id)");
    expect(slice).toContain("Listing created but could not be loaded.");
  });
});
