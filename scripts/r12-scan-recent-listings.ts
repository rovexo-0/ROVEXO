/**
 * Read-only scan: recent products + seller emails + queue health.
 *   npx tsx scripts/r12-scan-recent-listings.ts
 */
import { createClient } from "@supabase/supabase-js";
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

async function main() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: recent, error } = await admin
    .from("products")
    .select("id, slug, title, status, price, seller_id, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;

  const sellerIds = [...new Set((recent ?? []).map((r) => r.seller_id as string))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, username, role, full_name")
    .in("id", sellerIds.length ? sellerIds : ["00000000-0000-0000-0000-000000000000"]);

  const queue = await admin
    .from("seller_performance_event_queue")
    .select("id", { count: "exact", head: true });

  const out = {
    recent,
    profiles,
    queue: queue.error
      ? { ok: false, code: queue.error.code, message: queue.error.message }
      : { ok: true, count: queue.count ?? 0 },
  };
  writeFileSync(join(ROOT, "ROVEXO_R12_RECENT_LISTINGS_SCAN.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
