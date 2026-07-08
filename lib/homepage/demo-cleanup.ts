import {
  APPROVED_DEMO_SLUG_PATTERN,
  HomepageEligibility,
} from "@/lib/homepage/homepage-eligibility";
import { DEMO_EMAIL_DOMAIN } from "@/lib/demo-environment/config";
import { getDemoAdminClient, hasDemoEnvironmentConfig } from "@/lib/demo-environment/guards";
import {
  isExternalPlaceholderImageUrl,
  resolveOfficialDemoProductImage,
} from "@/lib/media/official-demo-images";

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

function productionTitle(title: string, slug: string): string {
  if (!APPROVED_DEMO_SLUG_PATTERN.test(slug)) return title.replace(/^Demo\s+/i, "").trim();

  const numbered = title.match(/#(\d+)$/);
  const suffix = numbered ? ` — Item ${numbered[1]}` : "";
  const leaf = title.replace(/^Demo\s+/i, "").replace(/\s+#\d+$/, "").trim();
  return `${leaf}${suffix}`.trim();
}

function productionDescription(title: string): string {
  const cleanTitle = title.replace(/\s+—\s+Item\s+\d+$/, "").trim();
  return [
    `${cleanTitle} in excellent condition, ready to ship across the UK.`,
    "Verified ROVEXO seller with secure checkout, tracked delivery, and purchase protection.",
    "Photos show the actual item. Message the seller for combined postage or collection.",
  ].join(" ");
}

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
  let polished = 0;
  let imagesReplaced = 0;
  const affectedAccounts = new Set<string>();
  const hiddenSlugs: string[] = [];
  const exclusionReasons: Record<string, number> = {};

  for (const row of rows) {
    const email = row.profiles?.email ?? "";
    const isCertifiedDemo =
      APPROVED_DEMO_SLUG_PATTERN.test(row.slug) && email.endsWith(`@${DEMO_EMAIL_DOMAIN}`);

    for (const image of row.product_images ?? []) {
      if (image.url && isExternalPlaceholderImageUrl(image.url)) {
        const nextUrl = resolveOfficialDemoProductImage(`${row.slug}-${image.id}`);
        await admin.from("product_images").update({ url: nextUrl }).eq("id", image.id);
        imagesReplaced += 1;
      }
    }

    if (isCertifiedDemo) {
      const nextTitle = productionTitle(row.title, row.slug);
      const nextDescription = productionDescription(nextTitle);
      if (nextTitle !== row.title || nextDescription !== row.description || row.status !== "published") {
        await admin
          .from("products")
          .update({
            title: nextTitle,
            description: nextDescription,
            status: "published",
            moderation_status: "approved",
            moderation_summary: "Closed beta demo listing",
          })
          .eq("id", row.id);
        polished += 1;
      }
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
    polished,
    imagesReplaced,
    visibleApproved: visibleApproved ?? 0,
    affectedAccounts: [...affectedAccounts].sort(),
    hiddenSlugs: hiddenSlugs.sort(),
    exclusionReasons,
  };
}
