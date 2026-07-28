import { HomepageEligibility } from "@/lib/homepage/homepage-eligibility";
import { getDemoAdminClient, hasDemoEnvironmentConfig } from "@/lib/demo-environment/guards";
import { isExternalPlaceholderImageUrl } from "@/lib/media/official-demo-images";
import { isForbiddenMarketplaceInventory } from "@/lib/listings/forbidden-marketplace-inventory";

type ListingRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  seller_id: string;
  price: number;
  category_id: string | null;
  moderation_status: string | null;
  profiles: {
    email: string | null;
    username: string | null;
    verified: boolean | null;
    account_status: string | null;
    role: string | null;
  } | null;
  product_images: Array<{ id: string; url: string | null }> | null;
};

function isForbiddenInventorySlug(
  slug: string,
  title: string,
  description?: string | null,
): boolean {
  return isForbiddenMarketplaceInventory({ slug, title, description });
}

/**
 * Absolute Law v5.0 — pause forbidden inventory. Never polish or re-publish demos.
 */
export async function runHomepageDemoCleanup(): Promise<{
  paused: number;
  polished: number;
  imagesReplaced: number;
  visibleApproved: number;
  affectedAccounts: string[];
  hiddenSlugs: string[];
  exclusionReasons: Record<string, number>;
}> {
  if (!hasDemoEnvironmentConfig()) {
    throw new Error("Supabase is not configured for homepage demo cleanup.");
  }

  const admin = getDemoAdminClient();
  const { data, error } = await admin
    .from("products")
    .select(
      "id, slug, title, description, status, seller_id, price, category_id, moderation_status, profiles!products_seller_id_fkey(email, username, verified, account_status, role), product_images(id, url)",
    )
    .in("status", ["published", "paused", "draft"]);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ListingRow[];
  let paused = 0;
  const affectedAccounts = new Set<string>();
  const hiddenSlugs: string[] = [];
  const exclusionReasons: Record<string, number> = {};

  for (const row of rows) {
    const email = row.profiles?.email ?? "";
    const forbidden = isForbiddenInventorySlug(row.slug, row.title, row.description);

    if (forbidden && row.status === "published") {
      await admin.from("products").update({ status: "paused" }).eq("id", row.id);
      paused += 1;
      hiddenSlugs.push(row.slug);
      exclusionReasons.DEMO_NOT_ALLOWED = (exclusionReasons.DEMO_NOT_ALLOWED ?? 0) + 1;
      if (email) affectedAccounts.add(email);
      else if (row.profiles?.username) affectedAccounts.add(row.profiles.username);
      continue;
    }

    const hasPlaceholderImage = (row.product_images ?? []).some((image) =>
      isExternalPlaceholderImageUrl(image.url),
    );
    if (hasPlaceholderImage && row.status === "published") {
      await admin.from("products").update({ status: "paused" }).eq("id", row.id);
      paused += 1;
      hiddenSlugs.push(row.slug);
      exclusionReasons.PLACEHOLDER_IMAGE = (exclusionReasons.PLACEHOLDER_IMAGE ?? 0) + 1;
      if (email) affectedAccounts.add(email);
      continue;
    }

    const input = HomepageEligibility.fromRow({
      slug: row.slug,
      title: row.title,
      description: row.description,
      status: row.status,
      price: Number(row.price),
      category_id: row.category_id,
      moderation_status: row.moderation_status,
      profiles: row.profiles,
      product_images: (row.product_images ?? []).map((image) => ({ url: image.url })),
    });

    const evaluation = HomepageEligibility.evaluate(input);
    if (row.status === "published" && !evaluation.eligible) {
      await admin.from("products").update({ status: "paused" }).eq("id", row.id);
      paused += 1;
      hiddenSlugs.push(row.slug);
      if (evaluation.reason) {
        exclusionReasons[evaluation.reason] = (exclusionReasons[evaluation.reason] ?? 0) + 1;
      }
      if (email) affectedAccounts.add(email);
      else if (row.profiles?.username) affectedAccounts.add(row.profiles.username);
    }
  }

  const { count: visibleApproved } = await admin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .like("slug", "demo-%");

  return {
    paused,
    polished: 0,
    imagesReplaced: 0,
    visibleApproved: visibleApproved ?? 0,
    affectedAccounts: [...affectedAccounts].sort(),
    hiddenSlugs: hiddenSlugs.sort(),
    exclusionReasons,
  };
}
