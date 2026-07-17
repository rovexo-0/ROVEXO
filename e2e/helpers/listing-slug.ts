import type { APIRequestContext, Page } from "@playwright/test";
import { loadDotEnvFiles } from "../../scripts/playwright-env.mjs";
import { createAdminClient } from "../../lib/supabase/admin";
import { assertE2eUserDeletable } from "./full-demo-safety";
import type { ProductSection } from "../../lib/products/types";

loadDotEnvFiles();

type SlugCarrier = { slug?: string | null };
type ProductsApiResponse = { items?: SlugCarrier[] };
type SearchResultsApiResponse = { items?: SlugCarrier[] };
type SearchApiResponse = { products?: SlugCarrier[] };

export type ResolvedListingSlug = {
  slug: string;
  cleanup: () => Promise<void>;
};

const PRODUCT_SECTIONS: ProductSection[] = ["popular", "new", "recommended", "trending"];

function hasRealSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim() || "";
  return Boolean(url && serviceKey && !url.includes("placeholder.supabase.co"));
}

function pickSlug(items: SlugCarrier[] | undefined): string | null {
  const slug = items?.find((item) => item.slug?.trim())?.slug?.trim();
  return slug ?? null;
}

function extractSlugFromListingUrl(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(/\/listing\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function extractSlugFromJsonLd(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as {
      mainEntity?: { itemListElement?: Array<{ url?: string }> };
    };
    for (const element of parsed.mainEntity?.itemListElement ?? []) {
      const slug = extractSlugFromListingUrl(element.url);
      if (slug) return slug;
    }
  } catch {
    // ignore malformed JSON-LD blocks
  }
  return null;
}

/** Priority 2 — search results APIs. */
async function slugFromSearchApi(request: APIRequestContext): Promise<string | null> {
  const endpoints = [
    "/api/search/results?page=1",
    "/api/search/results?q=a&page=1",
    "/api/search?q=phone&limit=8",
    "/api/search?q=furniture&limit=8",
    "/api/search?q=car&limit=8",
  ];

  for (const path of endpoints) {
    const response = await request.get(path);
    if (!response.ok()) continue;

    const body = (await response.json()) as SearchResultsApiResponse & SearchApiResponse;
    const slug = pickSlug(body.items ?? body.products);
    if (slug) return slug;
  }

  return null;
}

/** Priority 3 — slug embedded in homepage JSON-LD product list. */
async function slugFromHomepageDocument(request: APIRequestContext): Promise<string | null> {
  const response = await request.get("/");
  if (!response.ok()) return null;

  const html = await response.text();
  const jsonLdBlocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];

  for (const block of jsonLdBlocks) {
    const slug = extractSlugFromJsonLd(block[1]?.trim() ?? "");
    if (slug) return slug;
  }

  for (const match of html.matchAll(/\/listing\/([a-z0-9-]+)/gi)) {
    const slug = match[1]?.trim();
    if (slug && !slug.includes("{{")) return slug;
  }

  return null;
}

/** Priority 3b — slug from search results rendered after client fetch. */
async function slugFromSearchResultsPage(page: Page): Promise<string | null> {
  const responsePromise = page
    .waitForResponse(
      (response) =>
        response.url().includes("/api/search/results") &&
        response.request().method() === "GET" &&
        response.ok(),
      { timeout: 20_000 },
    )
    .catch(() => null);

  await page.goto("/search?q=a", { waitUntil: "domcontentloaded" });
  const response = await responsePromise;
  if (!response) return null;

  const body = (await response.json()) as SearchResultsApiResponse;
  return pickSlug(body.items);
}

/** Priority 3c — slug from rendered listing cards on the homepage. */
async function slugFromHomepageCards(page: Page): Promise<string | null> {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const card = page.locator('[data-listing-card-version="rovexo-v1"], [data-listing-card-version="2026"]').first();
  if ((await card.count()) === 0) return null;

  const title = (await card.getAttribute("aria-label"))?.trim();
  if (!title) return null;

  return slugFromSearchApi(page.request).then(async (slug) => {
    if (slug) return slug;
    const response = await page.request.get(`/api/search?q=${encodeURIComponent(title)}&limit=8`);
    if (!response.ok()) return null;
    const body = (await response.json()) as SearchApiResponse;
    return pickSlug(body.products);
  });
}

async function slugFromAdminCatalog(): Promise<string | null> {
  if (!hasRealSupabaseConfig()) return null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("products")
      .select("slug")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data?.length) return null;
    return data[0]?.slug?.trim() ?? null;
  } catch {
    return null;
  }
}

type TempListingSeed = {
  slug: string;
  productId: string;
  sellerId: string;
  deleteSeller: boolean;
};

async function findExistingSellerId(admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
  const { data } = await admin
    .from("profiles")
    .select("id")
    .in("role", ["seller", "business", "admin"])
    .eq("account_status", "active")
    .limit(1);

  return data?.[0]?.id ?? null;
}

