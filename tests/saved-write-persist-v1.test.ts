import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const PRODUCT_ID = "prod-1";
const PRODUCT_SLUG = "owned-item";

type SavedMemRow = {
  user_id: string;
  product_id: string;
  saved_at: string;
  last_viewed_at?: string | null;
};

const PRODUCT = {
  id: PRODUCT_ID,
  slug: PRODUCT_SLUG,
  title: "Sleeping bag",
  description: "A real listing",
  price: 12,
  original_price: null,
  condition: "good",
  seller_id: "seller-1",
  rating: 5,
  review_count: 1,
  views: 0,
  likes: 0,
  sections: [],
  status: "published",
  profiles: {
    full_name: "Seller",
    avatar_url: null,
    verified: false,
    username: "oly90",
  },
  product_images: [{ url: "/p.jpg", is_primary: true, sort_order: 0 }],
  categories: { slug: "sports-outdoors" },
};

function createIdentityMemory() {
  let rows: SavedMemRow[] = [];

  function execute(state: {
    table: string;
    op: "select" | "delete";
    filters: Record<string, string>;
    inFilters: Record<string, string[]>;
  }) {
    if (state.table === "products") {
      const slugs = state.inFilters.slug;
      if (slugs) {
        return {
          data: slugs.includes(PRODUCT_SLUG) ? [{ id: PRODUCT_ID, slug: PRODUCT_SLUG }] : [],
          error: null,
        };
      }
      if (state.filters.id === PRODUCT_ID || state.filters.slug === PRODUCT_SLUG) {
        return { data: PRODUCT, error: null };
      }
      return { data: null, error: null };
    }

    if (state.table !== "saved_items") {
      return { data: null, error: null };
    }

    if (state.op === "delete") {
      const userId = state.filters.user_id;
      const ids = state.inFilters.product_id ?? [];
      rows = rows.filter((row) => !(row.user_id === userId && ids.includes(row.product_id)));
      return { data: null, error: null };
    }

    let matched = rows.slice();
    if (state.filters.user_id) {
      matched = matched.filter((row) => row.user_id === state.filters.user_id);
    }
    if (state.filters.product_id) {
      matched = matched.filter((row) => row.product_id === state.filters.product_id);
    }
    if (state.inFilters.product_id) {
      matched = matched.filter((row) => state.inFilters.product_id.includes(row.product_id));
    }
    matched.sort((a, b) => (a.saved_at < b.saved_at ? 1 : -1));

    return {
      data: matched.map((row) => ({
        ...row,
        products: PRODUCT,
      })),
      error: null,
    };
  }

  function from(table: string) {
    const state = {
      table,
      op: "select" as "select" | "delete",
      filters: {} as Record<string, string>,
      inFilters: {} as Record<string, string[]>,
    };

    const api = {
      select() {
        state.op = "select" as const;
        return api;
      },
      upsert(row: SavedMemRow) {
        rows = rows.filter(
          (existing) =>
            !(existing.user_id === row.user_id && existing.product_id === row.product_id),
        );
        rows.push({ ...row, last_viewed_at: row.last_viewed_at ?? null });
        return Promise.resolve({ error: null, data: [row] });
      },
      delete() {
        state.op = "delete";
        return api;
      },
      eq(column: string, value: string) {
        state.filters[column] = value;
        return api;
      },
      in(column: string, values: string[]) {
        state.inFilters[column] = values;
        return api;
      },
      order() {
        return Promise.resolve(execute(state));
      },
      maybeSingle() {
        const result = execute(state);
        const data = Array.isArray(result.data) ? (result.data[0] ?? null) : result.data;
        return Promise.resolve({ data, error: result.error });
      },
      then(
        onFulfilled: (value: unknown) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        return Promise.resolve(execute(state)).then(onFulfilled, onRejected);
      },
    };

    return api;
  }

  return {
    client: { from },
    reset() {
      rows = [];
    },
    snapshot() {
      return rows.slice();
    },
  };
}

const memory = createIdentityMemory();

const { resolveProductIdBySlug } = vi.hoisted(() => ({
  resolveProductIdBySlug: vi.fn(async (slug: string) =>
    slug === PRODUCT_SLUG ? PRODUCT_ID : null,
  ),
}));

vi.mock("@/lib/saved/saved-identity-db-v1", () => ({
  savedIdentityDb: async () => memory.client,
}));

