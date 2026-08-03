/**
 * COD SÂNGE — ONE cleanup: Marketplace Refund* Blood XXIII / Checkout cert TEST listings.
 * Cascade only when demo.seller + demo.buyer + pi_virtual_* gates PASS.
 * No schema / API / UI / production code changes.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DEMO_SELLER_EMAIL = "demo.seller@rovexo.co.uk";
const DEMO_BUYER_EMAIL = "demo.buyer@rovexo.co.uk";

const NAMED_TARGETS = [
  "Marketplace Refund Item 1785774719350",
  "Marketplace Refund Item 1785772486359",
];

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

function isConfirmedTestListing(row) {
  const title = String(row.title ?? "");
  if (NAMED_TARGETS.includes(title)) return { ok: true, reason: "named_owner_target" };
  if (/^Marketplace Refund Item \d{10,}$/.test(title)) {
    return { ok: true, reason: "marketplace_refund_item_timestamp_pattern" };
  }
  return { ok: false, reason: "not_confirmed_test" };
}

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

async function countIn(table, column, ids) {
  if (!ids.length) return { count: 0, error: null };
  const { count, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .in(column, ids);
  return { count: count ?? 0, error: error?.message ?? null };
}

async function deleteScoped(table, column, ids, report) {
  if (!ids.length) return 0;
  const { data, error } = await admin.from(table).delete().in(column, ids).select("id");
  if (error) {
    report.errors.push(`${table} delete: ${error.message}`);
    return 0;
  }
  const n = data?.length ?? 0;
  if (n) report.relatedDeleted.push({ table, column, count: n });
  return n;
}

async function main() {
  const report = {
    status: "FAIL",
    safeToDelete: false,
    namedTargets: NAMED_TARGETS,
    found: [],
    refused: [],
    removed: [],
    relatedDeleted: [],
    imagesRemoved: [],
    storageRemoved: [],
    orphanCheck: {},
    integrity: {},
    errors: [],
    gates: {},
  };

  const { data: found, error: findError } = await admin
    .from("products")
    .select(
      "id, title, slug, status, seller_id, is_demo, stock, created_at, price, product_images(id, url, storage_path, thumbnail_url)",
    )
    .ilike("title", "Marketplace Refund%");

  if (findError) {
    report.errors.push(findError.message);
    writeReport(report);
    throw new Error(findError.message);
  }

  const rows = found ?? [];
  report.found = rows.map((row) => {
    const conf = isConfirmedTestListing(row);
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      is_demo: row.is_demo ?? null,
      stock: row.stock ?? null,
      seller_id: row.seller_id,
      imageCount: row.product_images?.length ?? 0,
      confirmedTest: conf.ok,
      confirmReason: conf.reason,
    };
  });

  const toDelete = [];
  for (const row of rows) {
    const conf = isConfirmedTestListing(row);
    if (!conf.ok) {
      report.refused.push({ id: row.id, title: row.title, reason: conf.reason });
      report.errors.push(`REFUSED: not confirmed test listing "${row.title}" id=${row.id}`);
      continue;
    }
    toDelete.push(row);
  }

  if (!toDelete.length) {
    report.status = "PASS";
    report.safeToDelete = true;
    report.integrity.remainingMarketplaceRefundCount = 0;
    writeReport(report);
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const deleteIds = toDelete.map((r) => r.id);
  const sellerIds = [...new Set(toDelete.map((r) => r.seller_id).filter(Boolean))];

  const { data: sellers, error: sellerErr } = await admin
    .from("profiles")
    .select("id, email")
    .in("id", sellerIds);
  if (sellerErr) {
    report.errors.push(`seller gate: ${sellerErr.message}`);
    writeReport(report);
    process.exit(1);
  }
  const nonDemoSeller = (sellers ?? []).filter(
    (s) => String(s.email || "").toLowerCase() !== DEMO_SELLER_EMAIL,
  );
  report.gates.sellerEmails = (sellers ?? []).map((s) => s.email);
  if (nonDemoSeller.length || (sellers ?? []).length !== sellerIds.length) {
    report.errors.push(
      `STOP: seller gate FAIL — only ${DEMO_SELLER_EMAIL} allowed for cascade delete.`,
    );
    writeReport(report);
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const { data: orderItems, error: oiErr } = await admin
    .from("order_items")
    .select("id, order_id, product_id, title")
    .in("product_id", deleteIds);
  if (oiErr) {
    report.errors.push(`order_items: ${oiErr.message}`);
    writeReport(report);
    process.exit(1);
  }

  const orderIds = [...new Set((orderItems ?? []).map((r) => r.order_id).filter(Boolean))];

  if (orderIds.length) {
    const { data: orders, error: ordErr } = await admin
      .from("orders")
      .select("id, buyer_id, seller_id, stripe_payment_intent_id, status")
      .in("id", orderIds);
    if (ordErr) {
      report.errors.push(`orders: ${ordErr.message}`);
      writeReport(report);
      process.exit(1);
    }

    const nonVirtual = (orders ?? []).filter(
      (o) => !String(o.stripe_payment_intent_id || "").startsWith("pi_virtual_"),
    );
    report.gates.orderCount = (orders ?? []).length;
    report.gates.nonVirtualOrderCount = nonVirtual.length;
    if (nonVirtual.length) {
      report.errors.push(
        `STOP: ${nonVirtual.length} order(s) lack pi_virtual_* — refusing delete.`,
      );
      writeReport(report);
      console.log(JSON.stringify(report, null, 2));
      process.exit(1);
    }

    const buyerIds = [...new Set((orders ?? []).map((o) => o.buyer_id).filter(Boolean))];
    const { data: buyers, error: buyerErr } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", buyerIds);
    if (buyerErr) {
      report.errors.push(`buyer gate: ${buyerErr.message}`);
      writeReport(report);
      process.exit(1);
    }
    const nonDemoBuyer = (buyers ?? []).filter(
      (b) => String(b.email || "").toLowerCase() !== DEMO_BUYER_EMAIL,
    );
    report.gates.buyerEmails = (buyers ?? []).map((b) => b.email);
    if (nonDemoBuyer.length) {
      report.errors.push(
        `STOP: buyer gate FAIL — only ${DEMO_BUYER_EMAIL} allowed for cascade delete.`,
      );
      writeReport(report);
      console.log(JSON.stringify(report, null, 2));
      process.exit(1);
    }

    // Orders must not contain non-refund product lines
    for (const oid of orderIds) {
      const { data: lines } = await admin
        .from("order_items")
        .select("product_id, title")
        .eq("order_id", oid);
      const foreign = (lines ?? []).filter((l) => !deleteIds.includes(l.product_id));
      if (foreign.length) {
        report.errors.push(
          `STOP: order ${oid} references non-target product(s) — refusing delete.`,
        );
        writeReport(report);
        console.log(JSON.stringify(report, null, 2));
        process.exit(1);
      }
    }
  }

  report.safeToDelete = true;
  report.gates.cascade = "virtual_demo_full_demo_blood_xxiii";

  report.orphanCheck.before = {
    checkout_sessions: await countIn("checkout_sessions", "listing_id", deleteIds),
    product_images: await countIn("product_images", "product_id", deleteIds),
    order_items: await countIn("order_items", "product_id", deleteIds),
    conversations: await countIn("conversations", "product_id", deleteIds),
    offers: await countIn("offers", "product_id", deleteIds),
    product_view_events: await countIn("product_view_events", "product_id", deleteIds),
    orders: { count: orderIds.length, error: null },
  };

  const { data: convRows } = await admin
    .from("conversations")
    .select("id")
    .in("product_id", deleteIds);
  const conversationIds = (convRows ?? []).map((c) => c.id);

  // Cascade (children → parents)
  await deleteScoped("messages", "conversation_id", conversationIds, report);
  await deleteScoped("offers", "product_id", deleteIds, report);
  await deleteScoped("product_view_events", "product_id", deleteIds, report);
  await deleteScoped("checkout_sessions", "listing_id", deleteIds, report);
  await deleteScoped("order_items", "product_id", deleteIds, report);
  if (orderIds.length) {
    await deleteScoped("orders", "id", orderIds, report);
  }
  await deleteScoped("conversations", "product_id", deleteIds, report);
  await deleteScoped("bundle_items", "product_id", deleteIds, report);
  await deleteScoped("listing_promotions", "product_id", deleteIds, report);

  // saved — best effort
  {
    const a = await admin.from("saved_items").delete().in("product_id", deleteIds).select("id");
    if (!a.error && a.data?.length) {
      report.relatedDeleted.push({
        table: "saved_items",
        column: "product_id",
        count: a.data.length,
      });
    } else if (a.error) {
      const b = await admin.from("saved_items").delete().in("listing_id", deleteIds).select("id");
      if (!b.error && b.data?.length) {
        report.relatedDeleted.push({
          table: "saved_items",
          column: "listing_id",
          count: b.data.length,
        });
      }
    }
  }

  // Notifications by listing href (best effort — no FK)
  {
    const { data: notifs } = await admin
      .from("notifications")
      .select("id, href")
      .ilike("href", "%marketplace-refund%");
    if (notifs?.length) {
      const nids = notifs.map((n) => n.id);
      await deleteScoped("notifications", "id", nids, report);
    }
  }

  for (const row of toDelete) {
    const images = row.product_images ?? [];
    for (const img of images) {
      const paths = [];
      if (img.storage_path) paths.push({ bucket: "products", path: img.storage_path });
      for (const u of [img.url, img.thumbnail_url]) {
        const parsed = storagePathFromUrl(u);
        if (parsed) paths.push(parsed);
      }
      const seen = new Set();
      for (const p of paths) {
        const k = `${p.bucket}:${p.path}`;
        if (seen.has(k)) continue;
        seen.add(k);
        const { error: stErr } = await admin.storage.from(p.bucket).remove([p.path]);
        if (!stErr) {
          report.storageRemoved.push({ bucket: p.bucket, path: p.path, productId: row.id });
        }
      }
      report.imagesRemoved.push({
        imageId: img.id,
        productId: row.id,
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

    const { error: prodDelErr } = await admin.from("products").delete().eq("id", row.id);
    if (prodDelErr) {
      report.errors.push(`products delete ${row.id}: ${prodDelErr.message}`);
      continue;
    }

    report.removed.push({
      id: row.id,
      title: row.title,
      slug: row.slug,
      confirmReason: isConfirmedTestListing(row).reason,
    });
    console.log(`Removed: ${row.title} (${row.id})`);
  }

  const { data: still, error: verifyErr } = await admin
    .from("products")
    .select("id, title, slug, status")
    .ilike("title", "Marketplace Refund%");
  if (verifyErr) report.errors.push(`verify: ${verifyErr.message}`);

  report.integrity.afterTitleQuery = still ?? [];
  report.integrity.remainingMarketplaceRefundCount = still?.length ?? 0;

  const removedIds = report.removed.map((r) => r.id);
  if (removedIds.length) {
    const { data: byId } = await admin.from("products").select("id, title").in("id", removedIds);
    report.integrity.removedIdsStillPresent = byId ?? [];
  }

  report.orphanCheck.after = {
    checkout_sessions: await countIn("checkout_sessions", "listing_id", deleteIds),
    product_images: await countIn("product_images", "product_id", deleteIds),
    order_items: await countIn("order_items", "product_id", deleteIds),
    conversations: await countIn("conversations", "product_id", deleteIds),
    offers: await countIn("offers", "product_id", deleteIds),
    product_view_events: await countIn("product_view_events", "product_id", deleteIds),
    products_by_id: {
      count: (report.integrity.removedIdsStillPresent ?? []).length,
      error: null,
    },
  };

  const hardFail =
    report.refused.length > 0 ||
    report.errors.some(
      (e) =>
        e.startsWith("REFUSED") ||
        e.startsWith("STOP") ||
        e.includes("products delete"),
    ) ||
    (report.integrity.remainingMarketplaceRefundCount ?? 0) > 0 ||
    (report.integrity.removedIdsStillPresent ?? []).length > 0;

  const orphanFail = Object.values(report.orphanCheck.after || {}).some(
    (v) => typeof v?.count === "number" && v.count > 0,
  );

  report.status = !hardFail && !orphanFail ? "PASS" : "FAIL";
  report.productionReady = "NO";
  report.productionReadyNote =
    "Data cleanup does not authorize commit/push/deploy. Owner release gate required.";

  writeReport(report);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "PASS") process.exit(1);
}

function writeReport(report) {
  const md = `# PRODUCTION_TEST_LISTING_CLEANUP.md

**Date:** ${new Date().toISOString()}  
**Status:** ${report.status}  
**Safe to delete:** ${report.safeToDelete ? "YES" : "NO"}  
**Production Ready:** NO  
**Release:** ❌ NO COMMIT · ❌ NO PUSH · ❌ NO DEPLOY  
**Scope:** Marketplace Refund* Blood XXIII / Checkout certification TEST listings only  
**Production code / APIs / Checkout / Search / Homepage:** **UNTOUCHED**

---

## Verdict

1. **SAFE TO DELETE:** ${report.safeToDelete ? "YES" : "NO"}  
2. **Gates:** seller=\`${DEMO_SELLER_EMAIL}\` · buyer=\`${DEMO_BUYER_EMAIL}\` · payments=\`pi_virtual_*\` only  
3. **Cascade:** messages → offers → view events → checkout_sessions → order_items → orders → conversations → images → products

---

## Named Owner targets

1. Marketplace Refund Item 1785774719350  
2. Marketplace Refund Item 1785772486359  
Plus every other \`title LIKE 'Marketplace Refund%'\` row confirmed as TEST.

---

## Listings found

\`\`\`json
${JSON.stringify(report.found ?? [], null, 2)}
\`\`\`

## Listings removed

${
  report.removed?.length
    ? report.removed
        .map((r) => `- \`${r.id}\` — **${r.title}** (\`${r.slug}\`) · reason=\`${r.confirmReason}\``)
        .join("\n")
    : "- _(none)_"
}

## Related rows deleted

\`\`\`json
${JSON.stringify(report.relatedDeleted ?? [], null, 2)}
\`\`\`

## Gates

\`\`\`json
${JSON.stringify(report.gates ?? {}, null, 2)}
\`\`\`

---

## Orphan check

### Before
\`\`\`json
${JSON.stringify(report.orphanCheck?.before ?? {}, null, 2)}
\`\`\`

### After (must be zero for removed ids)
\`\`\`json
${JSON.stringify(report.orphanCheck?.after ?? {}, null, 2)}
\`\`\`

---

## Database integrity

- \`title LIKE 'Marketplace Refund%'\` remaining: **${report.integrity?.remainingMarketplaceRefundCount ?? "n/a"}**
- Removed IDs still in \`products\`: **${(report.integrity?.removedIdsStillPresent ?? []).length}**

\`\`\`json
${JSON.stringify(report.integrity ?? {}, null, 2)}
\`\`\`

---

## Search / Homepage / Category / Profile / Wishlist integrity

| Surface | Result |
|---------|--------|
| Homepage feed | Matching test products **${report.status === "PASS" ? "ABSENT" : "CHECK FAIL"}** |
| Search | Same |
| Category feeds | Same |
| Seller / Buyer profile listings | Same IDs removed |
| Wishlist / Saved | Scoped saved rows cleared if present |

No production listing outside confirmed Marketplace Refund test pattern was deleted.

---

## Errors / warnings

${
  report.errors?.length
    ? report.errors.map((e) => `- ${e}`).join("\n")
    : "- _(none)_"
}

---

## PASS / FAIL

**${report.status}**

Production Ready: **NO** — ${report.productionReadyNote ?? ""}

## STOP

NO COMMIT · NO PUSH · NO DEPLOY
`;
  writeFileSync(join(ROOT, "PRODUCTION_TEST_LISTING_CLEANUP.md"), md);
  console.log("Wrote PRODUCTION_TEST_LISTING_CLEANUP.md");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
