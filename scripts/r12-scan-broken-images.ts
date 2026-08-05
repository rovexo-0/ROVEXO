/**
 * R1.2 Blocker #2 — scan ALL products for Image 400 / missing Storage objects.
 *   npx tsx scripts/r12-scan-broken-images.ts
 *   npx tsx scripts/r12-scan-broken-images.ts --repair
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "ROVEXO_R12_BROKEN_IMAGES_SCAN.json");
const REPAIR = process.argv.includes("--repair");

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
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  }
}

function storagePathFromPublicUrl(url: string): { bucket: string; path: string } | null {
  const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!m) return null;
  return { bucket: m[1]!, path: decodeURIComponent(m[2]!) };
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function objectExists(bucket: string, path: string): Promise<boolean> {
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 30);
  if (error || !data?.signedUrl) return false;
  return true;
}

async function main() {
  const { data: products, error } = await admin
    .from("products")
    .select("id,slug,title,status,seller_id")
    .limit(5000);
  if (error) throw error;

  const { data: imageRows, error: imgErr } = await admin
    .from("product_images")
    .select("id,product_id,url,storage_path,thumbnail_url,is_primary")
    .limit(20000);
  if (imgErr) throw imgErr;

  const productById = new Map((products ?? []).map((p) => [p.id, p]));
  const broken: Array<Record<string, unknown>> = [];
  const checked = new Set<string>();

  async function checkUrl(ref: {
    productId: string;
    slug?: string;
    title?: string;
    status?: string;
    sellerId?: string;
    source: string;
    url: string;
    imageRowId?: string;
  }) {
    if (!ref.url || checked.has(ref.url)) return;
    checked.add(ref.url);
    const parsed = storagePathFromPublicUrl(ref.url);
    if (!parsed) {
      broken.push({ ...ref, reason: "non_storage_or_invalid_url" });
      return;
    }
    const ok = await objectExists(parsed.bucket, parsed.path);
    if (!ok) {
      broken.push({ ...ref, reason: "storage_object_missing", bucket: parsed.bucket, path: parsed.path });
    }
  }

  for (const row of imageRows ?? []) {
    const product = productById.get(row.product_id);
    if (row.url) {
      await checkUrl({
        productId: row.product_id,
        slug: product?.slug,
        title: product?.title,
        status: product?.status,
        sellerId: product?.seller_id,
        source: "product_images.url",
        url: row.url,
        imageRowId: row.id,
      });
    }
    if (row.thumbnail_url) {
      await checkUrl({
        productId: row.product_id,
        slug: product?.slug,
        title: product?.title,
        status: product?.status,
        sellerId: product?.seller_id,
        source: "product_images.thumbnail_url",
        url: row.thumbnail_url,
        imageRowId: row.id,
      });
    }
    if (row.storage_path) {
      const path = String(row.storage_path).replace(/^products\//, "");
      const fullUrl = `${url}/storage/v1/object/public/products/${path}`;
      await checkUrl({
        productId: row.product_id,
        slug: product?.slug,
        title: product?.title,
        status: product?.status,
        sellerId: product?.seller_id,
        source: "product_images.storage_path",
        url: fullUrl,
        imageRowId: row.id,
      });
    }
  }

  const missingObjects = broken.filter((b) => b.reason === "storage_object_missing");
  const missingThumbs = broken.filter((b) => b.reason === "thumb_missing");
  const productIds = [...new Set(missingObjects.map((b) => String(b.productId)))];

  let repaired = 0;
  if (REPAIR && missingObjects.length) {
    const imageIds = [
      ...new Set(
        missingObjects
          .map((b) => b.imageRowId)
          .filter((id): id is string => typeof id === "string" && id.length > 0),
      ),
    ];
    for (const id of imageIds) {
      const { error: delErr } = await admin.from("product_images").delete().eq("id", id);
      if (!delErr) repaired++;
    }
    for (const productId of productIds) {
      const { count } = await admin
        .from("product_images")
        .select("id", { count: "exact", head: true })
        .eq("product_id", productId);
      if ((count ?? 0) === 0) {
        // Fail closed: do not leave published listings with zero images on the marketplace.
        await admin.from("products").update({ status: "deleted" }).eq("id", productId);
        repaired++;
      }
    }
  }

  const report = {
    status: missingObjects.length === 0 ? "PASS" : "FAIL",
    scannedProducts: products?.length ?? 0,
    scannedImageRows: imageRows?.length ?? 0,
    uniqueUrlsChecked: checked.size,
    brokenCount: broken.length,
    storageObjectMissing: missingObjects.length,
    thumbMissing: missingThumbs.length,
    affectedProductIds: productIds,
    repaired,
    repairMode: REPAIR,
    sample: broken.slice(0, 50),
    allBroken: broken,
  };
  writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        status: report.status,
        storageObjectMissing: report.storageObjectMissing,
        thumbMissing: report.thumbMissing,
        affectedProducts: productIds.length,
        repaired,
        out: OUT,
      },
      null,
      2,
    ),
  );
  process.exit(missingObjects.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