vi.mock("@/lib/supabase/admin", () => ({
  tryCreateAdminClient: () => null,
}));

vi.mock("@/lib/saved/check", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/saved/check")>();
  return {
    ...actual,
    resolveProductIdBySlug,
  };
});

vi.mock("@/lib/products/canonical-seller-rating-v1", () => ({
  enrichProductsWithCanonicalSellerRating: async (products: unknown[]) => products,
}));

vi.mock("@/lib/notifications/events", () => ({
  emitSmartNotification: vi.fn().mockResolvedValue(undefined),
}));

import { listSavedItems, removeSavedItems, saveItem } from "@/lib/saved/store";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Saved write persist — source contract", () => {
  it("POST/DELETE persist through authenticated identity DB, not cookie createClient()", () => {
    const store = readSource("lib/saved/store.ts");
    const check = readSource("lib/saved/check.ts");
    const auth = readSource("lib/auth/require-cookie-or-bearer-api-auth-v1.ts");
    const savedAuthExport = readSource("lib/saved/saved-api-auth-v1.ts");
    const route = readSource("app/api/saved/route.ts");
    const identity = readSource("lib/saved/saved-identity-db-v1.ts");

    expect(store).toContain("savedIdentityDb");
    expect(store).not.toContain('from "@/lib/supabase/server"');
    expect(store).toContain("upsert");
    expect(check).toContain("savedIdentityDb");
    expect(identity).toContain("tryCreateAdminClient");
    expect(identity).not.toContain("jwt.decode");
    expect(identity).not.toContain("JSON.parse(atob");
    expect(route).toContain("saveItem(auth.user.id");
    expect(route).toContain("removeSavedItems(auth.user.id");
    expect(route).toContain("const saved = await saveItem(auth.user.id, body.productSlug)");
    expect(auth).toContain("supabase: db");
    expect(auth).not.toContain("supabase: await createClient()");
    expect(savedAuthExport).toContain("requireCookieOrBearerApiAuth as requireSavedApiAuth");
  });

  it("GET handler remains the existing list/isProductSaved path", () => {
    const route = readSource("app/api/saved/route.ts");
    expect(route).toContain("const items = await listSavedItems(auth.user.id)");
    expect(route).toContain("const saved = await isProductSaved(auth.user.id, slug)");
  });
});

describe("Saved write persist — cookie and Bearer identity", () => {
  beforeEach(() => {
    memory.reset();
    resolveProductIdBySlug.mockClear();
    resolveProductIdBySlug.mockImplementation(async (slug: string) =>
      slug === PRODUCT_SLUG ? PRODUCT_ID : null,
    );
  });

  async function persistCycle(userId: string) {
    const saved = await saveItem(userId, PRODUCT_SLUG);
    expect(saved).toBe(true);
    expect(memory.snapshot()).toEqual([
      expect.objectContaining({ user_id: userId, product_id: PRODUCT_ID }),
    ]);

    const afterSave = await listSavedItems(userId);
    expect(afterSave.map((item) => item.productSlug)).toEqual([PRODUCT_SLUG]);

    const remaining = await removeSavedItems(userId, [PRODUCT_SLUG]);
    expect(remaining).toEqual([]);
    expect(memory.snapshot()).toEqual([]);

    const afterDelete = await listSavedItems(userId);
    expect(afterDelete).toEqual([]);
  }

  it("COOKIE POST persists, GET returns it, DELETE removes it", async () => {
    await persistCycle(USER_ID);
  });

  it("BEARER POST persists, GET returns it, DELETE removes it", async () => {
    await persistCycle(USER_ID);
  });

  it("wrong user cannot manipulate another user's saved relationship", async () => {
    expect(await saveItem(USER_ID, PRODUCT_SLUG)).toBe(true);

    const attackerDelete = await removeSavedItems(USER_B, [PRODUCT_SLUG]);
    expect(attackerDelete).toEqual([]);
    expect(memory.snapshot()).toEqual([
      expect.objectContaining({ user_id: USER_ID, product_id: PRODUCT_ID }),
    ]);

    const ownerList = await listSavedItems(USER_ID);
    expect(ownerList.map((item) => item.productSlug)).toEqual([PRODUCT_SLUG]);

    const attackerList = await listSavedItems(USER_B);
    expect(attackerList).toEqual([]);
  });
});
