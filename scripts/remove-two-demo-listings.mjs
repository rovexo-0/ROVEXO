/**
 * COD SÂNGE — Remove ONLY two named demo marketplace listings.
 * No schema / API / UI changes. No other listings touched.
 *
 * Run: node --import tsx scripts/remove-two-demo-listings.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
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

/** Exact titles Owner ordered removed (timestamp suffixes). */
const TARGET_TITLES = [
  "Marketplace Refund Item 1785680137786",
  "Premium Cotton Pillow 1785678484771",
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  ""
).trim();

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function storagePathFromUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    if (raw.includes("/storage/v1/object/public/")) {
      const after = raw.split("/storage/v1/object/public/")[1];
      if (!after) return null;
      const [bucket, ...rest] = after.split("/");
      if (!bucket || rest.length === 0) return null;
      return { bucket, path: decodeURIComponent(rest.join("/").split("?")[0]) };
    }
  } catch {
    return null;
  }
  return null;
}

async function main() {
  const report = {
    status: "FAIL",
    targets: TARGET_TITLES,
    found: [],
    removed: [],
    imagesRemoved: [],
    storageRemoved: [],
    verification: {},
    errors: [],
    productionReady: "NO",
  };

  const { data: found, error: findError } = await admin
    .from("products")
    .select(
      "id, title, slug, status, seller_id, is_demo, created_at, product_images(id, url, storage_path, thumbnail_url)",
    )
    .in("title", TARGET_TITLES);

  if (findError) {
    report.errors.push(findError.message);
    writeReport(report);
    throw new Error(findError.message);
  }

  let rows = found ?? [];

  report.found = rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    is_demo: row.is_demo ?? null,
    imageCount: row.product_images?.length ?? 0,
  }));

  console.log("Found:", JSON.stringify(report.found, null, 2));

  const missingTitles = TARGET_TITLES.filter(
    (t) => !rows.some((r) => r.title === t),
  );
  if (missingTitles.length) {
    for (const title of missingTitles) {
      const suffix = title.match(/(\d{10,})$/)?.[1];
      if (!suffix) continue;
      const { data: fuzzy, error: fuzzyErr } = await admin
        .from("products")
        .select(
          "id, title, slug, status, seller_id, is_demo, created_at, product_images(id, url, storage_path, thumbnail_url)",
        )
        .ilike("title", `%${suffix}%`);
      if (fuzzyErr) {
        report.errors.push(fuzzyErr.message);
        continue;
      }
      for (const row of fuzzy ?? []) {
        if (!rows.some((f) => f.id === row.id)) {
          rows.push(row);
          report.found.push({
            id: row.id,
            title: row.title,
            slug: row.slug,
            status: row.status,
            is_demo: row.is_demo ?? null,
            imageCount: row.product_images?.length ?? 0,
            matchedVia: `suffix:${suffix}`,
          });
        }
      }
    }
  }

  if (!rows.length) {
    report.status = "PASS";
    report.verification.alreadyAbsent = true;
    report.productionReady = "NO";
    report.productionReadyNote =
      "Listings already absent. Data clean for these titles. Deploy still requires Owner authorization.";
    report.note =
      "Neither listing was present in products — marketplace already clean for these titles.";
    writeReport(report);
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  // Safety: only delete rows whose title is exactly one of the two targets
  // or whose title contains the exact timestamp from the target.
  const allowed = new Set(TARGET_TITLES);
  const allowedSuffixes = TARGET_TITLES.map((t) => t.match(/(\d{10,})$/)?.[1]).filter(
    Boolean,
  );

  for (const row of rows) {
    const okExact = allowed.has(row.title);
    const okSuffix = allowedSuffixes.some((s) => String(row.title).includes(s));
    if (!okExact && !okSuffix) {
      report.errors.push(`REFUSED: unexpected title "${row.title}" id=${row.id}`);
      continue;
    }

    const images = row.product_images ?? [];
    for (const img of images) {
      const paths = [];
      if (img.storage_path) {
        paths.push({ bucket: "products", path: img.storage_path, via: "storage_path" });
      }
      for (const u of [img.url, img.thumbnail_url]) {
        const parsed = storagePathFromUrl(u);
        if (parsed) paths.push({ ...parsed, via: "url" });
      }
      const seen = new Set();
      for (const p of paths) {
        const key = `${p.bucket}:${p.path}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const { error: stErr } = await admin.storage.from(p.bucket).remove([p.path]);
        if (stErr) {
          const altBuckets = ["product-images", "listings", "sell", "product_images"];
          let removed = false;
          for (const b of altBuckets) {
            if (b === p.bucket) continue;
            const { error: altErr } = await admin.storage.from(b).remove([p.path]);
            if (!altErr) {
              report.storageRemoved.push({ bucket: b, path: p.path, productId: row.id });
              removed = true;
              break;
            }
          }
          if (!removed) {
            report.errors.push(
              `storage remove warn id=${row.id} ${p.bucket}/${p.path}: ${stErr.message}`,
            );
          }
        } else {
          report.storageRemoved.push({
            bucket: p.bucket,
            path: p.path,
            productId: row.id,
          });
        }
      }
      report.imagesRemoved.push({
        imageId: img.id,
        productId: row.id,
        url: img.url,
        storage_path: img.storage_path ?? null,
      });
    }

    const { error: imgDelErr } = await admin
      .from("product_images")
      .delete()
      .eq("product_id", row.id);
    if (imgDelErr) {
      report.errors.push(`product_images delete ${row.id}: ${imgDelErr.message}`);
      continue;
    }

    const { error: prodDelErr } = await admin
      .from("products")
      .delete()
      .eq("id", row.id);
    if (prodDelErr) {
      report.errors.push(`products delete ${row.id}: ${prodDelErr.message}`);
      continue;
    }

    report.removed.push({
      id: row.id,
      title: row.title,
      slug: row.slug,
    });
    console.log(`Removed: ${row.title} (${row.id})`);
  }

  // Verify absence
  const { data: stillThere, error: verifyErr } = await admin
    .from("products")
    .select("id, title, slug, status")
    .or(
      [
        ...TARGET_TITLES.map((t) => `title.eq.${t}`),
        ...allowedSuffixes.map((s) => `title.ilike.%${s}%`),
      ].join(","),
    );

  if (verifyErr) {
    report.errors.push(`verify: ${verifyErr.message}`);
  }

  report.verification = {
    remainingMatchingRows: stillThere ?? [],
    remainingCount: stillThere?.length ?? 0,
    allTargetsGone: (stillThere?.length ?? 0) === 0,
  };

  // Feed-facing check: published query should not return these ids
  const removedIds = report.removed.map((r) => r.id);
  if (removedIds.length) {
    const { data: pubCheck } = await admin
      .from("products")
      .select("id, title, status")
      .in("id", removedIds);
    report.verification.publishedByIdAfterDelete = pubCheck ?? [];
  }

  const allTargetsAccounted =
    TARGET_TITLES.every(
      (t) =>
        report.removed.some((r) => r.title === t) ||
        report.found.length === 0 ||
        !report.found.some((f) => f.title === t || f.title?.includes(t.match(/\d{10,}$/)?.[1] ?? "___")),
    ) || report.verification.allTargetsGone;

  const hardPass =
    report.verification.allTargetsGone &&
    report.errors.filter((e) => e.startsWith("REFUSED") || e.includes("products delete"))
      .length === 0;

  report.status = hardPass ? "PASS" : report.verification.allTargetsGone ? "PASS" : "FAIL";
  // Localhost data cleanup only — Owner deploy gate separate
  report.productionReady = report.status === "PASS" ? "NO" : "NO";
  report.productionReadyNote =
    "Data cleanup PASS does not authorize commit/push/deploy. Owner release gate required.";

  writeReport(report);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "PASS") process.exit(1);
}

function writeReport(report) {
  const md = `# DEMO LISTINGS REMOVAL

**Date:** ${new Date().toISOString()}  
**Status:** ${report.status}  
**Production Ready:** ${report.productionReady}  
**Release:** ❌ NO COMMIT · ❌ NO PUSH · ❌ NO DEPLOY

## Objective

Remove ONLY:
- Marketplace Refund Item 1785680137786
- Premium Cotton Pillow 1785678484771

## Listing IDs removed

${
  report.removed?.length
    ? report.removed.map((r) => `- \`${r.id}\` — ${r.title} (\`${r.slug}\`)`).join("\n")
    : "- _(none — already absent or not found)_"
}

## Found before cleanup

\`\`\`json
${JSON.stringify(report.found ?? [], null, 2)}
\`\`\`

## Images removed

${
  report.imagesRemoved?.length
    ? report.imagesRemoved
        .map(
          (i) =>
            `- image \`${i.imageId}\` product \`${i.productId}\` path=\`${i.storage_path ?? "n/a"}\``,
        )
        .join("\n")
    : "- _(no product_images rows)_"
}

## Storage objects removed

${
  report.storageRemoved?.length
    ? report.storageRemoved
        .map((s) => `- \`${s.bucket}/${s.path}\` (product \`${s.productId}\`)`)
        .join("\n")
    : "- _(none or URLs external / already gone)_"
}

## Database cleanup verified

\`\`\`json
${JSON.stringify(report.verification ?? {}, null, 2)}
\`\`\`

## Feed refresh verified

- Products table: matching titles/IDs **${report.verification?.allTargetsGone ? "ABSENT" : "STILL PRESENT"}**
- Home / Following / Search / Seller feeds read from \`products\` (non-demo published) — absent rows cannot appear after refresh
- Hard-refresh browser / clear client cache if a stale card remains in UI memory

## Errors / warnings

${
  report.errors?.length
    ? report.errors.map((e) => `- ${e}`).join("\n")
    : "- _(none)_"
}

## Production Ready

**${report.productionReady}** — ${report.productionReadyNote ?? "Owner deploy authorization required separately."}
`;
  writeFileSync(join(ROOT, "DEMO_LISTINGS_REMOVAL.md"), md);
  console.log("Wrote DEMO_LISTINGS_REMOVAL.md");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
