import type { APIRequestContext, Page } from "@playwright/test";
import { loadDotEnvFiles } from "../../scripts/playwright-env.mjs";
import { createAdminClient } from "../../lib/supabase/admin";
import { resolveOrCreateCategoryIdBySlugPath } from "@/lib/categories/server";
import { resolveListingSlugForE2E } from "./listing-slug";

loadDotEnvFiles();

export type TransactionModeFixture = {
  marketplaceSlug: string;
  directContactSlug: string;
  cleanup: () => Promise<void>;
};

export type ListingUiFixture = {
  slug: string;
  cleanup: () => Promise<void>;
};

function hasRealSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim() || "";
  return Boolean(url && serviceKey && !url.includes("placeholder.supabase.co"));
}

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

async function ensureSeller(admin: ReturnType<typeof createAdminClient>) {
  const existing = await findExistingSellerId(admin);
  if (existing) {
    return { sellerId: existing, deleteSeller: false };
  }

  const idSeed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `support+e2e-txm-${idSeed}@rovexo.co.uk`;
  const password = `Testpass!${idSeed}`;
  const username = `e2e_txm_${idSeed.replace(/-/g, "").slice(0, 12)}`;

  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    user_metadata: { username, full_name: "E2E TXM Seller", role: "seller" },
    email_confirm: true,
  });

  if (userError || !userData.user) {
    throw new Error(`Failed to create E2E seller: ${formatSupabaseError(userError)}`);
  }

  const sellerId = userData.user.id;

  await admin.from("profiles").upsert(
    {
      id: sellerId,
      email,
      username,
      full_name: "E2E TXM Seller",
      role: "seller",
      verified: true,
      account_status: "active",
    },
    { onConflict: "id" },
  );

  await admin.from("seller_profiles").upsert({ id: sellerId }, { onConflict: "id" });

  return { sellerId, deleteSeller: true };
}

async function insertListing(input: {
  admin: ReturnType<typeof createAdminClient>;
  sellerId: string;
  slug: string;
  title: string;
  categoryId: string | null;
}) {
  const { data: product, error } = await input.admin
    .from("products")
    .insert({
      seller_id: input.sellerId,
      slug: input.slug,
      title: input.title,
      description: "Transaction mode certification listing.",
      condition: "good",
      price: 499.99,
      accept_offers: false,
      delivery_carriers: ["Royal Mail"],
      status: "published",
      stock: 1,
      sections: ["popular"],
      listing_type: "fixed",
      moderation_status: "approved",
      category_id: input.categoryId,
    })
    .select("id")
    .single();

  if (error || !product) {
    throw new Error(`Failed to seed listing ${input.slug}: ${formatSupabaseError(error)}`);
  }

  await input.admin.from("product_images").insert({
    product_id: product.id,
    url: "/icons/categories/electronics.svg",
    storage_path: `${input.sellerId}/${input.slug}.png`,
    sort_order: 0,
    is_primary: true,
  });

  return product.id as string;
}

export function canRunTransactionModeE2E(): boolean {
  return hasRealSupabaseConfig();
}

export async function seedTransactionModeFixtures(): Promise<TransactionModeFixture> {
  if (!hasRealSupabaseConfig()) {
    throw new Error("Supabase is required for transaction mode E2E fixtures.");
  }

  const admin = createAdminClient();
  const idSeed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const { sellerId, deleteSeller } = await ensureSeller(admin);

  const marketplaceCategoryId = await resolveOrCreateCategoryIdBySlugPath([
    "electronics",
    "audio",
    "headphones",
  ]);
  const directCategoryId = await resolveOrCreateCategoryIdBySlugPath([
    "vehicles",
    "cars",
    "hatchback",
  ]);

  const marketplaceSlug = `e2e-txm-market-${idSeed}`;
  const directContactSlug = `e2e-txm-direct-${idSeed}`;

  const marketplaceProductId = await insertListing({
    admin,
    sellerId,
    slug: marketplaceSlug,
    title: `E2E Marketplace TXM ${idSeed}`,
    categoryId: marketplaceCategoryId,
  });

  const directProductId = await insertListing({
    admin,
    sellerId,
    slug: directContactSlug,
    title: `E2E Direct Contact TXM ${idSeed}`,
    categoryId: directCategoryId,
  });

  return {
    marketplaceSlug,
    directContactSlug,
    cleanup: async () => {
      try {
        await admin.from("product_images").delete().in("product_id", [marketplaceProductId, directProductId]);
        await admin.from("products").delete().in("id", [marketplaceProductId, directProductId]);
        if (deleteSeller) {
          await admin.from("seller_profiles").delete().eq("id", sellerId);
          await admin.from("profiles").delete().eq("id", sellerId);
          await admin.auth.admin.deleteUser(sellerId);
        }
      } catch {
        // best-effort
      }
    },
  };
}

/** Reassign an existing published listing to a target category for UI certification. */
export async function assignListingCategoryForUi(
  request: APIRequestContext,
  page: Page | undefined,
  targetCategorySlugs: string[],
): Promise<ListingUiFixture | null> {
  if (!hasRealSupabaseConfig()) return null;

  const resolved = await resolveListingSlugForE2E(request, page);
  const admin = createAdminClient();

  const { data: product } = await admin
    .from("products")
    .select("id, category_id")
    .eq("slug", resolved.slug)
    .maybeSingle();

  if (!product?.id) return null;

  const nextCategoryId = await resolveOrCreateCategoryIdBySlugPath(targetCategorySlugs);
  if (!nextCategoryId) return null;

  const previousCategoryId = product.category_id as string | null;

  await admin.from("products").update({ category_id: nextCategoryId }).eq("id", product.id);

  return {
    slug: resolved.slug,
    cleanup: async () => {
      await admin.from("products").update({ category_id: previousCategoryId }).eq("id", product.id);
      await resolved.cleanup();
    },
  };
}

export async function waitForListingPage(
  request: APIRequestContext,
  slug: string,
  attempts = 20,
): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    const response = await request.get(`/listing/${encodeURIComponent(slug)}`, {
      headers: { "Cache-Control": "no-cache" },
    });
    if (response.status() === 200) {
      const html = await response.text();
      if (!html.includes("Page not found")) return;
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  throw new Error(`Listing page did not become available for slug "${slug}".`);
}
