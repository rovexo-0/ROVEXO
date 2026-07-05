import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import {
  DEMO_LISTING_TARGET,
  resolveOfficialDemoProductImage,
} from "@/lib/demo-environment/config";
import type { DemoUserRecord } from "@/lib/demo-environment/users";
import { demoStoreBannerNote } from "@/lib/demo-environment/users";

const CONDITIONS = ["new", "like_new", "good", "fair"] as const;
const CITIES = ["London", "Manchester", "Birmingham", "Leeds", "Bristol", "Edinburgh", "Cardiff"];
const PARCEL_SIZES = ["small", "medium", "large", "xl"] as const;

type CategoryRow = { id: string; slug: string; path_label: string };

function listingSlug(userKey: string, index: number): string {
  return `demo-${userKey}-${String(index + 1).padStart(3, "0")}`;
}

function listingTitle(categoryPath: string, index: number): string {
  const leaf = categoryPath.split(">").pop()?.trim() ?? "Item";
  return `Demo ${leaf} #${index + 1}`;
}

async function loadCategories(admin: SupabaseClient<Database>): Promise<CategoryRow[]> {
  const { data, error } = await admin
    .from("categories")
    .select("id, slug, path_label")
    .is("parent_id", null)
    .limit(12);

  if (error || !data?.length) {
    throw new Error("Demo listing seed requires seeded categories.");
  }

  const leafCategories: CategoryRow[] = [];
  for (const top of data) {
    const { data: children } = await admin
      .from("categories")
      .select("id, slug, path_label")
      .eq("parent_id", top.id)
      .limit(8);

    if (children?.length) {
      leafCategories.push(...children);
    } else {
      leafCategories.push(top);
    }
  }

  return leafCategories.slice(0, 24);
}

export async function seedDemoListings(input: {
  admin: SupabaseClient<Database>;
  sellers: DemoUserRecord[];
  targetCount?: number;
}): Promise<{ created: number; productIds: string[] }> {
  const target = input.targetCount ?? DEMO_LISTING_TARGET;
  const perSeller = Math.ceil(target / input.sellers.length);
  const categories = await loadCategories(input.admin);
  const productIds: string[] = [];
  let created = 0;

  for (const seller of input.sellers) {
    for (let i = 0; i < perSeller && created < target; i += 1) {
      const slug = listingSlug(seller.key, i);
      const category = categories[(created + i) % categories.length]!;

      const { data: existing } = await input.admin
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existing?.id) {
        productIds.push(existing.id);
        created += 1;
        continue;
      }

      const price = Number((19.99 + ((created + i) % 40) * 7.5).toFixed(2));
      const { data: product, error } = await input.admin
        .from("products")
        .insert({
          seller_id: seller.id,
          slug,
          title: listingTitle(category.path_label, i),
          description: `ROVEXO demo listing for QA certification. ${demoStoreBannerNote(seller)} Category: ${category.path_label}.`,
          condition: CONDITIONS[(created + i) % CONDITIONS.length]!,
          price,
          original_price: price + 10,
          accept_offers: (created + i) % 3 === 0,
          stock: 1 + ((created + i) % 4),
          status: "published",
          listing_type: "fixed",
          moderation_status: "approved",
          moderation_summary: "Demo seed listing",
          moderation_confidence: 0.99,
          category_id: category.id,
          location_city: CITIES[(created + i) % CITIES.length]!,
          parcel_size: PARCEL_SIZES[(created + i) % PARCEL_SIZES.length]!,
          shipping_price: (created + i) % 5 === 0 ? 0 : 4.99,
          sections: (created + i) % 4 === 0 ? ["popular", "featured"] : ["popular"],
          delivery_carriers: ["Royal Mail", "Evri", "DPD"],
          views: 20 + ((created + i) % 500),
          likes: (created + i) % 40,
          rating: 4 + ((created + i) % 10) / 10,
          review_count: (created + i) % 12,
        })
        .select("id")
        .single();

      if (error || !product) {
        throw new Error(`Failed to seed demo listing ${slug}: ${error?.message ?? "unknown"}`);
      }

      await input.admin.from("product_images").insert({
        product_id: product.id,
        url: resolveOfficialDemoProductImage(`${seller.key}-${i}`),
        storage_path: `demo/${seller.id}/${slug}.jpg`,
        sort_order: 0,
        is_primary: true,
      });

      productIds.push(product.id);
      created += 1;
    }
  }

  for (const seller of input.sellers) {
    const { count } = await input.admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", seller.id)
      .like("slug", "demo-%");

    await input.admin
      .from("seller_profiles")
      .update({
        listing_count: count ?? 0,
        sales_count: Math.max(12, Math.floor((count ?? 0) / 4)),
        follower_count: 120 + (count ?? 0),
      })
      .eq("id", seller.id);
  }

  return { created: productIds.length, productIds };
}