function formatSupabaseError(error: unknown): string {
  if (!error) return "unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/** Priority 4 — insert a temporary published listing when the catalog is empty. */
async function seedTemporaryListing(): Promise<TempListingSeed> {
  if (!hasRealSupabaseConfig()) {
    throw new Error(
      "No published listings found and Supabase is not configured for E2E seeding. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local, or seed at least one published listing.",
    );
  }

  const admin = createAdminClient();
  const idSeed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const slug = `e2e-alias-${idSeed}`;
  let sellerId = await findExistingSellerId(admin);
  let deleteSeller = false;

  if (!sellerId) {
    const email = `support+e2e-alias-${idSeed}@rovexo.co.uk`;
    const password = `Testpass!${idSeed}`;
    const username = `e2e_alias_${idSeed.replace(/-/g, "").slice(0, 16)}`;

    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { username, full_name: "E2E Alias Seller", role: "seller" },
      email_confirm: true,
    });

    if (userError || !userData.user) {
      throw new Error(
        `Failed to create temporary seller for alias test: ${formatSupabaseError(userError)}`,
      );
    }

    sellerId = userData.user.id;
    deleteSeller = true;

    await admin.from("profiles").upsert(
      {
        id: sellerId,
        email,
        username,
        full_name: "E2E Alias Seller",
        role: "seller",
        verified: true,
        account_status: "active",
      },
      { onConflict: "id" },
    );

    await admin.from("seller_profiles").upsert({ id: sellerId }, { onConflict: "id" });
  }

  const title = `E2E alias redirect ${idSeed}`;
  const { data: product, error: productError } = await admin
    .from("products")
    .insert({
      seller_id: sellerId,
      slug,
      title,
      description: "Temporary listing created by Playwright for /item alias redirect coverage.",
      condition: "good",
      price: 24.99,
      accept_offers: false,
      delivery_carriers: ["Royal Mail"],
      status: "published",
      stock: 1,
      sections: ["popular", "new"],
      listing_type: "fixed",
      moderation_status: "approved",
    })
    .select("id")
    .single();

  if (productError || !product) {
    if (deleteSeller) {
      await assertE2eUserDeletable(admin, sellerId).catch(() => undefined);
      await admin.auth.admin.deleteUser(sellerId).catch(() => undefined);
    }
    throw new Error(`Failed to create temporary listing for alias test: ${formatSupabaseError(productError)}`);
  }

  await admin.from("product_images").insert({
    product_id: product.id,
    url: "/icons/categories/electronics.svg",
    storage_path: `${sellerId}/e2e-alias-placeholder.png`,
    sort_order: 0,
    is_primary: true,
  });

  return { slug, productId: product.id, sellerId, deleteSeller };
}

async function deleteTemporaryListing(seed: TempListingSeed): Promise<void> {
  if (!hasRealSupabaseConfig()) return;

  const admin = createAdminClient();

  try {
    await admin.from("product_images").delete().eq("product_id", seed.productId);
    await admin.from("products").delete().eq("id", seed.productId);

    if (seed.deleteSeller) {
      await assertE2eUserDeletable(admin, seed.sellerId);
      await admin.from("seller_profiles").delete().eq("id", seed.sellerId);
      await admin.from("profiles").delete().eq("id", seed.sellerId);
      await admin.auth.admin.deleteUser(seed.sellerId);
    }
  } catch {
    // best-effort cleanup
  }
}

export async function listingPageStatus(request: APIRequestContext, slug: string): Promise<number> {
  const response = await request.get(`/listing/${encodeURIComponent(slug)}`);
  return response.status();
}

async function firstResolvableSlug(
  request: APIRequestContext,
  slugs: Array<string | null | undefined>,
): Promise<string | null> {
  const seen = new Set<string>();

  for (const candidate of slugs) {
    const slug = candidate?.trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    if ((await listingPageStatus(request, slug)) === 200) {
      return slug;
    }
  }

  return null;
}

async function collectSlugCandidates(
  request: APIRequestContext,
  page?: Page,
): Promise<string[]> {
  const candidates: string[] = [];

  for (const section of PRODUCT_SECTIONS) {
    const response = await request.get(`/api/products?section=${section}&page=1`);
    if (!response.ok()) continue;
    const body = (await response.json()) as ProductsApiResponse;
    for (const item of body.items ?? []) {
      if (item.slug?.trim()) candidates.push(item.slug.trim());
    }
  }

  const searchEndpoints = [
    "/api/search/results?page=1",
    "/api/search/results?q=a&page=1",
    "/api/search?q=phone&limit=8",
    "/api/search?q=furniture&limit=8",
    "/api/search?q=car&limit=8",
  ];

  for (const path of searchEndpoints) {
    const response = await request.get(path);
    if (!response.ok()) continue;
    const body = (await response.json()) as SearchResultsApiResponse & SearchApiResponse;
    for (const item of body.items ?? body.products ?? []) {
      if (item.slug?.trim()) candidates.push(item.slug.trim());
    }
  }

  const homepageSlug = await slugFromHomepageDocument(request);
  if (homepageSlug) candidates.push(homepageSlug);

  const adminSlug = await slugFromAdminCatalog();
  if (adminSlug) candidates.push(adminSlug);

  if (page) {
    const cardSlug = await slugFromHomepageCards(page);
    if (cardSlug) candidates.push(cardSlug);
    const searchSlug = await slugFromSearchResultsPage(page);
    if (searchSlug) candidates.push(searchSlug);
  }

  return candidates;
}

/**
 * Resolve a published listing slug for E2E without hardcoding.
 * Falls back to temporary seeded data when the catalog is empty.
 */
export async function resolveListingSlugForE2E(
  request: APIRequestContext,
  page?: Page,
): Promise<ResolvedListingSlug> {
  const slug = await firstResolvableSlug(request, await collectSlugCandidates(request, page));

  if (slug) {
    return { slug, cleanup: async () => {} };
  }

  const seed = await seedTemporaryListing();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    if ((await listingPageStatus(request, seed.slug)) === 200) {
      return {
        slug: seed.slug,
        cleanup: async () => deleteTemporaryListing(seed),
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return {
    slug: seed.slug,
    cleanup: async () => deleteTemporaryListing(seed),
  };
}

export function escapeSlugForRegExp(slug: string): string {
  return slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
