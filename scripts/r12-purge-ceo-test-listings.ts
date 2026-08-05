/**
 * R1.2 R8 — Hard-purge CEO smoke-test listings + Storage + dependent refs.
 *
 * Owner-approved for the two CEO test listings only.
 *
 *   npx tsx scripts/r12-purge-ceo-test-listings.ts --list
 *   npx tsx scripts/r12-purge-ceo-test-listings.ts --list --include-deleted
 *   npx tsx scripts/r12-purge-ceo-test-listings.ts --auto-two-deleted
 *   npx tsx scripts/r12-purge-ceo-test-listings.ts --ids <uuid1>,<uuid2>
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = join(ROOT, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  ""
).trim();

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin: SupabaseClient = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function argValue(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return null;
  return process.argv[idx + 1] ?? null;
}

async function restDelete(table: string, query: string): Promise<{ ok: boolean; status: number; body: string }> {
  const endpoint = `${url}/rest/v1/${table}?${query}`;
  const res = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=minimal",
    },
  });
  const body = await res.text();
  return { ok: res.ok || res.status === 404 || res.status === 204, status: res.status, body };
}

async function restSelect(table: string, query: string): Promise<unknown[]> {
  const endpoint = `${url}/rest/v1/${table}?${query}`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as unknown;
  return Array.isArray(json) ? json : [];
}

async function resolveCeoSellerIds(): Promise<Array<{ id: string; email: string | null; role: string | null }>> {
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, username, role")
    .or(
      [
        "role.eq.super_admin",
        "email.ilike.%ceo%",
        "username.ilike.%ceo%",
        // Owner personal account used for R1.2 smoke (not role=super_admin).
        "email.eq.palademihaita88@gmail.com",
        "username.eq.mishuu",
      ].join(","),
    );
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    email: (row.email as string | null) ?? null,
    role: (row.role as string | null) ?? null,
  }));
}

async function listCeoProducts(sellerIds: string[], includeDeleted: boolean) {
  let query = admin
    .from("products")
    .select("id, slug, title, status, price, created_at, seller_id")
    .in("seller_id", sellerIds.length ? sellerIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (!includeDeleted) {
    query = query.neq("status", "deleted");
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function purgeProduct(productId: string) {
  const { data: product, error } = await admin
    .from("products")
    .select("id, slug, seller_id, title, status, product_images ( id, storage_path, url, thumbnail_url )")
    .eq("id", productId)
    .maybeSingle();
  if (error || !product) {
    return { id: productId, ok: false, error: error?.message ?? "not found" };
  }

  const images = (product.product_images ?? []) as Array<{
    storage_path?: string | null;
  }>;
  const paths = new Set<string>();
  for (const image of images) {
    if (image.storage_path) paths.add(image.storage_path);
    if (image.storage_path?.endsWith(".jpg")) {
      paths.add(image.storage_path.replace(/\.jpg$/, "-thumb.jpg"));
    }
  }

  const slug = String(product.slug);
  const sellerId = String(product.seller_id);
  const deps: Record<string, { status: number; body: string }> = {};

  // Exclusive-to-listing refs (safe). Use REST so missing typed tables still clean.
  const offerRows = (await restSelect(
    "offers",
    `select=id&product_id=eq.${productId}`,
  )) as Array<{ id: string }>;
  const conversationRows = (await restSelect(
    "conversations",
    `select=id&product_id=eq.${productId}`,
  )) as Array<{ id: string }>;

  deps.saved_items = await restDelete("saved_items", `product_id=eq.${productId}`);
  deps.cart_items = await restDelete("cart_items", `product_id=eq.${productId}`);
  deps.recently_viewed = await restDelete("recently_viewed", `product_id=eq.${productId}`);
  deps.listing_promotions = await restDelete("listing_promotions", `product_id=eq.${productId}`);
  deps.product_views = await restDelete("product_views", `product_id=eq.${productId}`);
  deps.bundle_items = await restDelete("bundle_items", `product_id=eq.${productId}`);
  deps.checkout_sessions = await restDelete("checkout_sessions", `listing_id=eq.${productId}`);
  deps.product_images = await restDelete("product_images", `product_id=eq.${productId}`);

  for (const offer of offerRows) {
    deps[`offer_messages_${offer.id}`] = await restDelete("messages", `offer_id=eq.${offer.id}`);
  }
  deps.offers = await restDelete("offers", `product_id=eq.${productId}`);

  for (const conversation of conversationRows) {
    deps[`messages_${conversation.id}`] = await restDelete(
      "messages",
      `conversation_id=eq.${conversation.id}`,
    );
    deps[`notifications_conversation_${conversation.id}`] = await restDelete(
      "notifications",
      `href=like.*${conversation.id}*`,
    );
  }
  deps.conversations = await restDelete("conversations", `product_id=eq.${productId}`);

  deps.notifications_listing = await restDelete("notifications", `href=like.*/listing/${slug}*`);
  deps.notifications_checkout = await restDelete("notifications", `href=like.*/checkout/${slug}*`);
  deps.notifications_highlight = await restDelete("notifications", `href=like.*${productId}*`);

  // Storage cleanup (DB rows first so no dangling image metadata).
  if (paths.size) {
    await admin.storage.from("products").remove([...paths]);
  }
  const folder = `${sellerId}/${productId}`;
  const { data: folderFiles } = await admin.storage.from("products").list(folder);
  if (folderFiles?.length) {
    await admin.storage.from("products").remove(folderFiles.map((file) => `${folder}/${file.name}`));
  }
  // Temp drafts for this seller that reference this product id in path (best-effort).
  const { data: tempRoot } = await admin.storage.from("products").list(`${sellerId}/temp`);
  if (tempRoot?.length) {
    // leave other temps; only remove files whose names appear in purged paths
  }

  await admin.from("products").update({ status: "deleted" }).eq("id", productId);
  const { error: hardError } = await admin.from("products").delete().eq("id", productId);

  // Verify zero remnants
  const { data: stillProduct } = await admin.from("products").select("id").eq("id", productId).maybeSingle();
  const { data: stillImages } = await admin
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .limit(1);

  return {
    id: productId,
    slug,
    title: product.title,
    previousStatus: product.status,
    ok: !hardError && !stillProduct && !(stillImages && stillImages.length),
    softDeleted: Boolean(hardError),
    hardError: hardError?.message ?? null,
    storagePathsRemoved: [...paths],
    remnantProduct: Boolean(stillProduct),
    remnantImages: stillImages?.length ?? 0,
    deps,
  };
}

async function main() {
  const listOnly = process.argv.includes("--list");
  const includeDeleted = process.argv.includes("--include-deleted");
  const autoTwoDeleted = process.argv.includes("--auto-two-deleted");
  const idsArg = argValue("--ids");
  const titlesArg = argValue("--titles");

  const sellers = await resolveCeoSellerIds();
  const sellerIds = sellers.map((s) => s.id);
  console.log("CEO/super_admin sellers:", sellers);

  const products = await listCeoProducts(sellerIds, includeDeleted || autoTwoDeleted);
  console.log("CEO listings:\n", JSON.stringify(products, null, 2));

  if (listOnly) {
    writeFileSync(
      join(ROOT, "ROVEXO_R12_CEO_LISTINGS_LIST.json"),
      JSON.stringify({ sellers, products }, null, 2),
    );
    console.log("Wrote ROVEXO_R12_CEO_LISTINGS_LIST.json");
    return;
  }

  let targetIds: string[] = [];
  if (idsArg) {
    targetIds = idsArg.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (titlesArg) {
    const titles = titlesArg.split(",").map((s) => s.trim()).filter(Boolean);
    targetIds = products.filter((row) => titles.includes(String(row.title))).map((row) => row.id as string);
  } else if (autoTwoDeleted) {
    const deleted = products.filter((row) => row.status === "deleted").slice(0, 2);
    const live = products.filter((row) => row.status !== "deleted").slice(0, 2);
    const pick = deleted.length >= 2 ? deleted : [...deleted, ...live].slice(0, 2);
    targetIds = pick.map((row) => row.id as string);
    console.log("Auto-selected targets:", pick);
  } else {
    console.error("Use --list, --ids, --titles, or --auto-two-deleted");
    process.exit(2);
  }

  if (targetIds.length === 0 || targetIds.length > 2) {
    console.error("Expected exactly 1–2 listing ids for R8. Got:", targetIds);
    process.exit(2);
  }

  // Ownership gate: only purge if seller is CEO/super_admin.
  const results = [];
  for (const id of targetIds) {
    const { data: row } = await admin.from("products").select("seller_id").eq("id", id).maybeSingle();
    if (!row || !sellerIds.includes(row.seller_id as string)) {
      results.push({ id, ok: false, error: "Not a CEO/super_admin listing — refused" });
      continue;
    }
    results.push(await purgeProduct(id));
  }

  const report = {
    status: results.every((r) => (r as { ok?: boolean }).ok) ? "PASS" : "FAIL",
    results,
  };
  writeFileSync(join(ROOT, "ROVEXO_R12_CEO_PURGE_REPORT.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "PASS" ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
